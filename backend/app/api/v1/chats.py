from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from langchain_core.messages import HumanMessage

from rag.chat import chat_with_ai

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from backend.app.schemas.message import Message, Conversation
from backend.app.schemas.chat import ChatCreate

from backend.app.models.models import Project, Chat, User, Document, Message


from backend.app.core.database import db_session_maker
from backend.app.dependencies.auth import get_current_user

from rag.vector_store.ingest_document import ingest_document
from rag.vector_store.is_already_ingested import is_already_ingested

from rag.embeddings.pdf_file_embeddings import create_pdf_file_emneddings
from rag.graph.rag import run_rag

import os
from pathlib import Path

import boto3
import tempfile

from dotenv import load_dotenv


ALLOWED_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

s3_client = boto3.client("s3", region_name="eu-central-1")

BUCKET_NAME = os.getenv("BUCKET_NAME")

router = APIRouter()


        
@router.get("/messages/{chat_id}")
async def get_chat(chat_id: int, session: AsyncSession = Depends(db_session_maker)):

    try:
        stmt = (
            select(Chat)
            .where(Chat.chat_id == chat_id)
            .options(selectinload(Chat.messages))
        )

        response = await session.execute(stmt)
        chats = response.scalars().all()

        if not chats:
            raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found")

        return chats

    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat fetch errors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat messages") from e

@router.post("/")
async def chat(conversation: Conversation, session: AsyncSession = Depends(db_session_maker)):

    try:
        # put data in the db
        human_message = Message(
            role="human",
            content=conversation.message,
            context=conversation.attachments,
            chat_id=conversation.chat_id)

        session.add(human_message)
        await session.commit()


        response, context = await run_rag(project_id=conversation.project_id, messages=conversation.messages, db=session)

        # put ai response in DB
        
        ai_message = Message(
            role="ai",
            content=response["messages"][-1].content,
            context=context,
            chat_id=conversation.chat_id
        )
        
        session.add(ai_message)
        await session.commit()

        return ai_message

    except HTTPException:
        # let intentional HTTP errors (e.g. from run_rag) pass through unchanged
        raise
    except Exception as e:
        print(f"Chat Errors: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to process chat message") from e




@router.post("/init")
async def chat_init(
    chat_create: ChatCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_session_maker)
):

    try:
        project = await session.get(Project, chat_create.project_id)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.user_id != user.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to add a chat to this project")

        system_prompt = """Generate a concise 3-5 word chat title based on the user's message. 
            Return ONLY the title, no punctuation, no explanation.
            Example: "Python Async Error Help" """

        prompt = [{
            "role": "user",
            "content": chat_create.message
        }]

        response = chat_with_ai(messages=prompt, system_prompt=system_prompt)

        ai_message = response['messages'][-1].content

        new_chat = Chat(
            title=ai_message,
            project_id=chat_create.project_id
        )

        session.add(new_chat)
        await session.commit()
        await session.refresh(new_chat)

        return new_chat

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        print(f"Chat Init Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while creating the chat")


@router.get("/{projectId}")
async def get_chats(projectId: int, session: AsyncSession = Depends(db_session_maker)):

    try:

        stmt = (
            select(Project)
            .where(Project.project_id == projectId)
            .options(selectinload(Project.chats))
        )

        response = await session.execute(stmt)
        chats = response.scalars().all()

        return chats
    
    except Exception as e:

        print(f"Get Chats Error: {e}")


@router.post("/upload")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_session_maker)
):

    try:
        project = await session.get(Project, project_id)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to upload to this project")

        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: PDF")

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        file_path = f"users/{current_user.user_id}/{project_id}/{file.filename}"

        existing = await session.execute(select(Document).where(Document.file_path == file_path))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A file with this name already exists in this project")

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            new_document = None

            if not await is_already_ingested(file_path=file_path, db=session):

                embeddings = await create_pdf_file_emneddings(file_path=tmp_path)

                # upload to S3 BEFORE touching the DB
                s3_client.upload_fileobj(
                    open(tmp_path, "rb"),
                    BUCKET_NAME,
                    file_path,
                    ExtraArgs={"ContentType": file.content_type}
                )

                embeddings["path"] = Path(file_path)

                # DB write happens last, only after S3 succeeds
                new_document = await ingest_document(
                    embeddings=embeddings,
                    file_type=file.content_type,
                    project_id=project_id,
                    user_id=current_user.user_id,
                    db=session
                )

        finally:
            os.remove(tmp_path)

        return new_document

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        print(f"Document Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while uploading the document")
