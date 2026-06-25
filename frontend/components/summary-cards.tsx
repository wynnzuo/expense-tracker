import { Calendar, CalendarRange, Calculator, TrendingDown, TrendingUp } from "lucide-react";

type SummaryCardsProps = {
  monthlyExpense: number;
  monthlyIncome: number;
  weeklyExpense: number;
  weeklyIncome: number;
  dailyAverageExpense: number;
  transactionCount: number;
};

export function SummaryCards({
  monthlyExpense,
  monthlyIncome,
  weeklyExpense,
  weeklyIncome,
  dailyAverageExpense,
  transactionCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "本月支出",
      value: `¥${monthlyExpense.toLocaleString("zh-CN")}`,
      accent: "text-[var(--accent)]",
      icon: TrendingDown,
      bg: "bg-[var(--accent-soft)]",
    },
    {
      label: "本月收入",
      value: `¥${monthlyIncome.toLocaleString("zh-CN")}`,
      accent: "text-[var(--success)]",
      icon: TrendingUp,
      bg: "bg-[var(--success-soft)]",
    },
    {
      label: "本周支出",
      value: `¥${weeklyExpense.toLocaleString("zh-CN")}`,
      accent: "text-[var(--accent)]",
      icon: CalendarRange,
      bg: "bg-[var(--accent-soft)]",
    },
    {
      label: "本周收入",
      value: `¥${weeklyIncome.toLocaleString("zh-CN")}`,
      accent: "text-[var(--success)]",
      icon: Calendar,
      bg: "bg-[var(--success-soft)]",
    },
    {
      label: "日均支出",
      value: `¥${dailyAverageExpense.toLocaleString("zh-CN")}`,
      accent: "text-[var(--foreground)]",
      icon: Calculator,
      bg: "bg-white/60",
    },
    {
      label: "记账笔数",
      value: `${transactionCount} 笔`,
      accent: "text-[var(--foreground)]",
      icon: Calculator,
      bg: "bg-white/60",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="transition-card rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-4 md:p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted)] md:text-sm">{card.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full md:h-9 md:w-9 ${card.bg}`}>
                <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${card.accent}`} />
              </span>
            </div>
            <p className={`mt-2 text-xl font-heading font-semibold tracking-tight tabular-nums md:mt-3 md:text-3xl ${card.accent}`}>
              {card.value}
            </p>
          </article>
        );
      })}
    </section>
  );
}
