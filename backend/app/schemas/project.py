from pydantic import BaseModel

class ProjectCreate(BaseModel):

    name: str
    description: str | None = None

class ProjectUpdate(BaseModel):

    name: str

class Auth(BaseModel):

    email: str
    password: str