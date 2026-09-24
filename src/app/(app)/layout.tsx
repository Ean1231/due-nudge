import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { getSendAllowance } from "@/lib/billing/allowance";
import { getAppUser } from "@/lib/session";
import { isBillingRequired, needsPaymentUpdate } from "@/lib/billing/status";
import { FREE_SENDS } from "@/lib/plan";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser();
  if (!user) redirect("/login");

  const allowance = await getSendAllowance(user);
  const paymentFailed = isBillingRequired() && needsPaymentUpdate(user.subscriptionStatus);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="min-w-0 flex-1">
      <AppHeader label={user.businessName || user.email} gmailEmail={user.gmailEmail} />
      {paymentFailed ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          Your last payment did not go through.{" "}
          <Link href="/billing" className="font-semibold underline">
            Update your card
          </Link>
        </div>
      ) : allowance.limited && allowance.blocked ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          You&apos;ve used your {FREE_SENDS} free reminders.{" "}
          <Link href="/billing" className="font-semibold underline">
            Subscribe to keep sending
          </Link>
        </div>
      ) : allowance.limited ? (
        <div className="border-b border-[var(--line)] bg-[#fff7df] px-6 py-3 text-center text-sm">
          {allowance.remaining} of {FREE_SENDS} free reminders left.{" "}
          <Link href="/billing" className="font-semibold underline">
            Subscribe for unlimited
          </Link>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
