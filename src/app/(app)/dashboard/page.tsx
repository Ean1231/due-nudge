import Link from "next/link";
import { redirect } from "next/navigation";
import { RecentReminders } from "@/components/dashboard/recent-reminders";
import { DashboardStats } from "@/components/dashboard/stats";
import { UnpaidInvoices } from "@/components/dashboard/unpaid-invoices";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/login");
  const gmail = (await searchParams).gmail;

  const [unpaid, clientCount, recentReminders] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id, status: "unpaid" },
      include: { client: true, reminders: { where: { status: "sent" } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.reminderLog.findMany({
      where: { invoice: { userId: user.id }, status: "sent", sentAt: { not: null } },
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
      {gmail === "connected" && user.gmailEmail ? (
        <p className="rounded-xl bg-[rgba(31,122,77,0.12)] px-4 py-3 text-sm text-[var(--ok)]">
          Gmail connected. Reminders will come from {user.gmailEmail}.
        </p>
      ) : null}
      {gmail === "failed" ? (
        <p className="rounded-xl bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          Gmail could not be connected. Try again.
        </p>
      ) : null}
      {gmail === "missing" ? (
        <p className="rounded-xl bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          Gmail sign-in is not configured yet.
        </p>
      ) : null}
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
