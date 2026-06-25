import { Bot, User } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import type { Transaction } from "@/types/transaction";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
  transaction?: Transaction;
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-[var(--accent)] text-white" : isError ? "bg-red-100 text-red-500" : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] space-y-1.5 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : isError
                ? "border border-red-200 bg-red-50 text-red-600"
                : "border border-[var(--border)] bg-white/80 text-[var(--foreground)] shadow-[var(--shadow-sm)]"
          }`}
        >
          <p>{message.content}</p>
          {message.transaction ? (
            <div className="mt-2 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
              <span className={message.transaction.type === "income" ? "text-[var(--success)]" : "text-[var(--accent)]"}>
                {message.transaction.type === "income" ? "+" : "-"}¥{message.transaction.amount.toLocaleString("zh-CN")}
              </span>
              <span className="mx-2">·</span>
              <span>{message.transaction.category}</span>
            </div>
          ) : null}
        </div>
        <span className="px-1 text-[10px] text-[var(--muted)]">
          {format(message.timestamp, "HH:mm", { locale: zhCN })}
        </span>
      </div>
    </div>
  );
}
