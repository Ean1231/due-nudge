import Link from "next/link";
import { PLAN } from "@/lib/plan";

export default function HomePage() {
  return (
    <main>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="display text-2xl font-semibold tracking-tight">
          DueNudge
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Start free trial
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[78vh] w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="fade-up">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            For freelancers & small teams
          </p>
          <h1 className="display max-w-xl text-5xl font-semibold leading-[1.05] md:text-6xl">
            DueNudge
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
            Stop chasing unpaid invoices yourself. Add a client, log the invoice, and we send polite
            email reminders at day 3, 7, and 14 past due.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Try 7 days free
            </Link>
            <a href="#how" className="btn btn-ghost">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Then {PLAN.priceLabel}. Cancel anytime.
          </p>
        </div>

        <div className="fade-up-delay drift relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(160deg,#0b6b5c_0%,#084f44_55%,#0f2f2a_100%)] p-8 text-white shadow-[0_30px_80px_rgba(8,79,68,0.35)]">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Today&apos;s nudges</p>
          <div className="mt-6 space-y-4">
            {[
              { client: "Northwind Studio", invoice: "INV-1042", when: "+3 days" },
              { client: "Bright Path Co", invoice: "INV-1038", when: "+7 days" },
              { client: "Harbor Legal", invoice: "INV-1021", when: "+14 days" },
            ].map((item) => (
              <div
                key={item.invoice}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.client}</p>
                    <p className="text-sm text-white/70">{item.invoice}</p>
                  </div>
                  <span className="rounded-full bg-[#c9a227] px-3 py-1 text-xs font-bold text-[#10231f]">
                    {item.when}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="display text-3xl font-semibold">One job: get paid</h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          DueNudge keeps the workflow tiny so you actually use it.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Add clients",
              body: "Store the people who owe you money, with the email that should get reminders.",
            },
            {
              title: "Log invoices",
              body: "Number, amount, due date. Mark paid when the money lands.",
            },
            {
              title: "Auto follow-up",
              body: "We email at due+3, +7, and +14 — firm, polite, and on schedule.",
            },
          ].map((step) => (
            <div key={step.title} className="panel">
              <h3 className="display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[rgba(251,254,253,0.7)] py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <h2 className="display text-3xl font-semibold">Simple pricing</h2>
            <p className="mt-2 text-[var(--muted)]">
              {PLAN.name} — {PLAN.priceLabel}. 7-day free trial included.
            </p>
          </div>
          <Link href="/register" className="btn btn-primary">
            Create account
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-sm text-[var(--muted)]">
        <span>© {new Date().getFullYear()} DueNudge</span>
        <span>Built for freelancers who hate chasing payments</span>
      </footer>
    </main>
  );
}
