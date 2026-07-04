from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.models import Document, DocumentChunk, DocumentEmbedding


async def ingest_document(embeddings,
                     file_type: str,
                     project_id: int,
                     user_id: int,
                     db: AsyncSession) -> Document:

    # Create document record
    doc = Document(
            filename=embeddings["path"].name,
            file_path=str(embeddings["path"]),
            file_type=file_type,
            user_id=user_id,
            project_id=project_id
        )

    db.add(doc)
    await db.flush()  # get doc.id before inserting chunks


    # Store chunks + embeddings
    for idx, (chunk_meta, vector) in enumerate(zip(embeddings["chunks"], embeddings["vectors"])):
        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=idx,
            page_number=chunk_meta["page_number"],
            content=chunk_meta["content"],
            token_count=len(chunk_meta["content"].split()),
        )
        db.add(chunk)
        await db.flush()  # get chunk.id

        embedding = DocumentEmbedding(
            chunk_id=chunk.id,
            document_id=doc.id,
            embedding=vector,
            model_name="nomic-embed-text:latest",
        )
        db.add(embedding)

    # Mark ingestion complete
    doc.total_chunks = len(embeddings["chunks"])
    await db.commit()

    print(f"[DONE] {doc}")

    return doc
