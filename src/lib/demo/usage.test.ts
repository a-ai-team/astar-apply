import { afterEach, describe, expect, it } from "vitest";
import { bumpDemoUsage, clientIp, demoCap, hashIp, overCap, resetDemoMemory } from "./usage";

describe("demo chat cap", () => {
  afterEach(() => { resetDemoMemory(); delete process.env.DEMO_CHAT_DAILY_CAP; });

  it("defaults to 3 and reads the env", () => {
    expect(demoCap()).toBe(3);
    process.env.DEMO_CHAT_DAILY_CAP = "5";
    expect(demoCap()).toBe(5);
    process.env.DEMO_CHAT_DAILY_CAP = "nope";
    expect(demoCap()).toBe(3);
  });

  it("hashes IPs with a salt and never returns the raw IP", () => {
    const h = hashIp("203.0.113.9", "salt");
    expect(h).toHaveLength(32);
    expect(h).not.toContain("203");
    expect(hashIp("203.0.113.9", "salt")).toBe(h);
    expect(hashIp("203.0.113.9", "other")).not.toBe(h);
  });

  it("counts per (ip, day) in memory and trips after the cap", async () => {
    const h = hashIp("1.2.3.4", "s");
    expect(await bumpDemoUsage(h, null, "2026-08-26")).toBe(1);
    expect(await bumpDemoUsage(h, null, "2026-08-26")).toBe(2);
    expect(await bumpDemoUsage(h, null, "2026-08-26")).toBe(3);
    expect(overCap(3, 3)).toBe(false);
    expect(await bumpDemoUsage(h, null, "2026-08-26")).toBe(4);
    expect(overCap(4, 3)).toBe(true);
    expect(await bumpDemoUsage(h, null, "2026-08-27")).toBe(1);
    expect(await bumpDemoUsage(hashIp("5.6.7.8", "s"), null, "2026-08-26")).toBe(1);
  });

  it("takes the higher of the table and memory counts", async () => {
    const h = hashIp("1.2.3.4", "s");
    const db = { rpc: async () => ({ data: 7, error: null }) } as unknown as Parameters<typeof bumpDemoUsage>[1];
    expect(await bumpDemoUsage(h, db, "2026-08-26")).toBe(7);
    const broken = { rpc: async () => ({ data: null, error: { message: "missing" } }) } as unknown as Parameters<typeof bumpDemoUsage>[1];
    expect(await bumpDemoUsage(h, broken, "2026-08-26")).toBe(8);
  });

  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(clientIp(new Headers())).toBe("0.0.0.0");
  });
});
