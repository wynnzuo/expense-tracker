import os

from langchain_openai import ChatOpenAI


def get_chat_model() -> ChatOpenAI:
    model_name = os.getenv("LLM_MODEL", "deepseek-v4-flash")
    api_key = os.getenv("LLM_API_KEY", "")
    base_url = os.getenv("LLM_BASE_URL", "https://api.deepseek.com")

    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=0,
    )
