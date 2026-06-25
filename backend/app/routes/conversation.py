from fastapi import APIRouter

from app.logging_utils import get_logger
from app.repositories import get_chat_messages

router = APIRouter()
logger = get_logger("conversation.route")


@router.get("/conversation/{conversation_id}")
async def fetch_conversation(conversation_id: str) -> dict:
    messages = get_chat_messages(conversation_id)
    return {"messages": messages}
