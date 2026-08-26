// Stripe client (Loop 10). `getBilling()` returns the real client when STRIPE_SECRET_KEY is set,
// otherwise `StripeStub` — Checkout "succeeds" straight away at /billing/success?stub=1&plan=…,
// which grants the plan only when NODE_ENV !== "production" (src/app/billing/success/page.tsx).
// Webhook verification is `stripe.webhooks.constructEvent` over the RAW body (route handler reads
// `req.text()`); the event → entitlement mapping lives in ./webhook.ts and is fixture-tested.
// TODO(james): set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_CORE / STRIPE_PRICE_AI
// (test mode first), run `npx tsx scripts/billing/sync-stripe.ts`, add the webhook endpoint.
import Stripe from "stripe";
import { isPlanId, planById, priceIdFor, type PlanId } from "./plans";

export type CheckoutInput = { userId: string; email: string | null; plan: PlanId; successUrl: string; cancelUrl: string };
export type PortalInput = { customerId: string; returnUrl: string };

export interface BillingProvider {
  readonly kind: "stripe" | "stub";
  createCheckout(input: CheckoutInput): Promise<{ url: string }>;
  createPortal(input: PortalInput): Promise<{ url: string }>;
  constructEvent(rawBody: string, signature: string, secret: string): Stripe.Event;
}

export class StripeStub implements BillingProvider {
  readonly kind = "stub" as const;
  async createCheckout(input: CheckoutInput) {
    if (!isPlanId(input.plan) || input.plan === "free") throw new Error("stub: paid plan required");
    const url = new URL(input.successUrl);
    url.searchParams.set("stub", "1");
    url.searchParams.set("plan", input.plan);
    return { url: url.toString() };
  }
  async createPortal(input: PortalInput) {
    const url = new URL(input.returnUrl);
    url.searchParams.set("portal", "stub");
    return { url: url.toString() };
  }
  constructEvent(rawBody: string, signature: string, secret: string): Stripe.Event {
    // The stub still verifies signatures (same helper as the real client) so the webhook test
    // exercises the real check without a key.
    return Stripe.webhooks.constructEvent(rawBody, signature, secret) as Stripe.Event;
  }
}

export class RealStripe implements BillingProvider {
  readonly kind = "stripe" as const;
  readonly client: Stripe;
  constructor(secretKey: string) {
    this.client = new Stripe(secretKey, { appInfo: { name: "astar-apply" } });
  }
  async createCheckout(input: CheckoutInput) {
    const price = priceIdFor(input.plan);
    if (!price) throw new Error(`No Stripe price configured for plan ${input.plan} (${planById(input.plan).priceEnv}) — run scripts/billing/sync-stripe.ts`);
    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.email ?? undefined,
      client_reference_id: input.userId,
      allow_promotion_codes: true,
      metadata: { user_id: input.userId, plan: input.plan },
      subscription_data: { metadata: { user_id: input.userId, plan: input.plan } },
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { url: session.url };
  }
  async createPortal(input: PortalInput) {
    const session = await this.client.billingPortal.sessions.create({ customer: input.customerId, return_url: input.returnUrl });
    return { url: session.url };
  }
  constructEvent(rawBody: string, signature: string, secret: string): Stripe.Event {
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}

let cached: BillingProvider | null = null;

export function getBilling(): BillingProvider {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new RealStripe(key) : new StripeStub();
  if (!key) console.warn("billing: STRIPE_SECRET_KEY unset — using StripeStub (grants plans outside production only)");
  return cached;
}

/** Test seam. */
export function resetBilling() {
  cached = null;
}
