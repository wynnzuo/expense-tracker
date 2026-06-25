"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CategoryItem } from "@/lib/api";

const EXPENSE_COLORS = ["#da5d28", "#335c4d", "#d6a15f", "#5e6454", "#8b6f5c", "#a8b5a0"];
const INCOME_COLORS = ["#335c4d", "#2d8f6f", "#5aa77c", "#4a7a5c", "#6d9580", "#88b5a0"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/95 px-4 py-3 shadow-[var(--shadow)] backdrop-blur">
      <p className="text-sm font-medium text-[var(--foreground)]">{payload[0].name}</p>
      <p className="text-sm text-[var(--muted)]">¥{payload[0].value.toLocaleString("zh-CN")}</p>
    </div>
  );
}

export function InsightChart({
  data,
  title = "分类支出占比",
  colorSet = "expense",
}: {
  data: CategoryItem[];
  title?: string;
  colorSet?: "expense" | "income";
}) {
  const COLORS = colorSet === "income" ? INCOME_COLORS : EXPENSE_COLORS;
  const emptyLabel = colorSet === "income" ? "本月还没有收入记录。" : "本月还没有支出记录。";

  if (data.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Insights</p>
          <h2 className="font-heading mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        <p className="mt-8 text-center text-sm text-[var(--muted)]">{emptyLabel}</p>
      </section>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Insights</p>
        <h2 className="font-heading mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-6 flex flex-col items-center gap-6 md:flex-row">
        <div className="h-64 w-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={64} outerRadius={100} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto">
          {data.map((item, index) => {
            const percent = ((item.value / total) * 100).toFixed(0);
            return (
              <div
                key={item.name}
                className="flex items-center justify-between gap-8 rounded-full bg-white/75 px-4 py-3 text-sm transition hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--muted)]">{percent}%</span>
                  <span className="tabular-nums text-[var(--foreground)]">
                    ¥{item.value.toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
