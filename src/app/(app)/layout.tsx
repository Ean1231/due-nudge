import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { getAppUser } from "@/lib/session";
import { hasAppAccess, isBillingRequired, needsPaymentUpdate } from "@/lib/billing/status";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const lockedOut = isBillingRequired() && !hasAppAccess(user.subscriptionStatus);
  const paymentFailed = isBillingRequired() && needsPaymentUpdate(user.subscriptionStatus);

  return (
    <div className="min-h-screen">
      <AppHeader label={user.businessName || user.email} />
      {paymentFailed ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          Your last payment did not go through.{" "}
          <Link href="/billing" className="font-semibold underline">
            Update your card
          </Link>
        </div>
      ) : lockedOut ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          Start your 7-day trial to send reminders.{" "}
          <Link href="/billing" className="font-semibold underline">
            Go to billing
          </Link>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
