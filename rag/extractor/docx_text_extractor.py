import docx

def docx_file_data_extract(file_path) -> str:

    document = docx.Document(file_path)

    extracted_text = []

    for para in document.paragraphs:

        extracted_text.append(para.text)

    extracted_text = "".join(extracted_text)

    return extracted_text