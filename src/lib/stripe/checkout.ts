import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { blocksNewCheckout, syncUserSubscription } from "@/lib/stripe/sync-user";

export async function startCheckout(user: User) {
  const stripe = getStripe();
  const current = user.stripeCustomerId ? await syncUserSubscription(user) : user;
  if (blocksNewCheckout(current.subscriptionStatus)) {
    return { alreadySubscribed: true as const, url: null };
  }

  const customerId = await ensureCustomer(current);
  const open = await stripe.checkout.sessions.list({ customer: customerId, limit: 10 });
  const reusable = open.data.find((session) => session.status === "open" && session.mode === "subscription" && session.url);
  if (reusable?.url) return { alreadySubscribed: false as const, url: reusable.url };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      client_reference_id: current.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing?canceled=1`,
      metadata: { userId: current.id },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: current.id },
      },
    },
    { idempotencyKey: `checkout-${current.id}-${Math.floor(Date.now() / 20000)}` },
  );

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { alreadySubscribed: false as const, url: session.url };
}

async function ensureCustomer(user: User) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.businessName || user.name || undefined,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}
