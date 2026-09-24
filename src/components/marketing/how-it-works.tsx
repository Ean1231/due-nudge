const steps = [
  ["1", "Add the client", "Name and the email that should receive the reminder."],
  ["2", "Log the invoice", "Number, amount, and due date. Mark it paid when the money arrives."],
  ["3", "Leave the follow-up", "Four emails at most. Paid invoices are left alone."],
];

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-[var(--line)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="display text-3xl">Three steps</h2>
        <ol className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {steps.map(([num, title, body]) => (
            <li key={num} className="grid gap-2 py-5 sm:grid-cols-[4rem_1fr]">
              <span className="font-semibold text-[var(--muted)]">{num}</span>
              <div>
                <h3 className="display text-xl">{title}</h3>
                <p className="mt-1 text-[var(--muted)]">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
