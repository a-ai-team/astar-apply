import { readFileSync } from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { handleStripeEvent, type WebhookStore } from "./webhook";
import { StripeStub } from "./stripe";
import type { PlanId } from "./plans";

const DIR = path.resolve(__dirname, "../../../fixtures/recorded/stripe");
const SECRET = "whsec_test_secret_for_fixture_replay";
const USER = "11111111-1111-4111-8111-111111111111";

function fixture(name: string): string {
  return readFileSync(path.join(DIR, name), "utf8");
}

function fakeStore() {
  const calls: { userId: string; plan: PlanId; sub: unknown }[] = [];
  const customers = new Map<string, string>([["cus_TestCustomer001", USER]]);
  const store: WebhookStore = {
    async setPlan(userId, plan, sub) { calls.push({ userId, plan, sub }); },
    async userForCustomer(id) { return customers.get(id) ?? null; },
    async priceMap() { return { core: "price_test_core_499", ai: "price_test_ai_999" }; },
  };
  return { store, calls };
}

/** Signs a raw payload the way Stripe does, then verifies it with the same code the route uses. */
function signedEvent(raw: string): Stripe.Event {
  const header = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret: SECRET });
  return new StripeStub().constructEvent(raw, header, SECRET);
}

describe("stripe webhook", () => {
  it("rejects a bad signature", () => {
    const raw = fixture("checkout.session.completed.json");
    const header = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret: "whsec_other" });
    expect(() => new StripeStub().constructEvent(raw, header, SECRET)).toThrow(/signature/i);
    expect(() => new StripeStub().constructEvent(raw + " ", header, "whsec_other")).toThrow();
  });

  it("checkout.session.completed grants the plan from metadata and stores customer ids", async () => {
    const { store, calls } = fakeStore();
    const out = await handleStripeEvent(signedEvent(fixture("checkout.session.completed.json")), store);
    expect(out.handled).toBe(true);
    expect(calls).toEqual([{ userId: USER, plan: "core", sub: { stripe_customer_id: "cus_TestCustomer001", stripe_subscription_id: "sub_TestSubscription001", status: "active" } }]);
  });

  it("customer.subscription.updated maps the price id to the plan (env first, then plans table)", async () => {
    const { store, calls } = fakeStore();
    const out = await handleStripeEvent(signedEvent(fixture("customer.subscription.updated.json")), store);
    expect(out).toMatchObject({ handled: true, userId: USER, plan: "ai" });
    expect(calls[0].sub).toMatchObject({ status: "active", stripe_subscription_id: "sub_TestSubscription001", current_period_end: new Date(1758878400 * 1000).toISOString() });
    process.env.STRIPE_PRICE_CORE = "price_test_ai_999"; // env wins over the table map
    const again = fakeStore();
    await handleStripeEvent(signedEvent(fixture("customer.subscription.updated.json")), again.store);
    expect(again.calls[0].plan).toBe("core");
    delete process.env.STRIPE_PRICE_CORE;
  });

  it("customer.subscription.deleted drops to free via the customer lookup", async () => {
    const { store, calls } = fakeStore();
    const out = await handleStripeEvent(signedEvent(fixture("customer.subscription.deleted.json")), store);
    expect(out).toMatchObject({ handled: true, plan: "free", userId: USER });
    expect(calls[0]).toMatchObject({ plan: "free", sub: { status: "canceled" } });
  });

  it("ignores events it does not know", async () => {
    const { store, calls } = fakeStore();
    const raw = JSON.stringify({ id: "evt_x", object: "event", type: "product.created", data: { object: { id: "prod_x" } } });
    const out = await handleStripeEvent(signedEvent(raw), store);
    expect(out.handled).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("stub checkout returns the success URL with the plan", async () => {
    const stub = new StripeStub();
    const { url } = await stub.createCheckout({ userId: USER, email: null, plan: "core", successUrl: "http://localhost:3000/billing/success", cancelUrl: "http://localhost:3000/pricing" });
    expect(url).toBe("http://localhost:3000/billing/success?stub=1&plan=core");
    await expect(stub.createCheckout({ userId: USER, email: null, plan: "free", successUrl: "http://x/", cancelUrl: "http://x/" })).rejects.toThrow();
  });
});
