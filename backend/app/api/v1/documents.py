from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from fastapi.responses import FileResponse
import os

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


router = APIRouter()

import boto3

s3_client = boto3.client("s3", region_name="eu-central-1")
BUCKET_NAME = os.getenv("BUCKET_NAME")


@router.get("/{project_id}")
async def get_documents(project_id: int, session: AsyncSession = Depends(db_session_maker)):

    try:
        
        result = await session.execute(select(Document).where(Document.project_id == project_id))
        
        documents = result.scalars().all()

        document_data = []

        for project in documents:

            document_data.append({k: v for k, v in project.__dict__.items() if not k.startswith("_sa_instance_state")})

        return document_data

    except Exception as e:

        print(f"Get Projects Error: {e}")

from fastapi.responses import RedirectResponse

@router.get("/{document_id}/download")
async def download_document(document_id: int, session: AsyncSession = Depends(db_session_maker)):
    try:
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        try:
            s3_client.head_object(Bucket=BUCKET_NAME, Key=document.file_path)
        except s3_client.exceptions.ClientError:
            raise HTTPException(status_code=404, detail="File not found in storage")

        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": document.file_path,
                "ResponseContentDisposition": f'attachment; filename="{document.filename}"',
                "ResponseContentType": document.file_type or "application/octet-stream",
            },
            ExpiresIn=300,
        )

        return {"url": presigned_url}  # <-- JSON, not a redirect

    except HTTPException:
        raise
    except Exception as e:
        print(f"Download Document Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to download document") from e

@router.delete("/{document_id}")
async def delete_document(document_id: int, session: AsyncSession = Depends(db_session_maker)):
    try:
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        await session.delete(document)
        await session.commit()

        return {"detail": "Document deleted", "document_id": document_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete Document Error: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete document") from e