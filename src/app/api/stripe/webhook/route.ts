import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { applySubscription } from "@/lib/stripe/subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[DueNudge] Stripe webhook rejected:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleEvent(stripe, event);
  } catch (err) {
    console.error("[DueNudge] Stripe webhook handler failed:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(stripe: Stripe, event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    await handleCheckout(stripe, event.data.object as Stripe.Checkout.Session);
    return;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    await applySubscription(event.data.object as Stripe.Subscription);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    await applySubscription(await stripe.subscriptions.retrieve(subscriptionId));
  }
}

async function handleCheckout(stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const userId = await resolveCheckoutUser(session);
  if (!userId) return;

  const customerId = typeof session.customer === "string" ? session.customer : null;
  if (!session.subscription) {
    if (customerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    },
  });
}

async function resolveCheckoutUser(session: Stripe.Checkout.Session) {
  if (session.metadata?.userId || session.client_reference_id) {
    return session.metadata?.userId || session.client_reference_id;
  }
  const customerId = typeof session.customer === "string" ? session.customer : null;
  if (!customerId) return null;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  return user?.id ?? null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}
