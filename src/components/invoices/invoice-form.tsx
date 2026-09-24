"use client";

import { FormEvent } from "react";

type ClientOption = { id: string; name: string };

type Props = {
  clients: ClientOption[];
  error: string | null;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function InvoiceForm({ clients, error, pending, onSubmit }: Props) {
  return (
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
  );
}
