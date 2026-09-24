"use client";

import { FormEvent, useState } from "react";
import {
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
  TEMPLATE_VARIABLES,
} from "@/lib/email/custom-template";

export function ReminderTemplateForm({
  initialSubject,
  initialBody,
}: {
  initialSubject: string;
  initialBody: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/settings/reminder-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error || "Could not save the template.");
      return;
    }
    setMessage("Reminder template saved.");
  }

  async function reset() {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/settings/reminder-template", { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      setError("Could not reset the template.");
      return;
    }
    setSubject(DEFAULT_REMINDER_SUBJECT);
    setBody(DEFAULT_REMINDER_BODY);
    setMessage("Default template restored.");
  }

  return (
    <form className="panel space-y-5" onSubmit={save}>
      <div className="field">
        <label htmlFor="reminderSubject">Subject</label>
        <input
          id="reminderSubject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="reminderBody">Message</label>
        <textarea
          id="reminderBody"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={11}
          maxLength={5000}
          required
        />
      </div>
      <p className="text-sm text-[var(--muted)]">
        Available variables: {TEMPLATE_VARIABLES.map((variable) => `{{${variable}}}`).join(", ")}
      </p>
      {message ? <p className="text-sm text-[var(--ok)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save template"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => void reset()}>
          Reset default
        </button>
      </div>
    </form>
  );
}
