from pydantic import BaseModel


class Message(BaseModel):

    role: str
    content: str


class Conversation(BaseModel):

    chat_id: int
    project_id: int
    messages: list['Message']
    attachments: list[dict]
    message: str