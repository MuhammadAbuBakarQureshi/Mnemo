from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import INTEGER, String, Text, DateTime, ForeignKey
from datetime import datetime, UTC

from backend.app.models.base import Base

class Chat(Base):

    __tablename__ = "chats"

    chat_id: Mapped[int] = mapped_column(INTEGER, unique=True, autoincrement=True, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda : datetime.now(UTC))

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"))

    project: Mapped["Project"] = relationship(back_populates="chats")