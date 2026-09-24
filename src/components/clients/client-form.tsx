"use client";

import { FormEvent } from "react";

type Props = {
  error: string | null;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ClientForm({ error, pending, onSubmit }: Props) {
  return (
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
  );
}
