"""
Servicio de extracción de texto desde archivos PDF.
Utiliza PyMuPDF (fitz) para leer el contenido.
"""

import fitz
from models.schemas import PdfData


def extract_text_from_pdf(file_path: str) -> PdfData:
    doc = fitz.open(file_path)
    pages = doc.page_count

    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())

    doc.close()

    full_text = "\n".join(text_parts).strip()
    characters = len(full_text)
    words = len(full_text.split()) if full_text else 0

    return PdfData(
        text=full_text,
        pages=pages,
        characters=characters,
        words=words,
    )
