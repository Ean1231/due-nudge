import { differenceInCalendarDays, startOfDay } from "date-fns";
import { formatDate } from "@/lib/dates";
import { nextScheduledReminder, reminderLabel } from "@/lib/invoices/schedule";
import { formatMoney } from "@/lib/money";

type UnpaidInvoice = {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  dueDate: Date;
  client: { name: string };
  reminders: { milestone: number }[];
};

export function UnpaidInvoices({ invoices }: { invoices: UnpaidInvoice[] }) {
  const today = startOfDay(new Date());

  return (
    <section className="panel">
      <h2 className="display text-2xl font-semibold">Unpaid invoices</h2>
      {invoices.length === 0 ? (
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
                <th className="pb-3 font-semibold">Next email</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-[var(--line)]">
                  <td className="py-3 font-semibold">{invoice.number}</td>
                  <td className="py-3">{invoice.client.name}</td>
                  <td className="py-3">{formatMoney(invoice.amountCents, invoice.currency)}</td>
                  <td className="py-3">
                    {formatDate(invoice.dueDate)}{" "}
                    <span className="text-[var(--muted)]">({dueLabel(today, invoice.dueDate)})</span>
                  </td>
                  <td className="py-3">
                    {invoice.reminders.length
                      ? invoice.reminders.map((reminder) => reminderLabel(reminder.milestone)).join(", ")
                      : "—"}
                  </td>
                  <td className="py-3">{nextEmail(invoice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function nextEmail(invoice: UnpaidInvoice) {
  const next = nextScheduledReminder(
    invoice.dueDate,
    invoice.reminders.map((reminder) => reminder.milestone),
  );
  return next ? formatDate(next) : "Schedule finished";
}

function dueLabel(today: Date, dueDate: Date) {
  const days = differenceInCalendarDays(today, startOfDay(dueDate));
  if (days > 0) return `${days}d overdue`;
  if (days === 0) return "due today";
  return `in ${Math.abs(days)}d`;
}
