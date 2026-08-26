// Creates (or finds) the Stripe products + monthly GBP prices for the paid tiers and writes the
// price ids into `plans.stripe_price_id` (0011). Only runs with STRIPE_SECRET_KEY; idempotent via
// the product `metadata.plan_id` lookup. Prints the env lines to paste into .env.local / Vercel.
//   npx tsx scripts/billing/sync-stripe.ts
import { config as loadEnv } from "dotenv";
import Stripe from "stripe";
import { PLANS } from "../../src/lib/billing/plans";
import { adminClient } from "../seed/env";

loadEnv({ path: ".env.local" });

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { console.error("sync-stripe: STRIPE_SECRET_KEY unset — nothing to do (the app uses StripeStub)."); process.exit(1); }
  const stripe = new Stripe(key);
  const db = adminClient();
  const out: string[] = [];
  for (const p of PLANS.filter((x) => x.monthly_gbp > 0)) {
    const existing = await stripe.products.search({ query: `metadata['plan_id']:'${p.id}'` });
    const product = existing.data[0] ?? (await stripe.products.create({ name: `A* Apply ${p.name}`, description: p.tagline, metadata: { plan_id: p.id } }));
    const unit = Math.round(p.monthly_gbp * 100);
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
    const price = prices.data.find((x) => x.currency === "gbp" && x.unit_amount === unit && x.recurring?.interval === "month")
      ?? (await stripe.prices.create({ product: product.id, currency: "gbp", unit_amount: unit, recurring: { interval: "month" }, metadata: { plan_id: p.id } }));
    const { error } = await db.from("plans").update({ stripe_price_id: price.id }).eq("id", p.id);
    if (error) console.warn(`sync-stripe: could not write plans.stripe_price_id for ${p.id} (${error.message}) — apply 0011 then re-run`);
    console.log(`${p.id}: product ${product.id} price ${price.id} (${p.monthly_gbp} GBP/month)`);
    out.push(`${p.priceEnv}=${price.id}`);
  }
  console.log("\nAdd to .env.local and Vercel:\n" + out.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
