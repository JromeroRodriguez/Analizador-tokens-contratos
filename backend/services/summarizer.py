import json
import re
from openai import OpenAI, APIError, APITimeoutError, RateLimitError
from config import Config


FIELDS = [
    "tenant",
    "landlord",
    "start_date",
    "expiration_date",
    "monthly_rent",
    "deposit",
    "penalty_clause",
    "renewal",
]


def _build_prompt() -> str:
    fields_str = ",\n  ".join(f'"{f}": ""' for f in FIELDS)
    return (
        "Extract the key information from the following lease agreement. "
        "Return a JSON object with exactly these fields:\n"
        f"{{\n  {fields_str}\n}}\n\n"
        "Fill each field with the exact value found in the document. "
        "Use an empty string if the information is not present."
    )


def _build_client() -> OpenAI:
    if Config.LLM_PROVIDER == "ollama":
        return OpenAI(
            base_url=Config.OLLAMA_BASE_URL,
            api_key="ollama",
        )
    return OpenAI(
        base_url=Config.NVIDIA_BASE_URL,
        api_key=Config.OPENAI_API_KEY,
    )


def _get_model() -> str:
    if Config.LLM_PROVIDER == "ollama":
        return Config.OLLAMA_MODEL
    return Config.OPENAI_MODEL


def _extract_json(text: str) -> dict:
    brace_count = 0
    start = None
    for i, char in enumerate(text):
        if char == '{':
            if start is None:
                start = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and start is not None:
                json_str = text[start:i+1]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    start = None

    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("No se encontr\u00f3 JSON v\u00e1lido en la respuesta del modelo")


def generate_summary(text: str) -> dict:
    client = _build_client()
    prompt = _build_prompt()

    kwargs = {
        "model": _get_model(),
        "messages": [
            {
                "role": "system",
                "content": "You are a legal document analyst. Extract structured data from lease agreements into a valid JSON object.",
            },
            {
                "role": "user",
                "content": f"{prompt}\n\n---\n\n{text}",
            },
        ],
        "temperature": 0.2,
        "top_p": 0.7,
        "max_tokens": 1024,
        "timeout": 60,
    }

    if Config.LLM_PROVIDER == "openai":
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
    except APITimeoutError:
        raise ValueError("El servicio de IA tard\u00f3 demasiado. Intent\u00e1 de nuevo o revis\u00e1 tu conexi\u00f3n.")
    except RateLimitError:
        raise ValueError("L\u00edmite de velocidad excedido. Esper\u00e1 un momento e intent\u00e1 de nuevo.")
    except APIError as e:
        raise ValueError(f"Error del servicio de IA: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error inesperado al contactar el servicio de IA: {str(e)}")

    content = response.choices[0].message.content
    if content is None or not content.strip():
        raise ValueError("Respuesta vac\u00eda del servicio de IA")

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return _extract_json(content)
