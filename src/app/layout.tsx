import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { RouteTransition } from "@/components/RouteTransition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Multi-Protocol File Gateway",
  description: "Unified SFTP/FTP/SMB management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-slate-900 text-slate-100`}
      >
        <Providers>
          <RouteTransition>{children}</RouteTransition>
        </Providers>
      </body>
    </html>
  );
}
