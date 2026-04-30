"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "!bg-slate-900 !border !border-slate-700 !text-slate-100",
        }}
      />
    </SessionProvider>
  );
}
