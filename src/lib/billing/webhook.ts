// Stripe event → entitlement mapping (Loop 10). Pure over a `WebhookStore` so it is unit-tested
// with recorded fixture events (fixtures/recorded/stripe/*.json) and a fake store; the route
// handler wires the service-role client in.
import type Stripe from "stripe";
import { isPlanId, planForPriceId, type PlanId } from "./plans";
import type { SubscriptionPatch } from "./entitlements";

export type WebhookStore = {
  setPlan(userId: string, plan: PlanId, sub: SubscriptionPatch): Promise<unknown>;
  /** user_id for a Stripe customer (from `subscriptions`), or null. */
  userForCustomer(customerId: string): Promise<string | null>;
  /** Known price ids from the `plans` table (optional; env vars are checked first). */
  priceMap?(): Promise<Partial<Record<PlanId, string | null>>>;
};

export type WebhookOutcome = { handled: boolean; userId?: string; plan?: PlanId; note: string };

const ENDED = new Set(["canceled", "unpaid", "incomplete_expired"]);

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === "string" ? x : x.id;
}

function periodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const ts = item?.current_period_end ?? legacy;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function handleStripeEvent(event: Stripe.Event, store: WebhookStore): Promise<WebhookOutcome> {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.mode !== "subscription") return { handled: false, note: `ignored ${s.mode} checkout` };
      const userId = s.client_reference_id ?? s.metadata?.user_id ?? null;
      const plan = s.metadata?.plan;
      if (!userId || !isPlanId(plan)) return { handled: false, note: "checkout without user_id/plan metadata" };
      await store.setPlan(userId, plan, { stripe_customer_id: idOf(s.customer), stripe_subscription_id: idOf(s.subscription), status: "active" });
      return { handled: true, userId, plan, note: "checkout → plan granted" };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customer = idOf(sub.customer);
      const userId = sub.metadata?.user_id ?? (customer ? await store.userForCustomer(customer) : null);
      if (!userId) return { handled: false, note: `no user for customer ${customer}` };
      const ended = event.type === "customer.subscription.deleted" || ENDED.has(sub.status);
      const priceId = sub.items?.data?.[0]?.price?.id ?? null;
      const known = store.priceMap ? await store.priceMap() : {};
      const fromPrice = planForPriceId(priceId, known);
      const fromMeta = isPlanId(sub.metadata?.plan) ? sub.metadata.plan : null;
      const plan: PlanId = ended ? "free" : (fromPrice ?? fromMeta ?? "free");
      if (!ended && !fromPrice && !fromMeta) return { handled: false, note: `unknown price ${priceId}` };
      await store.setPlan(userId, plan, { stripe_customer_id: customer, stripe_subscription_id: sub.id, status: ended ? "canceled" : sub.status, current_period_end: periodEnd(sub) });
      return { handled: true, userId, plan, note: ended ? "subscription ended → free" : `subscription ${sub.status} → ${plan}` };
    }
    case "invoice.payment_failed": {
      const inv = event.data.object;
      const customer = idOf(inv.customer);
      const userId = customer ? await store.userForCustomer(customer) : null;
      if (!userId) return { handled: false, note: "payment_failed for unknown customer" };
      // Keep the plan (Stripe retries); the status shows in /pricing. Ending is handled by
      // customer.subscription.deleted when Stripe gives up.
      return { handled: true, userId, note: "payment failed — awaiting Stripe retry" };
    }
    default:
      return { handled: false, note: `unhandled ${event.type}` };
  }
}
