"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PLAN } from "@/lib/plan";

function BillingInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"checkout" | "portal" | null>(null);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  async function startCheckout() {
    setPending("checkout");
    setError(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(null);
    if (!res.ok || !data.url) {
      setError(
        data.error ||
          "Stripe is not configured. For local demo, leave Stripe env vars empty and use the app freely.",
      );
      return;
    }
    window.location.href = data.url;
  }

  async function openPortal() {
    setPending("portal");
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(null);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not open billing portal");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <main className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="display text-4xl font-semibold">Billing</h1>
        <p className="mt-2 text-[var(--muted)]">
          {PLAN.name} is {PLAN.priceLabel}. Includes a 7-day free trial.
        </p>
      </div>

      <div className="panel space-y-4">
        {success ? (
          <p className="rounded-xl bg-[rgba(31,122,77,0.12)] px-4 py-3 text-sm text-[var(--ok)]">
            Subscription started. You can manage invoices now.
          </p>
        ) : null}
        {canceled ? (
          <p className="rounded-xl bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            Checkout canceled. You can try again anytime.
          </p>
        ) : null}

        <ul className="space-y-2 text-[var(--muted)]">
          <li>Unlimited clients & invoices</li>
          <li>Automatic reminders at due+3, +7, +14</li>
          <li>Dashboard for outstanding balances</li>
        </ul>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-primary"
            type="button"
            disabled={pending !== null}
            onClick={() => void startCheckout()}
          >
            {pending === "checkout" ? "Redirecting…" : "Start 7-day trial"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={pending !== null}
            onClick={() => void openPortal()}
          >
            {pending === "portal" ? "Opening…" : "Manage subscription"}
          </button>
        </div>

        <p className="text-sm text-[var(--muted)]">
          Local demo: if Stripe keys are missing, billing is skipped and the rest of the app works —
          reminder emails are logged to the server console.
        </p>
      </div>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<main className="panel">Loading billing…</main>}>
      <BillingInner />
    </Suspense>
  );
}
