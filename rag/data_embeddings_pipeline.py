import uuid

from extractor.docx_text_extractor import docx_file_data_extract
from extractor.pdf_text_extractor import pdf_file_data_extract

from chunkers.recursive_splitter import recursive_splitter

from embeddings.gemini_embedder import gemini_embedder

from vectorstore.pinecone_store import upsert_embeddings, query_embeddings


    # file_path = "./documents/AI_Learning_Plan.docx"

    # file_name = file_path.split('/')[-1]

    # extracted_text = docx_file_data_extract(file_path)

extracted_text = "What is machine learning"

chunks = recursive_splitter(extracted_text)

embeddings = gemini_embedder(chunks)


# upsert_embeddings(chunks=chunks,
#                   embeddings=embeddings,
#                   file_id=str(uuid.uuid4()),
#                   file_name=file_name,
#                   user_id=str(uuid.uuid4()),
#                   project_id=str(uuid.uuid4()))


# responses = query_embeddings(question_embedding=embeddings,
#                  user_id="3ae787ee-73c3-4713-a729-4a2028ddb2c5",
#                  project_id="9fd0bbb9-5f70-49f0-923b-6db1446ee280")

# matches = responses.matches
# usage = responses.usage
# response_info = responses.response_info

# print(f"\n\nUsage: {usage}")
# print(f"\nResponse_info: {response_info}\n\n")

# print(100*"-")


# for match in matches:

#     meta_data = match.metadata

#     print('\n\nMetaData')

#     print(f"\nfile_id: {meta_data['file_id']}")

#     print(f"\n\n{meta_data['text']}")
