export type ParsedTransaction = {
  note: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string;
  merchant?: string | null;
};

export type AgentResult = {
  status: "interrupted" | "completed" | "error";
  threadId?: string;
  rawInput?: string;
  source?: "text" | "voice";
  finalResponse?: string | null;
  parsedTransaction?: ParsedTransaction | null;
};
