import Link from "next/link";
import { PLAN } from "@/lib/plan";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">Invoice follow-up for freelancers</p>
        <h1 className="display mt-3 max-w-xl text-5xl leading-[1.05]">Get the money you already invoiced.</h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
          Add the client and the invoice. DueNudge emails them when you save it, then again 3, 7, and 14
          days after the due date if it is still unpaid.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary">
            Send 3 reminders free
          </Link>
          <a href="#how" className="btn btn-ghost">
            How it works
          </a>
        </div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {PLAN.priceLabel} after 3 free reminders. A 7-day trial starts when you subscribe.
        </p>
      </div>
      <aside className="panel">
        <p className="text-sm font-semibold text-[var(--muted)]">What gets sent</p>
        <table className="mt-4 w-full text-left text-sm">
          <tbody>
            <tr className="border-b border-[var(--line)]">
              <td className="py-3 font-semibold">When you save</td>
              <td className="py-3 text-[var(--muted)]">First reminder</td>
            </tr>
            <tr className="border-b border-[var(--line)]">
              <td className="py-3 font-semibold">3 days late</td>
              <td className="py-3 text-[var(--muted)]">Second reminder</td>
            </tr>
            <tr className="border-b border-[var(--line)]">
              <td className="py-3 font-semibold">7 days late</td>
              <td className="py-3 text-[var(--muted)]">Third reminder</td>
            </tr>
            <tr>
              <td className="py-3 font-semibold">14 days late</td>
              <td className="py-3 text-[var(--muted)]">Last reminder</td>
            </tr>
          </tbody>
        </table>
      </aside>
    </section>
  );
}
