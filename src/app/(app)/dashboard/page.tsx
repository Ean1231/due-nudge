import Link from "next/link";
import { redirect } from "next/navigation";
import { RecentReminders } from "@/components/dashboard/recent-reminders";
import { DashboardStats } from "@/components/dashboard/stats";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { hasAppAccess, isBillingRequired } from "@/lib/billing/status";

export default async function DashboardPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");
  if (isBillingRequired() && !hasAppAccess(user.subscriptionStatus)) {
    redirect("/billing");
  }

  const [unpaid, clientCount, recentReminders] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id, status: "unpaid" },
      include: { client: true, reminders: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.reminderLog.findMany({
      where: { invoice: { userId: user.id } },
      include: { invoice: { include: { client: true } } },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
  ]);

  const outstandingCents = unpaid.reduce((sum, invoice) => sum + invoice.amountCents, 0);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl font-semibold">Overview</h1>
          <p className="mt-2 text-[var(--muted)]">
            Track what&apos;s unpaid and what DueNudge has already chased.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/clients" className="btn btn-ghost">
            Add client
          </Link>
          <Link href="/invoices" className="btn btn-primary">
            Add invoice
          </Link>
        </div>
      </div>
      {clientCount === 0 ? (
        <section className="panel">
          <h2 className="display text-2xl font-semibold">Start with a client</h2>
          <p className="mt-2 text-[var(--muted)]">
            Add the person who owes you, then log their invoice. DueNudge emails that address.
          </p>
          <Link href="/clients" className="btn btn-primary mt-4">
            Add a client
          </Link>
        </section>
      ) : unpaid.length === 0 ? (
        <section className="panel">
          <h2 className="display text-2xl font-semibold">No unpaid invoices</h2>
          <p className="mt-2 text-[var(--muted)]">Add an invoice when you send work out. Reminders follow from there.</p>
          <Link href="/invoices" className="btn btn-primary mt-4">
            Add an invoice
          </Link>
        </section>
      ) : null}
      <DashboardStats
        outstandingCents={outstandingCents}
        unpaidCount={unpaid.length}
        clientCount={clientCount}
      />
      {unpaid.length > 0 ? <UnpaidInvoices invoices={unpaid} /> : null}
      <RecentReminders logs={recentReminders} />
    </main>
  );
}
