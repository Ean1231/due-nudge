"use client";

import { formatDate } from "@/lib/dates";
import { nextScheduledReminder, reminderLabel } from "@/lib/invoices/schedule";
import { formatMoney } from "@/lib/money";

export type InvoiceRow = {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  dueDate: string;
  status: string;
  attachmentName: string | null;
  sourceDocumentName: string | null;
  client: { name: string; email: string };
  reminders: { milestone: number }[];
};

type Props = {
  invoices: InvoiceRow[];
  nudgingId: string | null;
  onStatusChange: (id: string, status: "paid" | "unpaid") => void;
  onNudge: (id: string) => void;
};

export function InvoiceTable({ invoices, nudgingId, onStatusChange, onNudge }: Props) {
  if (invoices.length === 0) {
    return (
      <section className="panel">
        <p className="text-[var(--muted)]">Nothing in this list.</p>
      </section>
    );
  }

  return (
    <section className="panel overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-[var(--muted)]">
          <tr>
            <th className="pb-3 font-semibold">Invoice</th>
            <th className="pb-3 font-semibold">Client</th>
            <th className="pb-3 font-semibold">Amount</th>
            <th className="pb-3 font-semibold">Due</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Reminders</th>
            <th className="pb-3 font-semibold">Next email</th>
            <th className="pb-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-t border-[var(--line)]">
              <td className="py-3 font-semibold">
                <span>{invoice.number}</span>
                {invoice.attachmentName ? (
                  <a
                    className="mt-1 block text-xs font-normal text-[var(--brand)] underline"
                    href={`/api/invoices/${invoice.id}/attachment`}
                  >
                    Download PDF
                  </a>
                ) : null}
                {invoice.sourceDocumentName ? (
                  <a
                    className="mt-1 block text-xs font-normal text-[var(--brand)] underline"
                    href={`/api/invoices/${invoice.id}/source-document`}
                  >
                    Original file
                  </a>
                ) : null}
              </td>
              <td className="py-3">{invoice.client.name}</td>
              <td className="py-3">{formatMoney(invoice.amountCents, invoice.currency)}</td>
              <td className="py-3">{formatDate(invoice.dueDate)}</td>
              <td className="py-3">
                <span className={`badge ${invoice.status === "paid" ? "badge-paid" : "badge-unpaid"}`}>
                  {invoice.status === "paid" ? "Paid" : "Unpaid"}
                </span>
              </td>
              <td className="py-3">{formatMilestones(invoice.reminders)}</td>
              <td className="py-3">{nextLabel(invoice)}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-2">
                  {invoice.status === "unpaid" ? (
                    <button
                      className="btn btn-ghost"
                      type="button"
                      disabled={nudgingId === invoice.id}
                      onClick={() => onNudge(invoice.id)}
                    >
                      {nudgingId === invoice.id ? "Sending…" : "Send now"}
                    </button>
                  ) : null}
                  <StatusButton invoice={invoice} onStatusChange={onStatusChange} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StatusButton({
  invoice,
  onStatusChange,
}: {
  invoice: InvoiceRow;
  onStatusChange: Props["onStatusChange"];
}) {
  const next = invoice.status === "unpaid" ? "paid" : "unpaid";
  const label = next === "paid" ? "Mark paid" : "Mark unpaid";
  return (
    <button className="btn btn-ghost" type="button" onClick={() => onStatusChange(invoice.id, next)}>
      {label}
    </button>
  );
}

function formatMilestones(reminders: { milestone: number }[]) {
  if (reminders.length === 0) return "—";
  return reminders.map((reminder) => reminderLabel(reminder.milestone)).join(", ");
}

function nextLabel(invoice: InvoiceRow) {
  if (invoice.status === "paid") return "—";
  const next = nextScheduledReminder(
    invoice.dueDate,
    invoice.reminders.map((reminder) => reminder.milestone),
  );
  return next ? formatDate(next) : "Schedule finished";
}
