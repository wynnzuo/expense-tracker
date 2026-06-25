import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";

type TransactionListProps = {
  transactions: Transaction[];
  onConfirm?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  isMutating?: boolean;
};

export function TransactionList({ transactions, onConfirm, onEdit, onDelete, isMutating = false }: TransactionListProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Transactions</p>
          <h2 className="font-heading mt-2 text-2xl font-semibold">最近账单</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">{transactions.length} 笔记录</p>
      </div>
      <div className="mt-6 space-y-3">
        {transactions.length === 0 ? (
          <article className="animate-fade-in rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/50 px-5 py-8 text-center text-sm text-[var(--muted)]">
            还没有账单记录。先试试输入一句话，比如"中午吃饭 35 元"。
          </article>
        ) : null}
        {transactions.map((transaction, index) => {
          const isIncome = transaction.type === "income";

          return (
            <article
              key={transaction.id}
              className="animate-slide-up flex flex-col gap-3 rounded-[1.5rem] border border-[var(--border)] bg-white/70 px-5 py-4 transition-all hover:bg-white hover:shadow-[0_4px_20px_rgba(44,31,18,0.06)] md:flex-row md:items-center md:justify-between"
              style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
            >
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{transaction.note}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                  <span>{transaction.category}</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                    {(() => {
                      const d = new Date(transaction.date);
                      return isNaN(d.getTime()) ? transaction.date : format(d, "M 月 d 日 EEEE", { locale: zhCN });
                    })()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                    {transaction.source === "voice" ? "语音录入" : "文本录入"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                <span className={`badge ${transaction.status === "confirmed" ? "badge-confirmed" : "badge-pending"}`}>
                  {transaction.status === "confirmed" ? "已确认" : "待确认"}
                </span>
                <span
                  className={`text-xl font-semibold tabular-nums tracking-tight ${isIncome ? "text-[var(--success)]" : "text-[var(--accent)]"}`}
                >
                  {isIncome ? "+" : "-"}¥{transaction.amount.toLocaleString("zh-CN")}
                </span>
                {onConfirm && transaction.status === "pending" ? (
                  <Button size="sm" onClick={() => onConfirm(transaction)} disabled={isMutating}>
                    确认入账
                  </Button>
                ) : null}
                {onEdit ? (
                  <Button variant="secondary" size="sm" onClick={() => onEdit(transaction)} disabled={isMutating}>
                    编辑
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(transaction)} disabled={isMutating}>
                    删除
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
