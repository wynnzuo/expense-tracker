import uuid
from datetime import datetime

from langchain_core.messages import HumanMessage
from langgraph.types import Command

from app.agent.agent import build_agent
from app.agent.models import AgentRequest, ResumeRequest
from app.logging_utils import get_logger
from app.repositories import save_chat_message

logger = get_logger("agent.service")


def _persist_messages(conversation_id: str, user_input: str, response: str, source: str) -> None:
    if not conversation_id:
        return
    save_chat_message(conversation_id=conversation_id, role="user", content=user_input)
    save_chat_message(conversation_id=conversation_id, role="assistant", content=response)


def _extract_tool_args(tool_calls: list) -> dict | None:
    """从工具调用中提取 create_transaction 的参数。"""
    for tc in tool_calls:
        if tc.get("name") == "create_transaction" and "args" in tc:
            args = tc["args"]
            return {
                "note": args.get("note", ""),
                "amount": float(args.get("amount", 0)),
                "category": args.get("category", "其他"),
                "type": args.get("type", "expense"),
                "date": args.get("date") or datetime.now().date().isoformat(),
                "merchant": args.get("merchant"),
            }
    return None


async def process_agent_request(request: AgentRequest) -> dict:
    """首次调用 agent。如果被 HITL 中断，返回结构化数据等待确认。"""
    agent = build_agent()
    thread_id = request.conversationId or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    # 清除旧中断状态，避免干扰新消息
    try:
        state = await agent.aget_state(config)
        if state and state.interrupts:
            logger.info("clearing stale interrupt | thread=%s", thread_id)
            await agent.ainvoke(
                Command(resume={"decisions": [{"type": "reject", "message": "新消息覆盖"}]}),
                config,
            )
    except Exception:
        pass

    try:
        result = await agent.ainvoke(
            {"messages": [HumanMessage(content=request.input)]},
            config,
        )

        # 检查是否有中断（create_transaction 等待用户确认）
        interrupts = result.get("__interrupt__", [])
        if interrupts:
            # 从 AI 消息中提取工具调用参数
            for msg in reversed(result.get("messages", [])):
                tc = getattr(msg, "tool_calls", None) or []
                if tc:
                    parsed = _extract_tool_args(tc)
                    if parsed:
                        logger.info(
                            "agent interrupted | input=%s | parsed=%s",
                            request.input,
                            parsed,
                        )
                        return {
                            "status": "interrupted",
                            "threadId": thread_id,
                            "parsedTransaction": parsed,
                            "finalResponse": None,
                        }

        # 正常完成（查询/修改/删除等）
        final_response = ""
        for msg in reversed(result.get("messages", [])):
            if hasattr(msg, "content") and msg.content and getattr(msg, "type", "") == "ai":
                final_response = msg.content
                break

        final_response = final_response or "已收到请求。"
        _persist_messages(request.conversationId, request.input, final_response, request.source)

        logger.info("agent completed | input=%s", request.input)
        return {
            "status": "completed",
            "threadId": thread_id,
            "parsedTransaction": None,
            "finalResponse": final_response,
        }

    except Exception as exc:
        error_msg = f"处理请求时出错：{exc}"
        _persist_messages(request.conversationId, request.input, error_msg, request.source)
        logger.error("agent invocation failed | input=%s | error=%s", request.input, exc)
        return {
            "status": "error",
            "threadId": thread_id,
            "parsedTransaction": None,
            "finalResponse": error_msg,
        }


async def resume_agent_request(request: ResumeRequest) -> dict:
    """用户确认后，恢复被 HITL 中断的 agent，让它执行 create_transaction。"""
    agent = build_agent()
    config = {"configurable": {"thread_id": request.threadId}}

    try:
        # 恢复 agent，传入批准决策
        result = await agent.ainvoke(
            Command(resume={
                "decisions": [{"type": "approve"}],
            }),
            config,
        )

        final_response = ""
        for msg in reversed(result.get("messages", [])):
            if hasattr(msg, "content") and msg.content and getattr(msg, "type", "") == "ai":
                final_response = msg.content
                break

        final_response = final_response or "已收到请求。"
        _persist_messages(request.conversationId, request.input, final_response, request.source)

        logger.info("agent resumed | thread=%s | response=%s", request.threadId, final_response)
        return {
            "status": "completed",
            "threadId": request.threadId,
            "finalResponse": final_response,
        }

    except Exception as exc:
        error_msg = f"处理请求时出错：{exc}"
        logger.error("agent resume failed | thread=%s | error=%s", request.threadId, exc)
        return {
            "status": "error",
            "threadId": request.threadId,
            "finalResponse": error_msg,
        }
