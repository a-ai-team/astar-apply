// Seed 10 — plans (Loop 10). Upserts the three tiers from src/lib/billing/plans.ts into `plans`
// (migration 0011). Never touches `stripe_price_id` (that is `scripts/billing/sync-stripe.ts`'s
// job) so re-running after a sync keeps the ids. No-ops with a clear message when the table is
// absent (0011 unapplied — Postgres is unreachable from the agent sandbox; James runs
// `npm run db:migrate`).
import { adminClient } from "./env";
import { PLANS } from "../../src/lib/billing/plans";

export async function seedPlans() {
  const db = adminClient();
  const probe = await db.from("plans").select("id").limit(1);
  if (probe.error) {
    console.warn(`seed 10: \`plans\` table missing (${probe.error.message}) — run \`npm run db:migrate\` (0011_billing.sql) first. Nothing to do; the app serves PLANS from src/lib/billing/plans.ts meanwhile.`);
    console.log("seed 10: acceptance → SKIPPED (table absent)");
    return;
  }
  for (const p of PLANS) {
    const { error } = await db.from("plans").upsert(
      { id: p.id, name: p.name, monthly_gbp: p.monthly_gbp, ordinal: p.ordinal, features: p.features },
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  const { data } = await db.from("plans").select("id, name, monthly_gbp, stripe_price_id").order("ordinal");
  for (const r of data ?? []) console.log(`  ${String(r.id).padEnd(5)} ${String(r.name).padEnd(5)} £${Number(r.monthly_gbp).toFixed(2)}  price ${r.stripe_price_id ?? "(unset — npx tsx scripts/billing/sync-stripe.ts)"}`);
  console.log(`seed 10: ${data?.length ?? 0} plans (expected ${PLANS.length}); acceptance → ${data?.length === PLANS.length ? "PASS" : "FAIL"}`);
}
