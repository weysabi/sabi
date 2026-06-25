import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: {
    template: "%s | Weysabi",
    default: "Weysabi — AI orchestration for fullstack devs",
  },
  description:
    "One library, zero markup. Provider failover, structured output, RAG, streaming, guardrails, and prompts — all in a single Bun-native package.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-inter)" }}>{children}</body>
    </html>
  );
}
