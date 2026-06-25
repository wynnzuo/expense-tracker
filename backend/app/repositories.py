from datetime import date, datetime

from sqlalchemy.exc import SQLAlchemyError

from app.db import SessionLocal
from app.db_models import AgentRunRecord, ChatMessageRecord, TransactionRecord
from app.logging_utils import get_logger

logger = get_logger("agent.repository")


def serialize_transaction(record: TransactionRecord) -> dict:
    return {
        "id": record.id,
        "type": record.type,
        "amount": record.amount,
        "category": record.category,
        "date": record.date,
        "note": record.note,
        "merchant": record.merchant,
        "source": record.source,
        "status": record.status,
        "createdAt": record.createdAt.isoformat(),
    }


def save_agent_run(
    *,
    raw_input: str,
    intent: str | None,
    parsed_result: dict,
    confidence: float | None,
    decision: str | None,
) -> None:
    if SessionLocal is None:
        logger.warning("agent run persistence skipped | reason=no database url")
        return

    session = SessionLocal()

    try:
        record = AgentRunRecord(
            rawInput=raw_input,
            intent=intent,
            parsedResult=parsed_result,
            confidence=confidence,
            decision=decision,
        )
        session.add(record)
        session.commit()
        logger.info("agent run persisted | intent=%s | confidence=%s", intent, confidence)
    except SQLAlchemyError as exc:
        session.rollback()
        logger.warning("agent run persistence failed | reason=%s", exc)
    finally:
        session.close()


def save_transaction(
    *,
    transaction: dict,
    source: str,
    status: str,
) -> dict | None:
    if SessionLocal is None:
        logger.warning("transaction persistence skipped | reason=no database url")
        return None

    session = SessionLocal()

    try:
        record = TransactionRecord(
            type=transaction["type"],
            amount=transaction["amount"],
            category=transaction["category"],
            date=transaction["date"],
            note=transaction["note"],
            merchant=transaction.get("merchant"),
            source=source,
            status=status,
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        logger.info("transaction persisted | id=%s | amount=%s | status=%s", record.id, record.amount, record.status)
        return serialize_transaction(record)
    except (KeyError, TypeError, SQLAlchemyError) as exc:
        session.rollback()
        logger.warning("transaction persistence failed | reason=%s", exc)
        return None
    finally:
        session.close()


def list_transactions(limit: int = 50) -> list[dict]:
    session = SessionLocal()

    try:
        records = (
            session.query(TransactionRecord)
            .order_by(TransactionRecord.createdAt.desc())
            .limit(limit)
            .all()
        )
        return [serialize_transaction(record) for record in records]
    except SQLAlchemyError as exc:
        logger.warning("transaction listing failed | reason=%s", exc)
        return []
    finally:
        session.close()


def get_transaction(transaction_id: str) -> dict | None:
    session = SessionLocal()

    try:
        record = session.get(TransactionRecord, transaction_id)
        return serialize_transaction(record) if record else None
    except SQLAlchemyError as exc:
        logger.warning("transaction fetch failed | id=%s | reason=%s", transaction_id, exc)
        return None
    finally:
        session.close()


def update_transaction(transaction_id: str, payload: dict) -> dict | None:
    session = SessionLocal()

    try:
        record = session.get(TransactionRecord, transaction_id)
        if record is None:
            return None

        for field in ("type", "amount", "category", "date", "note", "merchant", "status"):
            if field in payload and payload[field] is not None:
                setattr(record, field, payload[field])

        session.commit()
        session.refresh(record)
        logger.info("transaction updated | id=%s | status=%s", record.id, record.status)
        return serialize_transaction(record)
    except SQLAlchemyError as exc:
        session.rollback()
        logger.warning("transaction update failed | id=%s | reason=%s", transaction_id, exc)
        return None
    finally:
        session.close()


def confirm_transaction(transaction_id: str) -> dict | None:
    return update_transaction(transaction_id, {"status": "confirmed"})


def delete_transaction(transaction_id: str) -> bool:
    session = SessionLocal()

    try:
        record = session.get(TransactionRecord, transaction_id)
        if record is None:
            return False

        session.delete(record)
        session.commit()
        logger.info("transaction deleted | id=%s", transaction_id)
        return True
    except SQLAlchemyError as exc:
        session.rollback()
        logger.warning("transaction delete failed | id=%s | reason=%s", transaction_id, exc)
        return False
    finally:
        session.close()


def summarize_transactions() -> dict:
    transactions = list_transactions(limit=500)
    today = date.today()
    monthly_income = 0.0
    monthly_expense = 0.0
    weekly_income = 0.0
    weekly_expense = 0.0
    expense_count = 0
    income_count = 0
    week_ago = today - __import__("datetime").timedelta(days=7)

    for txn in transactions:
        if txn["status"] == "pending":
            continue
        try:
            txn_date = datetime.fromisoformat(txn["date"]).date()
        except ValueError:
            continue

        same_month = txn_date.year == today.year and txn_date.month == today.month
        if not same_month:
            continue

        amount = float(txn["amount"])
        if txn["type"] == "income":
            monthly_income += amount
            income_count += 1
            if txn_date >= week_ago:
                weekly_income += amount
        else:
            monthly_expense += amount
            expense_count += 1
            if txn_date >= week_ago:
                weekly_expense += amount

    days_in = today.day
    daily_avg = round(monthly_expense / days_in, 2) if days_in > 0 else 0

    return {
        "monthlyExpense": monthly_expense,
        "monthlyIncome": monthly_income,
        "weeklyExpense": weekly_expense,
        "weeklyIncome": weekly_income,
        "dailyAverageExpense": daily_avg,
        "transactionCount": expense_count + income_count,
    }


def summarize_categories(txn_type: str = "expense") -> list[dict]:
    """Return breakdown by category for the current month.

    Args:
        txn_type: "expense" 或 "income"
    """
    transactions = list_transactions(limit=500)
    today = date.today()
    categories: dict[str, float] = {}

    for txn in transactions:
        if txn["status"] == "pending" or txn["type"] != txn_type:
            continue
        try:
            txn_date = datetime.fromisoformat(txn["date"]).date()
        except ValueError:
            continue
        if txn_date.year != today.year or txn_date.month != today.month:
            continue
        cat = txn["category"] or "其他"
        categories[cat] = categories.get(cat, 0) + float(txn["amount"])

    return [{"name": k, "value": round(v, 2)} for k, v in sorted(categories.items(), key=lambda x: -x[1])]


def save_chat_message(*, conversation_id: str, role: str, content: str) -> None:
    session = SessionLocal()
    try:
        record = ChatMessageRecord(conversationId=conversation_id, role=role, content=content)
        session.add(record)
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        logger.warning("chat message save failed | reason=%s", exc)
    finally:
        session.close()


def get_chat_messages(conversation_id: str) -> list[dict]:
    session = SessionLocal()
    try:
        records = (
            session.query(ChatMessageRecord)
            .filter(ChatMessageRecord.conversationId == conversation_id)
            .order_by(ChatMessageRecord.createdAt.asc())
            .all()
        )
        return [
            {
                "role": r.role,
                "content": r.content,
                "timestamp": r.createdAt.isoformat(),
            }
            for r in records
        ]
    except SQLAlchemyError as exc:
        logger.warning("chat messages fetch failed | conversation=%s | reason=%s", conversation_id, exc)
        return []
    finally:
        session.close()
