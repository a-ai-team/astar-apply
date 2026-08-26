import { describe, expect, it } from "vitest";
import { can, entitlementFor, FREE_ENTITLEMENT, isTableMissing, planNeededFor } from "./entitlements";
import { FEATURES, featuresFor, planForPriceId, PLANS } from "./plans";

describe("entitlement matrix", () => {
  const free = FREE_ENTITLEMENT;
  const core = entitlementFor("core");
  const ai = entitlementFor("ai");

  it("free content is open to every plan", () => {
    for (const ent of [free, core, ai]) {
      expect(can(ent, "lessons_all", { isFree: true })).toBe(true);
      expect(can(ent, "bank_full", { isFree: true })).toBe(true);
    }
    expect(can(null, "lessons_all", { isFree: true })).toBe(true);
  });

  it("paid topics need core; analytics need ai", () => {
    expect(can(free, "lessons_all", { isFree: false })).toBe(false);
    expect(can(core, "lessons_all", { isFree: false })).toBe(true);
    expect(can(ai, "lessons_all")).toBe(true);
    expect(can(free, "ai_drills")).toBe(false);
    expect(can(core, "ai_drills")).toBe(true);
    expect(can(core, "srs_analytics")).toBe(false);
    expect(can(ai, "srs_analytics")).toBe(true);
    expect(can(free, "pulse")).toBe(true);
  });

  it("plans are nested supersets", () => {
    const f = new Set(featuresFor("free")), c = new Set(featuresFor("core")), a = new Set(featuresFor("ai"));
    for (const x of f) expect(c.has(x)).toBe(true);
    for (const x of c) expect(a.has(x)).toBe(true);
    expect(a.size).toBe(FEATURES.length);
    expect(PLANS.map((p) => p.monthly_gbp)).toEqual([0, 4.99, 9.99]);
  });

  it("planNeededFor picks the cheapest plan", () => {
    expect(planNeededFor("lessons_all")).toBe("core");
    expect(planNeededFor("srs_analytics")).toBe("ai");
  });

  it("planForPriceId reads env or a known map", () => {
    expect(planForPriceId("price_x")).toBeNull();
    expect(planForPriceId("price_x", { core: "price_x" })).toBe("core");
    process.env.STRIPE_PRICE_AI = "price_ai_test";
    expect(planForPriceId("price_ai_test")).toBe("ai");
    delete process.env.STRIPE_PRICE_AI;
  });

  it("isTableMissing recognises PostgREST + Postgres codes", () => {
    expect(isTableMissing({ code: "PGRST205", message: "Could not find the table 'public.plans' in the schema cache" })).toBe(true);
    expect(isTableMissing({ code: "42P01", message: "relation does not exist" })).toBe(true);
    expect(isTableMissing({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isTableMissing(null)).toBe(false);
  });
});
