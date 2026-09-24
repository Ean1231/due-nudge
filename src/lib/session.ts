import { cache } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasAppAccess, isBillingRequired, isCurrentSubscription } from "@/lib/billing/status";
import { syncUserSubscription } from "@/lib/stripe/sync-user";

export const getAppUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  let user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  if (isBillingRequired() && user.stripeCustomerId && !isCurrentSubscription(user.subscriptionStatus)) {
    try {
      user = await syncUserSubscription(user);
    } catch (err) {
      console.error("[DueNudge] Could not sync Stripe subscription:", err);
    }
  }

  return user;
});

export async function requireSubscribedUser() {
  const user = await getAppUser();
  if (!user) return { user: null, reason: "unauthenticated" as const };
  if (isBillingRequired() && !hasAppAccess(user.subscriptionStatus)) {
    return { user, reason: "billing" as const };
  }
  return { user, reason: null };
}
