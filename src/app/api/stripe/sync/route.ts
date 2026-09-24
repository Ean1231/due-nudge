import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/session";
import { isStripeConfigured } from "@/lib/stripe";
import { stripeFailureMessage } from "@/lib/stripe/errors";
import { syncUserSubscription } from "@/lib/stripe/sync-user";
import { hasAppAccess } from "@/lib/billing/status";

export async function POST() {
  const user = await getAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json({ status: user.subscriptionStatus, active: false });
  }

  try {
    const synced = await syncUserSubscription(user);
    return NextResponse.json({
      status: synced.subscriptionStatus,
      active: hasAppAccess(synced.subscriptionStatus),
    });
  } catch (err) {
    console.error("[DueNudge] Subscription sync failed:", err);
    return NextResponse.json({ error: stripeFailureMessage(err) }, { status: 503 });
  }
}
