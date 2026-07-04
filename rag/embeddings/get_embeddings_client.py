import os
from langchain_ollama import OllamaEmbeddings

def get_embeddings_client():

    embeddings_client = OllamaEmbeddings(
        model="nomic-embed-text:latest",
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    )

    return embeddings_client
