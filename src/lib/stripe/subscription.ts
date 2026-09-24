import type Stripe from "stripe";
import { prisma } from "@/lib/db";

export async function applySubscription(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(subscription);
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

async function resolveUserId(subscription: Stripe.Subscription) {
  if (subscription.metadata.userId) return subscription.metadata.userId;
  if (typeof subscription.customer !== "string") return undefined;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer },
  });
  return user?.id;
}
