import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveSubscription, isBillingRequired } from "@/lib/reminders";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user;
}

export async function requireSubscribedUser() {
  const user = await requireUser();
  if (!user) return { user: null, reason: "unauthenticated" as const };
  if (isBillingRequired() && !hasActiveSubscription(user.subscriptionStatus)) {
    return { user, reason: "billing" as const };
  }
  return { user, reason: null };
}
