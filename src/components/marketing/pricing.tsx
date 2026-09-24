import Link from "next/link";
import { PLAN } from "@/lib/plan";

export function PricingCta() {
  return (
    <section className="border-t border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
        <div>
          <h2 className="display text-3xl">{PLAN.priceLabel}</h2>
          <p className="mt-2 text-[var(--muted)]">
            {PLAN.name}. Three reminder emails free, then the monthly price. One subscription per account.
          </p>
        </div>
        <Link href="/register" className="btn btn-primary">
          Create account
        </Link>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-[var(--muted)]">
        <span>DueNudge</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
