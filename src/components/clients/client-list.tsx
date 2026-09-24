"use client";

import { FormEvent, useState } from "react";

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
};

type Props = {
  clients: ClientRow[];
  onSave: (client: ClientRow) => Promise<string | null>;
};

export function ClientList({ clients, onSave }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (clients.length === 0) {
    return (
      <section className="panel">
        <p className="text-[var(--muted)]">No clients yet. Add one above, then create an invoice for them.</p>
      </section>
    );
  }

  async function save(event: FormEvent<HTMLFormElement>, client: ClientRow) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const message = await onSave({
      id: client.id,
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || "") || null,
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setEditingId(null);
  }

  return (
    <section className="panel">
      <ul className="divide-y divide-[var(--line)]">
        {clients.map((client) => (
          <li key={client.id} className="py-3">
            {editingId === client.id ? (
              <form onSubmit={(event) => void save(event, client)} className="grid gap-3 md:grid-cols-3">
                <input name="name" defaultValue={client.name} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
                <input name="email" type="email" defaultValue={client.email} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
                <input name="company" defaultValue={client.company ?? ""} placeholder="Company" className="rounded-xl border border-[var(--line)] px-3 py-2" />
                {error ? <p className="text-sm text-[var(--danger)] md:col-span-3">{error}</p> : null}
                <div className="flex gap-2 md:col-span-3">
                  <button className="btn btn-primary" type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save"}
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {client.email}
                    {client.company ? ` · ${client.company}` : ""}
                  </p>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => setEditingId(client.id)}>
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
