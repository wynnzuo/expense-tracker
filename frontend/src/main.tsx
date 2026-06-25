import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "@/src/styles/globals.css";

const HomePage = lazy(async () => {
  const module = await import("@/src/pages/home-page");
  return { default: module.HomePage };
});

const TransactionsPage = lazy(async () => {
  const module = await import("@/src/pages/transactions-page");
  return { default: module.TransactionsPage };
});

const InsightsPage = lazy(async () => {
  const module = await import("@/src/pages/insights-page");
  return { default: module.InsightsPage };
});

function RouteFallback() {
  return (
    <main className="grain min-h-screen px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[rgba(255,252,247,0.74)] shadow-[var(--shadow)] backdrop-blur">
        <p className="text-sm text-[var(--muted)]">页面加载中...</p>
      </div>
    </main>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<HomePage />),
  },
  {
    path: "/transactions",
    element: withSuspense(<TransactionsPage />),
  },
  {
    path: "/insights",
    element: withSuspense(<InsightsPage />),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
