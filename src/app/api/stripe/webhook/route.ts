// POST /api/stripe/webhook — verifies the Stripe signature over the RAW body (never parse first),
// then maps the event to `subscriptions` / `entitlements` with the service role (the only writer).
// Returns 200 for handled and ignored events, 400 for a bad signature / missing secret. Node runtime.
// Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set STRIPE_WEBHOOK_SECRET.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBilling } from "@/lib/billing/stripe";
import { handleStripeEvent, type WebhookStore } from "@/lib/billing/webhook";
import { isTableMissing, setPlan } from "@/lib/billing/entitlements";
import type { PlanId } from "@/lib/billing/plans";

export const maxDuration = 30;

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET unset" }, { status: 400 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 });
  const raw = await req.text();
  let event;
  try {
    event = getBilling().constructEvent(raw, signature, secret);
  } catch (e) {
    return NextResponse.json({ error: `invalid signature: ${e instanceof Error ? e.message : String(e)}` }, { status: 400 });
  }
  const db = createAdminClient();
  const store: WebhookStore = {
    setPlan: (userId, plan, sub) => setPlan(db, userId, plan, sub),
    async userForCustomer(customerId) {
      const { data, error } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      if (error) { if (!isTableMissing(error)) console.warn("webhook: customer lookup failed", error.message); return null; }
      return (data?.user_id as string | undefined) ?? null;
    },
    async priceMap() {
      const { data, error } = await db.from("plans").select("id, stripe_price_id");
      if (error) return {};
      return Object.fromEntries((data ?? []).map((r) => [r.id as PlanId, (r.stripe_price_id as string | null) ?? null]));
    },
  };
  try {
    const out = await handleStripeEvent(event, store);
    console.log(`stripe webhook ${event.type}: ${out.note}`);
    return NextResponse.json({ received: true, ...out });
  } catch (e) {
    console.error("stripe webhook failed", event.type, e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
