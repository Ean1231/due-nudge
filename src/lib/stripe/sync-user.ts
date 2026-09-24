import type { User } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { isCurrentSubscription } from "@/lib/billing/status";

const PREFERRED = ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"];

export async function syncUserSubscription(user: User) {
  if (!user.stripeCustomerId) return user;

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  });

  const current = pickSubscription(subscriptions.data);
  if (!current) {
    if (user.subscriptionStatus === "none") return user;
    return prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "canceled", stripeSubscriptionId: null },
    });
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: current.id,
      subscriptionStatus: current.status,
    },
  });
}

export function pickSubscription(subscriptions: Stripe.Subscription[]) {
  return [...subscriptions].sort((a, b) => rank(a.status) - rank(b.status) || b.created - a.created)[0];
}

function rank(status: string) {
  const index = PREFERRED.indexOf(status);
  return index === -1 ? PREFERRED.length : index;
}

export function blocksNewCheckout(status: string | null | undefined) {
  return isCurrentSubscription(status);
}
