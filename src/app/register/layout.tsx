import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a DueNudge account and send 3 invoice reminders free before you subscribe.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
