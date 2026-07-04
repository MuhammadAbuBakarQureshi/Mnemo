import pdfplumber
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag.embeddings.get_embeddings_client import get_embeddings_client

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=100,
    length_function=len,
)

async def create_pdf_file_emneddings(file_path: str):

    path = Path(file_path)

    # Extract text per page
    pages: list[dict] = []
    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append({"page_number": page_num, "text": page_text})

    if not pages:
        raise ValueError(f"No extractable text found in {path.name}")
    
    # Chunk per page and track provenance
    all_chunks: list[dict] = []
    for page in pages:
        splits = splitter.split_text(page["text"])

        for split in splits:
            all_chunks.append({
                "content": split,
                "page_number": page["page_number"],
            })

    # Embed all chunks in one batch
    texts = [c["content"] for c in all_chunks]
    vectors = await get_embeddings_client().aembed_documents(texts)


    print(f"[done] {path.name} → {len(all_chunks)} chunks across {len(pages)} pages")

    return {"path": path,
            "chunks": all_chunks,
            "pages": pages,
            "vectors": vectors}