import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to DueNudge to manage unpaid invoices and send reminders from your Gmail.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
