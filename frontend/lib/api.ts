import type { AgentResult, ParsedTransaction } from "@/types/agent";
import type { Transaction } from "@/types/transaction";
import type { TransactionSummary } from "@/types/transaction";

export type CategoryItem = {
  name: string;
  value: number;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function submitAgent(input: string, source: "text" | "voice", conversationId?: string): Promise<AgentResult> {
  const response = await fetch(`${apiBaseUrl}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, source, conversationId: conversationId ?? "" }),
  });

  if (!response.ok) {
    throw new Error("Agent request failed");
  }

  return (await response.json()) as AgentResult;
}

export async function streamAgent(
  input: string,
  source: "text" | "voice",
  conversationId: string,
  onToken: (token: string) => void,
  onInterrupt: (parsedTx: ParsedTransaction) => void,
  onDone: (finalResponse: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/agent/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, source, conversationId: conversationId ?? "" }),
  });

  if (!response.ok) {
    onError("Agent request failed");
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        switch (data.type) {
          case "token":
            onToken(data.content);
            break;
          case "interrupt":
            onInterrupt(data.parsedTransaction);
            break;
          case "done":
            onDone(data.finalResponse);
            break;
          case "error":
            onError(data.message);
            break;
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export async function resumeAgent(
  threadId: string,
  source: "text" | "voice" = "text",
  conversationId?: string,
): Promise<AgentResult> {
  const response = await fetch(`${apiBaseUrl}/agent/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, source, conversationId: conversationId ?? "" }),
  });
  if (!response.ok) throw new Error("Resume failed");
  return (await response.json()) as AgentResult;
}

export async function fetchTransactions(limit = 20): Promise<Transaction[]> {
  const response = await fetch(`${apiBaseUrl}/transactions?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Transaction request failed");
  }

  const payload = (await response.json()) as { items: Transaction[] };
  return payload.items;
}

export async function fetchTransactionSummary(): Promise<TransactionSummary> {
  const response = await fetch(`${apiBaseUrl}/transactions/summary`);

  if (!response.ok) {
    throw new Error("Transaction summary request failed");
  }

  return (await response.json()) as TransactionSummary;
}

export type StoredChatMessage = {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: string;
};

export async function fetchConversation(conversationId: string): Promise<StoredChatMessage[]> {
  const response = await fetch(`${apiBaseUrl}/conversation/${conversationId}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { messages: StoredChatMessage[] };
  return data.messages;
}

export async function fetchCategoryBreakdown(type: "expense" | "income" = "expense"): Promise<CategoryItem[]> {
  const response = await fetch(`${apiBaseUrl}/transactions/categories?type=${type}`);

  if (!response.ok) {
    throw new Error("Category breakdown request failed");
  }

  return (await response.json()) as CategoryItem[];
}

export async function confirmTransaction(transactionId: string): Promise<Transaction> {
  const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}/confirm`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Transaction confirm failed");
  }

  return (await response.json()) as Transaction;
}

export async function updateTransaction(transactionId: string, payload: Transaction): Promise<Transaction> {
  const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      date: payload.date,
      note: payload.note,
      merchant: payload.merchant ?? null,
      status: payload.status,
    }),
  });

  if (!response.ok) {
    throw new Error("Transaction update failed");
  }

  return (await response.json()) as Transaction;
}

export async function createTransaction(data: ParsedTransaction, source: string = "text"): Promise<Transaction> {
  const response = await fetch(`${apiBaseUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, source }),
  });
  if (!response.ok) throw new Error("Save failed");
  return (await response.json()) as Transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Transaction delete failed");
  }
}

export async function uploadVoiceAndTranscribe(audioBlob: Blob): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch(`${apiBaseUrl}/voice`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    try {
      const payload = (await response.json()) as { detail?: string };
      throw new Error(payload.detail ?? "语音转写失败");
    } catch (parseErr) {
      // re-throw the parsed detail, or the original parse error
      if (parseErr instanceof Error && parseErr.message !== "语音转写失败") {
        throw parseErr;
      }
      throw new Error("语音转写失败");
    }
  }

  return (await response.json()) as { transcript: string };
}
