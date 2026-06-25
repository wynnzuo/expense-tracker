from datetime import datetime

from langchain_core.tools import tool

from app.logging_utils import get_logger
from app.repositories import (
    confirm_transaction as repo_confirm,
    delete_transaction as repo_delete,
    list_transactions,
    summarize_transactions,
    update_transaction as repo_update,
)

logger = get_logger("agent.tools")

VALID_CATEGORIES = ("餐饮", "交通", "购物", "娱乐", "工资", "其他")
VALID_TYPES = ("expense", "income")


@tool
def create_transaction(
    note: str,
    amount: float,
    category: str = "其他",
    type: str = "expense",
    date: str | None = None,
    merchant: str | None = None,
    source: str = "text",
) -> str:
    """创建一笔账单记录。收到记账输入时直接调用此工具。
    **注意：如果用户说了「昨天」「前天」「上周五」等相对日期，请计算出具体日期传入 date 参数。**

    Args:
        note: 账单备注，如"中午吃饭"
        amount: 金额，如 35
        category: 类别。可选值：餐饮, 交通, 购物, 娱乐, 工资, 其他
        type: 类型。expense 表示支出, income 表示收入
        date: 日期，格式 YYYY-MM-DD。用户说"昨天"则传昨天的日期，不传则默认为今天
        merchant: 商户名称，可选
        source: 来源 text 或 voice
    """
    if category not in VALID_CATEGORIES:
        return f"无效类别「{category}」，可选：{', '.join(VALID_CATEGORIES)}"

    if type not in VALID_TYPES:
        return f"无效类型「{type}」，可选：{', '.join(VALID_TYPES)}"

    if amount <= 0:
        return "金额必须大于 0"

    txn_date = date or datetime.now().date().isoformat()

    type_label = "收入" if type == "income" else "支出"
    logger.info("transaction parsed | amount=%s | category=%s | type=%s", amount, category, type)
    return f"（预览）{category}{type_label} ¥{amount:,.2f} · {note} · {txn_date}"


@tool
def query_monthly_summary() -> str:
    """查询本月的收入、支出汇总统计。"""
    summary = summarize_transactions()
    return (
        f"本月收入 ¥{summary['monthlyIncome']:,.2f}，"
        f"支出 ¥{summary['monthlyExpense']:,.2f}，"
        f"日均支出 ¥{summary['dailyAverageExpense']:,.2f}。"
    )


@tool
def list_recent_transactions(limit: int = 10) -> str:
    """列出最近的账单记录。

    Args:
        limit: 返回条数，默认 10，最大 50
    """
    safe_limit = min(max(limit, 1), 50)
    items = list_transactions(limit=safe_limit)

    if not items:
        return "还没有账单记录。"

    lines = [f"最近 {len(items)} 笔账单："]
    for txn in items:
        type_sign = "+" if txn["type"] == "income" else "-"
        status_tag = " [待确认]" if txn["status"] == "pending" else ""
        lines.append(
            f"  {txn['date']} {txn['note']} {type_sign}¥{txn['amount']:,.2f} ({txn['category']}){status_tag}"
        )
    return "\n".join(lines)


@tool
def update_existing_transaction(
    transaction_id: str,
    note: str | None = None,
    amount: float | None = None,
    category: str | None = None,
    type: str | None = None,
    date: str | None = None,
    merchant: str | None = None,
    status: str | None = None,
) -> str:
    """修改一笔已有的账单记录。

    Args:
        transaction_id: 账单 ID
        note: 新的备注
        amount: 新的金额
        category: 新的类别
        type: 新的类型 (expense/income)
        date: 新的日期 (YYYY-MM-DD)
        merchant: 新的商户
        status: 状态 (confirmed/pending)
    """
    payload = {}
    if note is not None:
        payload["note"] = note
    if amount is not None:
        payload["amount"] = amount
    if category is not None:
        payload["category"] = category
    if type is not None:
        payload["type"] = type
    if date is not None:
        payload["date"] = date
    if merchant is not None:
        payload["merchant"] = merchant
    if status is not None:
        payload["status"] = status

    if not payload:
        return "没有需要修改的字段。"

    updated = repo_update(transaction_id, payload)
    if updated is None:
        return f"未找到 ID 为 {transaction_id} 的账单，请检查。"

    logger.info("transaction updated | id=%s", transaction_id)
    return f"账单已更新：{updated['note']} ¥{updated['amount']:,.2f}"


@tool
def confirm_pending_transaction(transaction_id: str) -> str:
    """确认一笔待确认的账单。

    Args:
        transaction_id: 账单 ID
    """
    result = repo_confirm(transaction_id)
    if result is None:
        return f"未找到 ID 为 {transaction_id} 的账单，或已经确认过了。"
    logger.info("transaction confirmed | id=%s", transaction_id)
    return f"账单已确认入账：{result['note']} ¥{result['amount']:,.2f}"


@tool
def delete_existing_transaction(transaction_id: str) -> str:
    """删除一笔账单记录。

    Args:
        transaction_id: 账单 ID
    """
    deleted = repo_delete(transaction_id)
    if not deleted:
        return f"未找到 ID 为 {transaction_id} 的账单。"
    logger.info("transaction deleted | id=%s", transaction_id)
    return "账单已删除。"


AGENT_TOOLS = [
    create_transaction,
    query_monthly_summary,
    list_recent_transactions,
    update_existing_transaction,
    confirm_pending_transaction,
    delete_existing_transaction,
]
