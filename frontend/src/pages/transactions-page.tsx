import { TransactionEditPanel } from "@/components/transaction-edit-panel";
import { SiteShell } from "@/components/site-shell";
import { TransactionList } from "@/components/transaction-list";
import { useTransactionsPage } from "@/hooks/use-transactions-page";

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div className="skeleton mb-3 h-9 w-16" />
        <div className="skeleton h-5 w-72" />
      </div>
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div className="skeleton mb-4 h-5 w-24" />
        <div className="skeleton mb-2 h-7 w-20" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton mb-3 h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export function TransactionsPage() {
  const {
    draft,
    editingTransaction,
    handleCancelEdit,
    handleConfirm,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    isMutating,
    message,
    isLoading,
    setDraft,
    transactions,
  } = useTransactionsPage();

  return (
    <SiteShell currentPath="/transactions">
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">账单</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            查看所有记账记录，支持编辑、删除操作。
          </p>
        </section>
        {editingTransaction && draft ? (
          <TransactionEditPanel
            draft={draft}
            isMutating={isMutating}
            onCancel={handleCancelEdit}
            onChange={setDraft}
            onSave={handleSaveEdit}
          />
        ) : null}
        {message ? (
          <section className="animate-fade-in rounded-[1.5rem] border border-[var(--border)] bg-white/70 px-5 py-4 text-sm text-[var(--muted)]">
            {message}
          </section>
        ) : null}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <TransactionList
            transactions={transactions}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isMutating={isMutating}
          />
        )}
      </div>
    </SiteShell>
  );
}
