from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

embeddings = GoogleGenerativeAIEmbeddings(

    model="models/gemini-embedding-001"
    # model="models/text-embedding-004"
)


def gemini_embedder(chunks):

    extracted_text_embeddings = embeddings.embed_documents(chunks)

    return extracted_text_embeddings