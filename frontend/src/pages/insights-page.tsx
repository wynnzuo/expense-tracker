import { useEffect, useState } from "react";

import { InsightChart } from "@/components/insight-chart";
import { SiteShell } from "@/components/site-shell";
import { SummaryCards } from "@/components/summary-cards";
import { fetchCategoryBreakdown, fetchTransactionSummary, type CategoryItem } from "@/lib/api";

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div className="skeleton mb-3 h-9 w-16" />
        <div className="skeleton h-5 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-4 md:p-5">
            <div className="skeleton mb-3 h-4 w-16" />
            <div className="skeleton h-8 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="skeleton mb-4 h-5 w-24" />
          <div className="skeleton mb-2 h-7 w-36" />
          <div className="skeleton mx-auto h-56 w-56 rounded-full" />
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="skeleton mb-4 h-5 w-24" />
          <div className="skeleton mb-2 h-7 w-36" />
          <div className="skeleton mx-auto h-56 w-56 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function InsightsPage() {
  const [summary, setSummary] = useState({
    monthlyExpense: 0,
    monthlyIncome: 0,
    weeklyExpense: 0,
    weeklyIncome: 0,
    dailyAverageExpense: 0,
    transactionCount: 0,
  });
  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, expenseData, incomeData] = await Promise.all([
          fetchTransactionSummary(),
          fetchCategoryBreakdown("expense"),
          fetchCategoryBreakdown("income"),
        ]);
        setSummary(summaryData);
        setExpenseCategories(expenseData);
        setIncomeCategories(incomeData);
      } catch {
        setSummary({ monthlyExpense: 0, monthlyIncome: 0, weeklyExpense: 0, weeklyIncome: 0, dailyAverageExpense: 0, transactionCount: 0 });
        setExpenseCategories([]);
        setIncomeCategories([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  return (
    <SiteShell currentPath="/insights">
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">统计</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            查看本月、本周的收支对比以及分类统计。
          </p>
        </section>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <SummaryCards
              monthlyExpense={summary.monthlyExpense}
              monthlyIncome={summary.monthlyIncome}
              weeklyExpense={summary.weeklyExpense}
              weeklyIncome={summary.weeklyIncome}
              dailyAverageExpense={summary.dailyAverageExpense}
              transactionCount={summary.transactionCount}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <InsightChart data={expenseCategories} title="分类支出占比" />
              <InsightChart data={incomeCategories} title="分类收入占比" colorSet="income" />
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
