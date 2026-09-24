export function isBillingRequired() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export function hasAppAccess(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export function isCurrentSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due" || status === "unpaid";
}

export function needsPaymentUpdate(status: string | null | undefined) {
  return status === "past_due" || status === "unpaid";
}
