export type ParsedTransaction = {
  note: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string;
  merchant?: string | null;
};

export type AgentResult = {
  rawInput: string;
  source?: "text" | "voice";
  finalResponse?: string;
  parsedTransaction?: ParsedTransaction | null;
};
