import { describe, expect, it } from "vitest";
import { bridgeRows, computeBridge, enterpriseToEquity, equityToEnterprise, leaseView, pairsWith } from "./bridge";

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

describe("leaseView — IFRS 16 (Loop 14)", () => {
  // Harbourline plc: EqV 1,050 · debt 500 · cash 120 · preferred 30 · NCI 25 · leases 45.
  const harbourline = { ebitda: 170, ebit: 120, equityValue: 1050, debt: 500, cash: 120, preferred: 30, nci: 25, leaseLiability: 45, annualRent: 12 };

  it("capitalised: EBITDA 170 against EV 1,530 → 9.0×", () => {
    const v = leaseView(harbourline, true);
    expect(v.ebitda).toBe(170);
    expect(v.ev).toBe(1530);
    expect(v.evEbitda).toBeCloseTo(9.0, 2);
  });

  it("not capitalised: rent returns to costs and the liability leaves the bridge → 9.4×", () => {
    const v = leaseView(harbourline, false);
    expect(v.ebitda).toBe(158);
    expect(v.ev).toBe(1485);
    expect(v.evEbitda).toBeCloseTo(9.4, 1);
  });

  it("EBIT is unchanged either way — rent is swapped for right-of-use depreciation", () => {
    expect(leaseView(harbourline, true).ebit).toBe(leaseView(harbourline, false).ebit);
  });

  it("both sides move together, so the multiple shifts far less than either input", () => {
    const on = leaseView(harbourline, true);
    const off = leaseView(harbourline, false);
    const evMove = Math.abs(on.ev - off.ev) / off.ev; // ~3.0%
    const multMove = Math.abs(on.evEbitda - off.evEbitda) / off.evEbitda; // ~4.2%
    expect(evMove).toBeLessThan(0.05);
    expect(multMove).toBeLessThan(0.05);
  });

  it("a company with no leases is unaffected by the toggle", () => {
    const none = { ...harbourline, leaseLiability: 0, annualRent: 0 };
    expect(leaseView(none, true)).toEqual(leaseView(none, false));
  });
});
