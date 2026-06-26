from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agent.models import AgentRequest, ResumeRequest
from app.agent.services.agent_service import (
    process_agent_request,
    process_agent_stream,
    resume_agent_request,
)
from app.logging_utils import get_logger

router = APIRouter()
logger = get_logger("agent.route")


@router.post("/agent")
async def run_agent(request: AgentRequest) -> dict:
    if not request.input.strip():
        raise HTTPException(status_code=400, detail="Missing input")

    logger.info("agent request | source=%s | input=%s", request.source, request.input)
    payload = await process_agent_request(request)
    logger.info("agent response | status=%s", payload.get("status"))
    return payload


@router.post("/agent/resume")
async def resume_agent(request: ResumeRequest) -> dict:
    if not request.threadId.strip():
        raise HTTPException(status_code=400, detail="Missing threadId")

    logger.info("agent resume | thread=%s", request.threadId)
    payload = await resume_agent_request(request)
    logger.info("agent resume done | status=%s", payload.get("status"))
    return payload


@router.post("/agent/stream")
async def run_agent_stream(request: AgentRequest):
    if not request.input.strip():
        raise HTTPException(status_code=400, detail="Missing input")

    logger.info("agent stream request | source=%s | input=%s", request.source, request.input)
    return StreamingResponse(
        process_agent_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
