"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

type Client = { id: string; name: string; email: string };
type Reminder = { milestone: number };
type Invoice = {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  dueDate: string;
  status: string;
  description: string | null;
  client: Client;
  reminders: Reminder[];
};

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const [clientsRes, invoicesRes] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/invoices"),
    ]);
    const clientsData = await clientsRes.json().catch(() => ({}));
    const invoicesData = await invoicesRes.json().catch(() => ({}));
    if (!clientsRes.ok || !invoicesRes.ok) {
      setError(clientsData.error || invoicesData.error || "Could not load data");
      return;
    }
    setClients(clientsData.clients || []);
    setInvoices(invoicesData.invoices || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: formData.get("clientId"),
        number: formData.get("number"),
        amount: formData.get("amount"),
        dueDate: formData.get("dueDate"),
        description: formData.get("description") || null,
        currency: "usd",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not create invoice");
      return;
    }
    form.reset();
    await load();
  }

  async function markPaid(id: string, status: "paid" | "unpaid") {
    setError(null);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not update invoice");
      return;
    }
    await load();
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="display text-4xl font-semibold">Invoices</h1>
        <p className="mt-2 text-[var(--muted)]">
          Log what&apos;s owed. Reminders fire automatically after the due date.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel grid gap-4 md:grid-cols-2">
        <div className="field">
          <label htmlFor="clientId">Client</label>
          <select id="clientId" name="clientId" required defaultValue="">
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="number">Invoice number</label>
          <input id="number" name="number" placeholder="INV-1001" required />
        </div>
        <div className="field">
          <label htmlFor="amount">Amount (USD)</label>
          <input id="amount" name="amount" placeholder="1250.00" required />
        </div>
        <div className="field">
          <label htmlFor="dueDate">Due date</label>
          <input id="dueDate" name="dueDate" type="date" required />
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="description">Description (optional)</label>
          <input id="description" name="description" placeholder="Website redesign — March" />
        </div>
        <div className="md:col-span-2">
          {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending || clients.length === 0}>
            {pending ? "Saving…" : "Add invoice"}
          </button>
          {clients.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Add a client first.</p>
          ) : null}
        </div>
      </form>

      <section className="panel overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="text-[var(--muted)]">No invoices yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="pb-3 font-semibold">Invoice</th>
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Due</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Reminders</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-[var(--line)]">
                  <td className="py-3 font-semibold">{invoice.number}</td>
                  <td className="py-3">{invoice.client.name}</td>
                  <td className="py-3">
                    {formatMoney(invoice.amountCents, invoice.currency)}
                  </td>
                  <td className="py-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`badge ${invoice.status === "paid" ? "badge-paid" : "badge-unpaid"}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {invoice.reminders.length
                      ? invoice.reminders.map((r) => `+${r.milestone}`).join(", ")
                      : "—"}
                  </td>
                  <td className="py-3">
                    {invoice.status === "unpaid" ? (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => void markPaid(invoice.id, "paid")}
                      >
                        Mark paid
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => void markPaid(invoice.id, "unpaid")}
                      >
                        Mark unpaid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
