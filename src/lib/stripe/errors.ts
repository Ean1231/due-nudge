import Stripe from "stripe";

export function stripeFailureMessage(err: unknown) {
  if (err instanceof Stripe.errors.StripeConnectionError) {
    return "Stripe is unreachable. Check your connection and try again.";
  }
  if (err instanceof Stripe.errors.StripeAPIError || err instanceof Stripe.errors.StripeRateLimitError) {
    return "Stripe had a problem completing that request. Try again in a moment.";
  }
  if (err instanceof Stripe.errors.StripeCardError) {
    return err.message;
  }
  return "Could not reach Stripe. Try again.";
}
