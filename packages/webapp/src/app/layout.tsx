import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
  title: {
    template: "%s | Weysabi",
    default: "Weysabi — AI orchestration for fullstack devs",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
