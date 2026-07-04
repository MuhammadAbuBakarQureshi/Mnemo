from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, UTC
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB


class Base(DeclarativeBase):
    pass


# ---------------------------------------------- USERS ----------------------------------------------

class User(Base):
    __tablename__ = "users"

    user_id:       Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    username:      Mapped[str]      = mapped_column(String, unique=False, nullable=False)
    email:         Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str]      = mapped_column(String(255), nullable=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    projects:  Mapped[list["Project"]]  = relationship(back_populates="owner", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="owner", cascade="all, delete-orphan")



# ---------------------------------------------- PROJECTS ----------------------------------------------


class Project(Base):
    __tablename__ = "projects"

    project_id:  Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    name:        Mapped[str]      = mapped_column(String, nullable=False)
    description: Mapped[str]      = mapped_column(Text, nullable=True)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"))

    owner:     Mapped["User"]            = relationship(back_populates="projects")
    chats:     Mapped[list["Chat"]]      = relationship(back_populates="project", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]]  = relationship(back_populates="project", cascade="all, delete-orphan")

class Chat(Base):
    __tablename__ = "chats"

    chat_id:    Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    title:      Mapped[str]      = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))

    project:  Mapped["Project"]        = relationship(back_populates="chats")
    messages: Mapped[list["Message"]]  = relationship(back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    message_id: Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    role:       Mapped[str]           = mapped_column(String, nullable=False)
    content:    Mapped[str]           = mapped_column(Text, nullable=False)
    context:    Mapped[list | None]   = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime]      = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.chat_id", ondelete="CASCADE"))

    chat: Mapped["Chat"] = relationship(back_populates="messages")

# ---------------------------------------------- DOCUMENTS ----------------------------------------------


class Document(Base):
    __tablename__ = "documents"

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename:     Mapped[str]      = mapped_column(Text, nullable=False)
    file_path:    Mapped[str]      = mapped_column(Text, nullable=False, unique=True)
    file_type:    Mapped[str]      = mapped_column(Text, nullable=False)
    total_chunks: Mapped[int]      = mapped_column(Integer, default=0)
    ingested_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    user_id:    Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"))

    project:    Mapped["Project"]                 = relationship(back_populates="documents")
    owner:      Mapped["User"]                    = relationship(back_populates="documents")
    chunks:     Mapped[list["DocumentChunk"]]     = relationship(back_populates="document", cascade="all, delete-orphan")
    embeddings: Mapped[list["DocumentEmbedding"]] = relationship(back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (
        UniqueConstraint("document_id", "chunk_index"),
    )

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id:  Mapped[int]      = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index:  Mapped[int]      = mapped_column(Integer, nullable=False)
    page_number:  Mapped[int]      = mapped_column(Integer, nullable=True)
    char_start:   Mapped[int]      = mapped_column(Integer, nullable=True)
    char_end:     Mapped[int]      = mapped_column(Integer, nullable=True)
    content:      Mapped[str]      = mapped_column(Text, nullable=False)
    token_count:  Mapped[int]      = mapped_column(Integer, nullable=True)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    document:  Mapped["Document"]                 = relationship(back_populates="chunks")
    embedding: Mapped["DocumentEmbedding | None"] = relationship(back_populates="chunk", cascade="all, delete-orphan")


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id:          Mapped[int]         = mapped_column(Integer, primary_key=True, autoincrement=True)
    chunk_id:    Mapped[int]         = mapped_column(ForeignKey("document_chunks.id", ondelete="CASCADE"), unique=True)
    document_id: Mapped[int]         = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"))
    embedding:   Mapped[list[float]] = mapped_column(Vector(768))
    model_name:  Mapped[str]         = mapped_column(Text, nullable=False)
    created_at:  Mapped[datetime]    = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    chunk:    Mapped["DocumentChunk"] = relationship(back_populates="embedding")
    document: Mapped["Document"]      = relationship(back_populates="embeddings")