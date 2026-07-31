"""
Utilidades para validación y manejo seguro de archivos subidos.
"""

import os
from werkzeug.utils import secure_filename as werkzeug_secure_filename

ALLOWED_EXTENSIONS = {".pdf"}


def allowed_extension(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


def secure_filename(filename: str) -> str:
    return werkzeug_secure_filename(filename)


def validate_file_size(file_size: int, max_bytes: int) -> None:
    if file_size == 0:
        raise ValueError("El archivo subido est\u00e1 vac\u00edo.")
    if file_size > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        raise ValueError(
            f"El archivo supera el tama\u00f1o m\u00e1ximo de {max_mb:.0f} MB."
        )
