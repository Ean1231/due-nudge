import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

async function applySubscription(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata.userId ||
    (typeof subscription.customer === "string"
      ? (
          await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer },
          })
        )?.id
      : undefined);

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      stripeCustomerId:
        typeof subscription.customer === "string" ? subscription.customer : undefined,
    },
  });
}

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
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription && session.metadata?.userId) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: {
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
