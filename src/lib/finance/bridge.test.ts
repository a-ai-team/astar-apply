import { describe, expect, it } from "vitest";
import { bridgeRows, computeBridge, enterpriseToEquity, equityToEnterprise, pairsWith } from "./bridge";

// The Loop 03 widget defaults — behaviour must not change.
const HARBOURLINE = { share_price: 4.2, diluted_shares: 250, debt: 500, cash: 120, preferred: 30, nci: 25, leases: 45 };

describe("computeBridge", () => {
  it("matches the Loop 03 widget's numbers", () => {
    const { eqv, netDebt, ev } = computeBridge(HARBOURLINE);
    expect(eqv).toBeCloseTo(1050, 2);
    expect(netDebt).toBeCloseTo(380, 2);
    expect(ev).toBeCloseTo(1530, 2);
  });

  it("gives net cash when cash exceeds debt", () => {
    const { netDebt, ev, eqv } = computeBridge({ ...HARBOURLINE, debt: 50, cash: 400, preferred: 0, nci: 0, leases: 0 });
    expect(netDebt).toBeCloseTo(-350, 2);
    expect(ev).toBeLessThan(eqv);
  });
});

describe("equityToEnterprise / enterpriseToEquity", () => {
  it("round-trips", () => {
    const claims = { debt: 500, cash: 120, preferred: 30, nci: 25, leases: 45 };
    const ev = equityToEnterprise(1050, claims);
    expect(ev).toBeCloseTo(1530, 2);
    expect(enterpriseToEquity(ev, claims)).toBeCloseTo(1050, 2);
  });

  it("treats missing claims as zero", () => {
    expect(equityToEnterprise(1000, { debt: 200, cash: 50 })).toBeCloseTo(1150, 2);
  });
});

describe("bridgeRows", () => {
  const rows = bridgeRows(HARBOURLINE);

  it("starts at equity value and ends at enterprise value", () => {
    expect(rows[0]).toMatchObject({ kind: "start", value: 1050 });
    expect(rows.at(-1)).toMatchObject({ kind: "end", value: 1530 });
  });

  it("carries a running total that reaches EV", () => {
    expect(rows.at(-2)?.running).toBeCloseTo(1530, 2);
  });

  it("marks cash as the only subtraction here", () => {
    expect(rows.filter((r) => r.kind === "subtract").map((r) => r.label)).toEqual(["− Cash"]);
  });

  it("drops zero steps", () => {
    const sparse = bridgeRows({ ...HARBOURLINE, preferred: 0, nci: 0, leases: 0 });
    expect(sparse.map((r) => r.label)).toEqual(["Equity value", "+ Debt", "− Cash", "Enterprise value"]);
  });
});

describe("pairsWith", () => {
  it("puts pre-interest metrics with enterprise value", () => {
    expect(pairsWith("EBITDA")).toBe("enterprise");
    expect(pairsWith("Revenue")).toBe("enterprise");
    expect(pairsWith("EBIT")).toBe("enterprise");
  });

  it("puts post-interest metrics with equity value", () => {
    expect(pairsWith("Net income")).toBe("equity");
    expect(pairsWith("EPS")).toBe("equity");
  });

  it("is case-insensitive and returns null for anything else", () => {
    expect(pairsWith("  ebitda ")).toBe("enterprise");
    expect(pairsWith("Gross margin")).toBeNull();
  });
});
