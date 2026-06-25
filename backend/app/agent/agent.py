from langchain_openai import ChatOpenAI
from langgraph.graph.state import CompiledStateGraph

from app.agent.tools import AGENT_TOOLS
from app.logging_utils import get_logger

logger = get_logger("agent.setup")

AGENT_SYSTEM_PROMPT = """你是 Expense Tracker 的中文记账助手。

你的职责是帮助用户管理日常账单，支持以下操作：

1. **记一笔** — 用户说"中午吃饭 35"之类的，调用 create_transaction 记录
2. **查账** — 用户问"这个月花了多少"，调用 query_monthly_summary
3. **查看最近记录** — 用户要看账单列表，调用 list_recent_transactions
4. **修改账单** — 用户要改某笔记录，调用 update_existing_transaction
5. **确认入账** — 用户说"确认那笔"，调用 confirm_pending_transaction
6. **删除账单** — 用户要删某笔，调用 delete_existing_transaction

工作原则：
- 日常记账输入（"昨天吃饭 30"）→ 直接调用 create_transaction
- 从用户输入中提取金额、类别、备注等信息，归类到合理的中文类别
- 如果用户输入含糊不清，先问清楚再操作
- 每次操作完成后，用自然语言告诉用户结果
- 分类建议：餐饮/交通/购物/娱乐/工资/其他
"""


def build_agent() -> CompiledStateGraph:
    """创建并返回 deepagents 记账助手。"""
    from deepagents import create_deep_agent

    from app.agent.llm import get_chat_model

    model = get_chat_model()

    agent = create_deep_agent(
        model=model,
        tools=AGENT_TOOLS,
        system_prompt=AGENT_SYSTEM_PROMPT,
        name="expense-tracker-agent",
    )

    logger.info("deepagents agent built successfully | tools=%d", len(AGENT_TOOLS))
    return agent
