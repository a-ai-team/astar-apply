// Entitlements (Loop 10): what a user may do, resolved from the `entitlements` table (0011) with a
// plan-constant fallback. Pure helpers (`can`, `entitlementFor`) are unit-tested; the DB helpers
// take a client so pages, actions, the webhook and scripts share them. No `server-only` here —
// `src/lib/billing/session.ts` is the request-scoped wrapper.
import type { SupabaseClient } from "@supabase/supabase-js";
import { featuresFor, isPlanId, type Feature, type PlanId } from "./plans";

export type Entitlement = {
  plan: PlanId;
  features: Feature[];
  /** Where the plan came from: the table, the dev memory store (stub checkout without 0011) or the default. */
  source: "table" | "memory" | "default";
};

export type GateTarget = {
  /** Free content (topic.is_free) is always allowed, whatever the feature. */
  isFree?: boolean;
};

export const FREE_ENTITLEMENT: Entitlement = { plan: "free", features: featuresFor("free"), source: "default" };

export function entitlementFor(plan: PlanId, source: Entitlement["source"] = "table"): Entitlement {
  return { plan, features: featuresFor(plan), source };
}

/**
 * The single gate. `can(ent, "lessons_all", { isFree: topic.is_free })` — free targets pass for
 * everyone; otherwise the plan must carry the feature.
 */
export function can(ent: Entitlement | null | undefined, feature: Feature, target?: GateTarget): boolean {
  if (target?.isFree) return true;
  return (ent ?? FREE_ENTITLEMENT).features.includes(feature);
}

/** The cheapest plan that carries `feature` (for the UpgradeCard). */
export function planNeededFor(feature: Feature): PlanId {
  for (const p of ["core", "ai"] as PlanId[]) if (featuresFor(p).includes(feature)) return p;
  return "ai";
}

// Dev-only memory store: the StripeStub's "success" grants a plan even when 0011 is unapplied so
// the gating e2e can run against the sandbox. Never used in production (setPlan refuses).
// TODO(james): delete once 0011 is applied everywhere and the real Stripe path is wired.
const memoryPlans = new Map<string, PlanId>();

export function isTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.code === "42P01" || /schema cache|does not exist/i.test(error.message ?? "");
}

/** Reads the user's entitlement. Table absent / no row → free. */
export async function getEntitlement(db: SupabaseClient, userId: string): Promise<Entitlement> {
  const mem = process.env.NODE_ENV !== "production" ? memoryPlans.get(userId) : undefined;
  if (mem) return entitlementFor(mem, "memory");
  const { data, error } = await db.from("entitlements").select("plan_id, features").eq("user_id", userId).maybeSingle();
  if (error) {
    if (!isTableMissing(error)) console.warn("entitlements: read failed — treating as free", error.message);
    return FREE_ENTITLEMENT;
  }
  if (!data || !isPlanId(data.plan_id)) return FREE_ENTITLEMENT;
  const features = Array.isArray(data.features) && data.features.length ? (data.features as Feature[]) : featuresFor(data.plan_id);
  return { plan: data.plan_id, features, source: "table" };
}

export type SubscriptionPatch = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: string;
  current_period_end?: string | null;
};

/**
 * Grants `plan` to a user: upserts `entitlements` (+ `subscriptions` when `sub` is given). Service
 * role only (the webhook and the stub success page). Falls back to the memory store outside
 * production when the tables are absent.
 */
export async function setPlan(db: SupabaseClient, userId: string, plan: PlanId, sub?: SubscriptionPatch): Promise<Entitlement> {
  const ent = await db.from("entitlements").upsert({ user_id: userId, plan_id: plan, features: featuresFor(plan), computed_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (ent.error) {
    if (isTableMissing(ent.error) && process.env.NODE_ENV !== "production") {
      console.warn("entitlements: table missing (0011 unapplied) — plan kept in memory for this process");
      memoryPlans.set(userId, plan);
      return entitlementFor(plan, "memory");
    }
    throw ent.error;
  }
  if (sub) {
    const s = await db.from("subscriptions").upsert({ user_id: userId, plan_id: plan, ...sub }, { onConflict: "user_id" });
    if (s.error) throw s.error;
  }
  return entitlementFor(plan, "table");
}

/** Test/e2e helper: clears the memory store. */
export function resetMemoryPlans() {
  memoryPlans.clear();
}
