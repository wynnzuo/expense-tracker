from datetime import datetime

from langchain_core.messages import HumanMessage

from app.agent.agent import build_agent
from app.agent.models import AgentRequest
from app.logging_utils import get_logger
from app.repositories import save_chat_message

logger = get_logger("agent.service")

_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


def _persist_messages(conversation_id: str, user_input: str, response: str, source: str) -> None:
    if not conversation_id:
        return
    save_chat_message(conversation_id=conversation_id, role="user", content=user_input)
    save_chat_message(conversation_id=conversation_id, role="assistant", content=response)
    logger.debug("chat messages persisted | conversation=%s | source=%s", conversation_id, source)


def _extract_tool_data(messages: list) -> dict | None:
    """从 agent 消息中提取 create_transaction 工具调用的参数。"""
    for msg in messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                if tc.get("name") == "create_transaction" and "args" in tc:
                    return tc["args"]
    return None


async def process_agent_request(request: AgentRequest) -> dict:
    """使用 deepagents 处理用户记账请求。"""
    agent = get_agent()

    user_message = HumanMessage(content=request.input)

    try:
        result = await agent.ainvoke({"messages": [user_message]})

        messages = result.get("messages", [])

        # 提取最终回复
        final_response = ""
        for msg in reversed(messages):
            if hasattr(msg, "content") and msg.content and getattr(msg, "type", "") == "ai":
                final_response = msg.content
                break

        final_response = final_response or "已收到请求。"
        _persist_messages(request.conversationId, request.input, final_response, request.source)

        # 提取工具调用的结构化数据
        tool_data = _extract_tool_data(messages)
        parsed = None
        if tool_data and tool_data.get("note") and tool_data.get("amount"):
            parsed = {
                "note": tool_data["note"],
                "amount": float(tool_data["amount"]),
                "category": tool_data.get("category", "其他"),
                "type": tool_data.get("type", "expense"),
                "date": tool_data.get("date") or datetime.now().date().isoformat(),
                "merchant": tool_data.get("merchant"),
            }

        logger.info(
            "agent completed | input=%s | response_length=%d | has_data=%s",
            request.input,
            len(final_response),
            parsed is not None,
        )

        return {
            "finalResponse": final_response,
            "rawInput": request.input,
            "source": request.source,
            "parsedTransaction": parsed,
        }

    except Exception as exc:
        error_msg = f"处理请求时出错：{exc}"
        _persist_messages(request.conversationId, request.input, error_msg, request.source)

        logger.error("agent invocation failed | input=%s | error=%s", request.input, exc)
        return {
            "finalResponse": error_msg,
            "rawInput": request.input,
            "source": request.source,
            "parsedTransaction": None,
        }
