from fastapi import APIRouter, HTTPException

from app.agent.models import AgentRequest
from app.agent.services.agent_service import process_agent_request
from app.logging_utils import get_logger

router = APIRouter()
logger = get_logger("agent.route")


@router.post("/agent")
async def run_agent(request: AgentRequest) -> dict:
    if not request.input.strip():
        raise HTTPException(status_code=400, detail="Missing input")

    logger.info("agent request received | source=%s | input=%s", request.source, request.input)
    payload = await process_agent_request(request)
    logger.info("agent response ready | reply=%s", payload.get("finalResponse"))
    return payload
