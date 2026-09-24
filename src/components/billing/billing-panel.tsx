"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { hasAppAccess, needsPaymentUpdate } from "@/lib/billing/status";
import { PLAN } from "@/lib/plan";

export function BillingPanel({ status }: { status: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"checkout" | "portal" | "sync" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const subscribed = confirmed || hasAppAccess(status);
  const paymentIssue = needsPaymentUpdate(status);

  useEffect(() => {
    if (success !== "1" || hasAppAccess(status)) return;
    void confirmPayment();
    // Confirm once when Stripe sends the user back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, status]);

  async function confirmPayment() {
    setPending("sync");
    setError(null);
    const res = await fetch("/api/stripe/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(null);
    if (!res.ok) {
      setError(data.error || "Could not confirm the payment. Try again.");
      return;
    }
    if (data.active) {
      setConfirmed(true);
      router.refresh();
      return;
    }
    setError("Stripe has not marked this subscription as active yet. Confirm payment again in a moment.");
  }

  async function startCheckout() {
    setPending("checkout");
    setError(null);
    let res: Response;
    try {
      res = await fetch("/api/stripe/checkout", { method: "POST" });
    } catch {
      setPending(null);
      setError("Network problem. Check your connection and try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPending(null);
      setError(data.error || "Could not start checkout.");
      return;
    }
    if (data.alreadySubscribed) {
      setPending(null);
      setConfirmed(true);
      router.refresh();
      return;
    }
    if (!data.url) {
      setPending(null);
      setError("Stripe did not return a checkout page.");
      return;
    }
    window.location.href = data.url;
  }

  async function openPortal() {
    setPending("portal");
    setError(null);
    let res: Response;
    try {
      res = await fetch("/api/stripe/portal", { method: "POST" });
    } catch {
      setPending(null);
      setError("Network problem. Check your connection and try again.");
      return;
    }
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
          {subscribed
            ? `${PLAN.name} is ${PLAN.priceLabel}.`
            : `${PLAN.name} is ${PLAN.priceLabel}. Your first 3 reminders are free, then a 7-day trial.`}
        </p>
      </div>
      <div className="panel space-y-4">
        {pending === "sync" ? (
          <p className="rounded-xl bg-[rgba(11,107,92,0.08)] px-4 py-3 text-sm">Confirming your payment with Stripe…</p>
        ) : null}
        {subscribed && !paymentIssue ? (
          <p className="rounded-xl bg-[rgba(31,122,77,0.12)] px-4 py-3 text-sm text-[var(--ok)]">
            {status === "trialing"
              ? "Your 7-day trial is active. You can manage invoices now."
              : "Your subscription is active. You can manage invoices now."}
          </p>
        ) : null}
        {paymentIssue ? (
          <p className="rounded-xl bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            Your last payment did not go through. Update your card to keep reminders running.
          </p>
        ) : null}
        {canceled && !subscribed ? (
          <p className="rounded-xl bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            Checkout canceled. No charge was made.
          </p>
        ) : null}
        <ul className="space-y-2 text-[var(--muted)]">
          <li>Unlimited clients & invoices</li>
          <li>Automatic reminders at due+3, +7, +14</li>
          <li>One subscription per account</li>
        </ul>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          {subscribed ? (
            <>
              <button className="btn btn-primary" type="button" disabled={pending !== null} onClick={() => void openPortal()}>
                {pending === "portal" ? "Opening…" : paymentIssue ? "Update card" : "Manage subscription"}
              </button>
              <Link href="/invoices" className="btn btn-ghost">
                Go to invoices
              </Link>
            </>
          ) : (
            <>
              <button className="btn btn-primary" type="button" disabled={pending !== null} onClick={() => void startCheckout()}>
                {pending === "checkout" ? "Redirecting…" : "Subscribe"}
              </button>
              <button className="btn btn-ghost" type="button" disabled={pending !== null} onClick={() => void confirmPayment()}>
                {pending === "sync" ? "Checking…" : "Confirm payment"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
