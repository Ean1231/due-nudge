"use client";

import { FormEvent, useEffect, useState } from "react";
import { ClientForm } from "@/components/clients/client-form";
import { ClientList, ClientRow } from "@/components/clients/client-list";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    const res = await fetch("/api/clients");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not load clients");
      return;
    }
    setClients(data.clients || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company") || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not add client");
      return;
    }
    form.reset();
    setNotice("Client saved. Next, add an invoice for them.");
    await load();
  }

  async function saveClient(client: ClientRow) {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not update client";
    setNotice("Client updated. Future reminders use this email.");
    await load();
    return null;
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="display text-4xl font-semibold">Clients</h1>
        <p className="mt-2 text-[var(--muted)]">
          Reminders go to the email you save here. Edit it if you typed it wrong.
        </p>
      </div>
      {notice ? <p className="rounded-xl bg-[rgba(31,122,77,0.12)] px-4 py-3 text-sm text-[var(--ok)]">{notice}</p> : null}
      <ClientForm error={error} pending={pending} onSubmit={onSubmit} />
      <ClientList clients={clients} onSave={saveClient} />
    </main>
  );
}
