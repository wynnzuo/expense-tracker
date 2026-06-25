export type TransactionType = "expense" | "income";

export type TransactionStatus = "pending" | "confirmed";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
  merchant?: string;
  source: "text" | "voice";
  status: TransactionStatus;
  createdAt?: string;
};

export type TransactionSummary = {
  monthlyExpense: number;
  monthlyIncome: number;
  weeklyExpense: number;
  weeklyIncome: number;
  dailyAverageExpense: number;
  transactionCount: number;
};
