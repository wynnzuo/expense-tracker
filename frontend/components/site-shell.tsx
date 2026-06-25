import { Link } from "react-router-dom";
import { BarChart3, List, MessageSquareText } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "记账", icon: MessageSquareText },
  { href: "/transactions", label: "账单", icon: List },
  { href: "/insights", label: "统计", icon: BarChart3 },
];

export function SiteShell({
  children,
  currentPath,
  variant = "default",
}: {
  children: ReactNode;
  currentPath: string;
  variant?: "default" | "chat";
}) {
  const isChat = variant === "chat";

  return (
    <main className="grain min-h-screen px-3 py-3 md:px-5 md:py-5">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col border border-[var(--border)] bg-[rgba(255,252,247,0.74)] shadow-[var(--shadow)] backdrop-blur",
          isChat ? "min-h-[calc(100vh-1.5rem)] rounded-[1.5rem]" : "min-h-[calc(100vh-3rem)] rounded-[2rem]",
        )}
      >
        <header className="flex shrink-0 items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="hover:opacity-80">
            <h1 className="font-heading text-lg font-semibold tracking-tight md:text-xl">记账助手</h1>
          </Link>
          <nav className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/70 p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors md:px-4 md:py-2 md:text-sm",
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
        <div className={cn("flex-1", isChat ? "px-3 pb-3 md:px-5 md:pb-5" : "px-5 pb-5 md:px-7 md:pb-7")}>
          {children}
        </div>
      </div>
    </main>
  );
}
