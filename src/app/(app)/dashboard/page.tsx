import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { hasActiveSubscription, isBillingRequired } from "@/lib/reminders";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  if (isBillingRequired() && !hasActiveSubscription(user.subscriptionStatus)) {
    redirect("/billing");
  }

  const [unpaid, clients, recentReminders] = await Promise.all([
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

  const outstandingCents = unpaid.reduce((sum, inv) => sum + inv.amountCents, 0);
  const today = startOfDay(new Date());

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel">
          <p className="text-sm font-semibold text-[var(--muted)]">Outstanding</p>
          <p className="display mt-2 text-3xl font-semibold">{formatMoney(outstandingCents)}</p>
        </div>
        <div className="panel">
          <p className="text-sm font-semibold text-[var(--muted)]">Unpaid invoices</p>
          <p className="display mt-2 text-3xl font-semibold">{unpaid.length}</p>
        </div>
        <div className="panel">
          <p className="text-sm font-semibold text-[var(--muted)]">Clients</p>
          <p className="display mt-2 text-3xl font-semibold">{clients}</p>
        </div>
      </div>

      <section className="panel">
        <h2 className="display text-2xl font-semibold">Unpaid invoices</h2>
        {unpaid.length === 0 ? (
          <p className="mt-3 text-[var(--muted)]">You&apos;re all caught up. Nice.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[var(--muted)]">
                <tr>
                  <th className="pb-3 font-semibold">Invoice</th>
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Due</th>
                  <th className="pb-3 font-semibold">Reminders</th>
                </tr>
              </thead>
              <tbody>
                {unpaid.map((invoice) => {
                  const days = differenceInCalendarDays(today, startOfDay(invoice.dueDate));
                  return (
                    <tr key={invoice.id} className="border-t border-[var(--line)]">
                      <td className="py-3 font-semibold">{invoice.number}</td>
                      <td className="py-3">{invoice.client.name}</td>
                      <td className="py-3">
                        {formatMoney(invoice.amountCents, invoice.currency)}
                      </td>
                      <td className="py-3">
                        {invoice.dueDate.toLocaleDateString()}{" "}
                        <span className="text-[var(--muted)]">
                          ({days > 0 ? `${days}d overdue` : days === 0 ? "due today" : `in ${Math.abs(days)}d`})
                        </span>
                      </td>
                      <td className="py-3">
                        {invoice.reminders.length
                          ? invoice.reminders.map((r) => `+${r.milestone}`).join(", ")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="display text-2xl font-semibold">Recent reminders</h2>
        {recentReminders.length === 0 ? (
          <p className="mt-3 text-[var(--muted)]">
            No reminders sent yet. They go out automatically once invoices pass due+3 / +7 / +14.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentReminders.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 first:border-0 first:pt-0"
              >
                <span>
                  <strong>{log.invoice.number}</strong> → {log.invoice.client.email} (+
                  {log.milestone})
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {log.sentAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
