import tiktoken


def count_tokens(text: str, encoding_name: str) -> int:
    encoding = tiktoken.get_encoding(encoding_name)
    tokens = encoding.encode(text)
    return len(tokens)
