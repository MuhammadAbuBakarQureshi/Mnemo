from langchain_text_splitters import RecursiveCharacterTextSplitter

from extractor.pdf_text_extractor import pdf_file_data_extract


splitter = RecursiveCharacterTextSplitter(
    chunk_size = 500,
    chunk_overlap = 50
)


def recursive_splitter(extracted_text: str) -> list:

    chunks = splitter.split_text(extracted_text)

    return chunks