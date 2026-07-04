from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import INTEGER, String, Text, DateTime
from datetime import datetime, UTC

class Base(DeclarativeBase):
    pass

class Messages(Base):

    __tablename__ = "messages"

    message_id: Mapped[int] = mapped_column(INTEGER, unique=True, autoincrement=True, primary_key=True)
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda : datetime.now(UTC))