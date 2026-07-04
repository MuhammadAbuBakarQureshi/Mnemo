import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.projects import router as project_router
from backend.app.api.v1.users import router as user_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.chats import router as chat_router
from backend.app.api.v1.documents import router as document_router

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

app.include_router(router=project_router, prefix="/project")
app.include_router(router=user_router, prefix="/user")
app.include_router(router=auth_router, prefix="/auth")
app.include_router(router=chat_router, prefix="/chat")
app.include_router(router=document_router, prefix="/documents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://10.73.88.86:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

if __name__ == "__main__":

    uvicorn.run(app="backend.app.main:app", host="0.0.0.0", port=8000, reload=True)