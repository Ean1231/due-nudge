import { requireAdmin } from "@/lib/security/permissions";
import { getAppUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdmin(await getAppUser());
  return children;
}
