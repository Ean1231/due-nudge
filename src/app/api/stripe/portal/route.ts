import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeFailureMessage } from "@/lib/stripe/errors";

export async function POST() {
  const user = await getAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStripeConfigured() || !user.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer on file" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[DueNudge] Billing portal failed:", err);
    return NextResponse.json({ error: stripeFailureMessage(err) }, { status: 503 });
  }
}
