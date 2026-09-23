"use client";

import { FormEvent, useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    await load();
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="display text-4xl font-semibold">Clients</h1>
        <p className="mt-2 text-[var(--muted)]">
          Who you invoice — reminders go to their email.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel grid gap-4 md:grid-cols-3">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="company">Company (optional)</label>
          <input id="company" name="company" />
        </div>
        <div className="md:col-span-3">
          {error ? <p className="mb-3 text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add client"}
          </button>
        </div>
      </form>

      <section className="panel">
        {clients.length === 0 ? (
          <p className="text-[var(--muted)]">No clients yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {clients.map((client) => (
              <li key={client.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {client.email}
                    {client.company ? ` · ${client.company}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
