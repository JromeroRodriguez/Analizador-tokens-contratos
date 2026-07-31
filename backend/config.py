import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev")

    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "meta/llama-3.1-8b-instruct")

    NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    TEMP_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")

    LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    LOG_FILE = os.path.join(LOG_DIR, "app.log")
    LOG_MAX_BYTES = 10 * 1024 * 1024
    LOG_BACKUP_COUNT = 5

    COST_INPUT_PER_TOKEN = 0.15 / 1_000_000
    COST_OUTPUT_PER_TOKEN = 0.60 / 1_000_000

    @staticmethod
    def get_encoding_name() -> str:
        model = os.getenv("OPENAI_MODEL", "meta/llama-3.1-8b-instruct")
        model = model.strip()
        if model.startswith("gpt-4o"):
            return "o200k_base"
        if model.startswith(("gpt-4", "gpt-3.5")):
            return "cl100k_base"
        return "cl100k_base"
