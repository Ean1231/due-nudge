import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/billing/billing-panel";
import { getAppUser } from "@/lib/session";

export default async function BillingPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<main className="panel">Loading billing…</main>}>
      <BillingPanel status={user.subscriptionStatus} />
    </Suspense>
  );
}
