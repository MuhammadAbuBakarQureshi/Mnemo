from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.models import Document


async def is_already_ingested(file_path: str, db: AsyncSession) -> bool:

    path = Path(file_path)

    result = await db.execute(
        select(Document).where(Document.file_path == str(path))
    )

    existing = result.scalar_one_or_none()
    
    if existing and existing.total_chunks > 0:

        print(f"[skip] {path.name} already ingested ({existing.total_chunks} chunks)")
        return True


    return False