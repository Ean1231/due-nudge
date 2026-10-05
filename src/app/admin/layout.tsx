import type { Metadata } from "next";
import { requireAdmin } from "@/lib/security/permissions";
import { getAppUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdmin(await getAppUser());
  return children;
}
