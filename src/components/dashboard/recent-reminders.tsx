type ReminderLog = {
  id: string;
  milestone: number;
  sentAt: Date | null;
  invoice: { number: string; client: { email: string } };
};

export function RecentReminders({ logs }: { logs: ReminderLog[] }) {
  return (
    <section className="panel">
      <h2 className="display text-2xl font-semibold">Recent reminders</h2>
      {logs.length === 0 ? (
        <p className="mt-3 text-[var(--muted)]">
          No reminders sent yet. Adding an invoice sends the first email. Later ones go out 3, 7, and 14 days after the due date.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 first:border-0 first:pt-0"
            >
              <span>
                <strong>{log.invoice.number}</strong> → {log.invoice.client.email} (+{log.milestone})
              </span>
              <span className="text-sm text-[var(--muted)]">{log.sentAt?.toLocaleString() || "Sending"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
