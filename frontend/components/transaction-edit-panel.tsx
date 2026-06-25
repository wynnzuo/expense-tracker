import { CircleX } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";

type TransactionEditPanelProps = {
  draft: Transaction;
  isMutating: boolean;
  onCancel: () => void;
  onChange: (draft: Transaction) => void;
  onSave: () => Promise<void>;
};

export function TransactionEditPanel({
  draft,
  isMutating,
  onCancel,
  onChange,
  onSave,
}: TransactionEditPanelProps) {
  return (
    <section className="animate-slide-up rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">编辑账单</h3>
        </div>
        <Button variant="ghost" onClick={onCancel} disabled={isMutating}>
          <CircleX className="mr-1.5 h-4 w-4" />
          取消
        </Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-[var(--muted)]">
          类型
          <select
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            value={draft.type}
            onChange={(event) => onChange({ ...draft, type: event.target.value as Transaction["type"] })}
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)]">
          金额
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            type="number"
            min="0"
            step="0.01"
            value={draft.amount}
            onChange={(event) => onChange({ ...draft, amount: Number(event.target.value) })}
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)]">
          类别
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            value={draft.category}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)]">
          日期
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            type="date"
            value={draft.date.slice(0, 10)}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)] md:col-span-2">
          备注
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--muted)] md:col-span-2">
          商户
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-[var(--foreground)] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
            value={draft.merchant ?? ""}
            onChange={(event) => onChange({ ...draft, merchant: event.target.value })}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onSave} disabled={isMutating}>
          {isMutating ? "保存中..." : "保存修改"}
        </Button>
        {draft.status === "pending" ? (
          <Button
            variant="secondary"
            onClick={() => onChange({ ...draft, status: "confirmed" })}
            disabled={isMutating}
          >
            保存并确认
          </Button>
        ) : null}
      </div>
    </section>
  );
}
