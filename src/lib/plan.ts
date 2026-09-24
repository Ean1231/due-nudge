/** $12/mo plan — set STRIPE_PRICE_ID to your Stripe Price ID */
export const PLAN = {
  name: "DueNudge Pro",
  priceLabel: "$12/mo",
  amountCents: 1200,
} as const;

/** Successful reminder emails included before a subscription is required. */
export const FREE_SENDS = 3;
