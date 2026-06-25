from datetime import date

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.repositories import (
    confirm_transaction,
    delete_transaction,
    get_transaction,
    list_transactions,
    save_transaction,
    summarize_categories,
    summarize_transactions,
    update_transaction,
)

router = APIRouter()


class TransactionUpdateRequest(BaseModel):
    type: str
    amount: float
    category: str
    date: str
    note: str
    merchant: str | None = None
    status: str = "confirmed"


class TransactionCreateRequest(BaseModel):
    type: str
    amount: float
    category: str
    date: str
    note: str
    merchant: str | None = None
    source: str = "text"
    status: str = "confirmed"


@router.post("/transactions")
async def create_transaction(request: TransactionCreateRequest) -> dict:
    txn_date = request.date.strip() or date.today().isoformat()
    saved = save_transaction(
        transaction={
            "type": request.type,
            "amount": request.amount,
            "category": request.category,
            "date": txn_date,
            "note": request.note,
            "merchant": request.merchant,
        },
        source=request.source,
        status=request.status,
    )
    if saved is None:
        raise HTTPException(status_code=500, detail="Save failed")
    return saved


@router.get("/transactions")
async def get_transactions(limit: int = 50) -> dict:
    safe_limit = min(max(limit, 1), 200)
    return {"items": list_transactions(limit=safe_limit)}


@router.get("/transactions/summary")
async def get_transaction_summary() -> dict:
    return summarize_transactions()


@router.get("/transactions/categories")
async def get_transaction_categories(type: str = "expense") -> list[dict]:
    if type not in ("expense", "income"):
        type = "expense"
    return summarize_categories(txn_type=type)


@router.get("/transactions/{transaction_id}")
async def get_transaction_by_id(transaction_id: str) -> dict:
    transaction = get_transaction(transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction


@router.patch("/transactions/{transaction_id}")
async def patch_transaction(transaction_id: str, request: TransactionUpdateRequest) -> dict:
    transaction = update_transaction(transaction_id, request.model_dump())
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction


@router.post("/transactions/{transaction_id}/confirm")
async def confirm_transaction_route(transaction_id: str) -> dict:
    transaction = confirm_transaction(transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction


@router.delete("/transactions/{transaction_id}")
async def remove_transaction(transaction_id: str) -> dict:
    deleted = delete_transaction(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {"ok": True}
