from pypdf import PdfReader
from pathlib import Path

# "./documents/6th_semester_rollno_slip.pdf"
# file_path = "./documents/OS_Full_Notes.pdf"

def pdf_file_data_extract(file_path) -> str:

    pdf_reader = PdfReader(file_path)

    extracted_text = []

    for pdf_page in pdf_reader.pages:
        
        extracted_text.append(pdf_page.extract_text())

    extracted_text = "".join(extracted_text)

    print(type(extracted_text))

    return extracted_text