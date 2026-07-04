from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime
from datetime import datetime, UTC

from backend.app.models.base import Base

class User(Base):

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, unique=True, primary_key=True, autoincrement=True)
    auth0_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda : datetime.now(UTC))

    projects: Mapped[list["Project"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan")