from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",  # lightweight, ~130MB
    model_kwargs={"device": "cpu"}
)

def hugging_face_embedder(chunks):  # same interface, drop-in replacement
    return embeddings.embed_documents(chunks)