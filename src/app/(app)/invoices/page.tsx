"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceRow, InvoiceTable } from "@/components/invoices/invoice-table";

type ClientOption = { id: string; name: string };

function showConnectGmailPopup() {
  window.alert("Connect Gmail first. Click the chain icon in the top-right corner, then approve email sending.");
}

export default function InvoicesPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"unpaid" | "paid" | "all">("unpaid");

  async function load() {
    const [clientsRes, invoicesRes] = await Promise.all([fetch("/api/clients"), fetch("/api/invoices")]);
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
    // Initial client-side load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("currency", "usd");
    const res = await fetch("/api/invoices", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not create invoice");
      return;
    }
    const sentTo = data.invoice?.client?.email;
    if (data.reminderStatus === "sent") {
      setNotice(`Invoice saved. A reminder was emailed to ${sentTo}.`);
    } else if (data.reminderStatus === "demo") {
      setNotice("Invoice saved. Email is in demo mode, so the reminder was printed in the server console.");
    } else if (data.reminderStatus === "failed") {
      setError(`Invoice saved, but the reminder email failed: ${data.reminderError || "unknown error"}`);
    } else if (data.reminderStatus === "limit") {
      setError(data.reminderError || "Subscribe to send more reminders.");
    } else if (data.reminderStatus === "gmail") {
      showConnectGmailPopup();
    } else {
      setNotice("Invoice saved.");
    }
    form.reset();
    await load();
  }

  async function markPaid(id: string, status: "paid" | "unpaid") {
    setError(null);
    setNotice(null);
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
    setNotice(
      status === "paid"
        ? "Marked paid. No more reminders will be sent."
        : "Marked unpaid. Scheduled reminders can send again.",
    );
    await load();
  }

  async function nudge(id: string, retryUnknown = false) {
    setError(null);
    setNotice(null);
    setNudgingId(id);
    const res = await fetch(`/api/invoices/${id}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retryUnknown }),
    });
    const data = await res.json().catch(() => ({}));
    setNudgingId(null);
    if (!res.ok) {
      if (data.code === "gmail") {
        showConnectGmailPopup();
        return;
      }
      if (data.code === "unknown") {
        const retry = window.confirm(
          `${data.error}\n\nOnly retry after confirming the message is not in Gmail Sent Mail.`,
        );
        if (retry) await nudge(id, true);
        return;
      }
      setError(data.error || "Could not send reminder");
      return;
    }
    setNotice(data.demo ? "Reminder logged in the server console." : `Reminder sent to ${data.to}.`);
    await load();
  }

  const visible = invoices.filter((invoice) => filter === "all" || invoice.status === filter);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl font-semibold">Invoices</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Saving an invoice emails the client right away. If it stays unpaid, DueNudge emails again 3, 7,
            and 14 days after the due date. Mark it paid to stop later reminders.
          </p>
        </div>
        <Link className="btn btn-primary" href="/invoice-builder">
          Create PDF invoice
        </Link>
      </div>
      {notice ? <p className="rounded-xl bg-[rgba(31,122,77,0.12)] px-4 py-3 text-sm text-[var(--ok)]">{notice}</p> : null}
      <InvoiceForm clients={clients} error={error} pending={pending} onSubmit={onSubmit} />
      <div className="flex gap-2">
        {(["unpaid", "paid", "all"] as const).map((value) => (
          <button
            key={value}
            className={filter === value ? "btn btn-primary" : "btn btn-ghost"}
            type="button"
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "All" : value === "paid" ? "Paid" : "Unpaid"}
          </button>
        ))}
      </div>
      <InvoiceTable
        invoices={visible}
        nudgingId={nudgingId}
        onStatusChange={(id, status) => void markPaid(id, status)}
        onNudge={(id) => void nudge(id)}
      />
    </main>
  );
}
