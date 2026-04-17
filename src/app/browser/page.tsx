import { Suspense } from "react";
import { BrowserClient } from "@/app/browser/BrowserClient";

export default function BrowserPage() {
  return (
    <Suspense
      fallback={
        <main className="grid">
          <p>Loading browser...</p>
        </main>
      }
    >
      <BrowserClient />
    </Suspense>
  );
}
