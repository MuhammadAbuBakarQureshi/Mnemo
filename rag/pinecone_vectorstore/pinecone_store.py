from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import os

import time
from tqdm import tqdm

load_dotenv()

pc = Pinecone(os.getenv("PINECODE_API_KEY"))

index_name = "mentora"
index = pc.Index(index_name)

def upsert_embeddings(chunks, embeddings, file_id, file_name, user_id, project_id):

    namespace = f"{user_id}_{project_id}"

    vectors = []

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):

        vectors.append({
            "id": f"{file_id}-chunk-{i}",
            "values": embedding,
            "metadata": {
                "text": chunk,
                "source": file_name,
                "file_id": file_id
            }
        })

    batch_size = 100

    print("Uploading...")
    for i in tqdm(range(0, len(vectors), batch_size)):

        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)

def query_embeddings(question_embedding, user_id, project_id):

    namespace = f"{user_id}_{project_id}"

    response = index.query(
            namespace=namespace,
            vector=question_embedding,
            top_k=2,
            include_metadata=True,
    )

    return response