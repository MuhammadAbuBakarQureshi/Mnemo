from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import INTEGER, String, Text, DateTime, ForeignKey
from datetime import datetime, UTC

from backend.app.models.base import Base

class Project(Base):

    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(INTEGER, unique=True, autoincrement=True, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda : datetime.now(UTC))

    auth0_id: Mapped[int] = mapped_column(ForeignKey("users.auth0_id"))

    owner: Mapped["User"] = relationship(back_populates="projects")

    chats: Mapped[list["Chat"]] = relationship(back_populates="project",
                                          cascade="all, delete-orphan")