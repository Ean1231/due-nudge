import { prisma } from "@/lib/db";
import { FREE_SENDS } from "@/lib/plan";
import { hasAppAccess, isBillingRequired } from "@/lib/billing/status";

export async function getSendAllowance(user: { id: string; subscriptionStatus: string }) {
  if (!isBillingRequired() || hasAppAccess(user.subscriptionStatus)) {
    return { limited: false as const, used: 0, remaining: null, blocked: false };
  }

  const used = await prisma.reminderLog.count({
    where: {
      invoice: { userId: user.id },
      status: { in: ["sending", "sent"] },
    },
  });
  const remaining = Math.max(0, FREE_SENDS - used);
  return { limited: true as const, used, remaining, blocked: remaining <= 0 };
}

export function freeSendLimitMessage() {
  return `You've used your ${FREE_SENDS} free reminders. Subscribe to keep sending.`;
}
