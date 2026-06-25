import { useEffect, useState } from "react";

import { confirmTransaction, deleteTransaction, fetchTransactions, updateTransaction } from "@/lib/api";
import type { Transaction } from "@/types/transaction";

export function useTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [draft, setDraft] = useState<Transaction | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadTransactions() {
    try {
      const items = await fetchTransactions(100);
      setTransactions(items);
    } catch {
      setTransactions([]);
      setMessage("读取账单失败，请检查后端服务。");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  async function handleConfirm(transaction: Transaction) {
    setIsMutating(true);
    setMessage(null);
    try {
      await confirmTransaction(transaction.id);
      await loadTransactions();
      setMessage("这笔待确认账单已经正式入账。");
    } catch {
      setMessage("确认入账失败，请稍后再试。");
    } finally {
      setIsMutating(false);
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setDraft({ ...transaction });
    setMessage(null);
  }

  function handleCancelEdit() {
    setEditingTransaction(null);
    setDraft(null);
  }

  async function handleDelete(transaction: Transaction) {
    setIsMutating(true);
    setMessage(null);
    try {
      await deleteTransaction(transaction.id);
      if (editingTransaction?.id === transaction.id) {
        handleCancelEdit();
      }
      await loadTransactions();
      setMessage("账单已删除。");
    } catch {
      setMessage("删除失败，请稍后再试。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSaveEdit() {
    if (!draft) {
      return;
    }

    setIsMutating(true);
    setMessage(null);
    try {
      await updateTransaction(draft.id, draft);
      handleCancelEdit();
      await loadTransactions();
      setMessage("账单已更新。");
    } catch {
      setMessage("更新失败，请稍后再试。");
    } finally {
      setIsMutating(false);
    }
  }

  return {
    draft,
    editingTransaction,
    handleCancelEdit,
    handleConfirm,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    isLoading,
    isMutating,
    message,
    setDraft,
    transactions,
  };
}
