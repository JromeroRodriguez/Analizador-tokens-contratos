import os
from werkzeug.datastructures import FileStorage
from config import Config
from utils.file_utils import allowed_extension, validate_file_size, secure_filename
from services.pdf_extractor import extract_text_from_pdf
from services.token_counter import count_tokens
from services.summarizer import generate_summary
from services.cost_analyzer import analyze_costs


def process_pdf(file: FileStorage, mode: str = "A") -> dict:
    if not file or not file.filename:
        raise ValueError("No se proporcion\u00f3 ning\u00fan archivo.")

    if not allowed_extension(file.filename):
        raise ValueError("Solo se permiten archivos PDF.")

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    validate_file_size(file_size, Config.MAX_CONTENT_LENGTH)

    safe_name = secure_filename(file.filename)
    upload_path = os.path.join(Config.UPLOAD_FOLDER, safe_name)
    file.save(upload_path)

    try:
        pdf_data = extract_text_from_pdf(upload_path)

        encoding = Config.get_encoding_name()
        original_tokens = count_tokens(pdf_data.text, encoding)

        if mode == "B":
            summary = generate_summary(pdf_data.text)
            summary_str = str(summary)
            summary_tokens = count_tokens(summary_str, encoding)
            cost_report = analyze_costs(
                original_tokens=original_tokens,
                summary_tokens=summary_tokens,
            )

            return {
                "file_name": safe_name,
                "pages": pdf_data.pages,
                "characters": pdf_data.characters,
                "words": pdf_data.words,
                "original_tokens": cost_report.original_tokens,
                "summary_tokens": cost_report.summary_tokens,
                "reduction_percentage": cost_report.reduction_percentage,
                "original_cost": cost_report.original_cost,
                "summary_cost": cost_report.summary_cost,
                "money_saved": cost_report.money_saved,
                "savings_percentage": cost_report.savings_percentage,
                "preprocessing_cost": cost_report.preprocessing_cost,
                "break_even": cost_report.break_even,
                "summary": summary,
            }
        else:
            return {
                "file_name": safe_name,
                "pages": pdf_data.pages,
                "characters": pdf_data.characters,
                "words": pdf_data.words,
                "original_tokens": original_tokens,
                "summary_tokens": 0,
                "reduction_percentage": None,
                "original_cost": round(original_tokens * Config.COST_INPUT_PER_TOKEN, 6),
                "summary_cost": 0,
                "money_saved": 0,
                "savings_percentage": 0,
                "preprocessing_cost": 0,
                "break_even": 0,
                "summary": {},
            }
    finally:
        if os.path.exists(upload_path):
            os.remove(upload_path)
