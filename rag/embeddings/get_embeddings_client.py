import os
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv

load_dotenv()

def get_embeddings_client():

    embeddings_client = OllamaEmbeddings(
        model="nomic-embed-text:latest",
        base_url=os.getenv("OLLAMA_BASE_URL", os.getenv("OLLAMA_URL"))
    )

    return embeddings_client
