"""
Esquemas de datos — contratos de entrada/salida del sistema.
"""

from dataclasses import dataclass


@dataclass
class PdfData:
    text: str
    pages: int
    characters: int
    words: int
