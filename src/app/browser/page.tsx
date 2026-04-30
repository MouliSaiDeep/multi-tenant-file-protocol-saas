import { Suspense } from "react";
import { BrowserClient } from "@/app/browser/BrowserClient";

export default function BrowserPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl p-6">
          <div className="mb-4 h-11 animate-pulse rounded-xl border border-slate-700 bg-slate-800/50" />
          <div className="h-[360px] animate-pulse rounded-2xl border border-slate-700 bg-slate-800/40" />
        </main>
      }
    >
      <BrowserClient />
    </Suspense>
  );
}
