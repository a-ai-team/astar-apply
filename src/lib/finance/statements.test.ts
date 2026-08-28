import { describe, expect, it } from "vitest";
import { WALK_KINDS, walk, walkSummary, type WalkInput, type WalkResult } from "./statements";

const line = (r: WalkResult, section: "is" | "cfs" | "bs", name: string) => r[section].find((d) => d.line === name)?.delta;

describe("walk — depreciation (the canonical question)", () => {
  const r = walk({ kind: "depreciation", amount: 10, taxRate: 0.25 });

  it("net income falls by the after-tax amount, not the full charge", () => {
    expect(r.netIncomeDelta).toBeCloseTo(-7.5, 2);
  });

  it("cash rises by the tax saving", () => {
    expect(r.cashDelta).toBeCloseTo(2.5, 2);
  });

  it("PP&E falls by the full charge and retained earnings by net income", () => {
    expect(line(r, "bs", "PP&E")).toBeCloseTo(-10, 2);
    expect(line(r, "bs", "Retained earnings")).toBeCloseTo(-7.5, 2);
  });

  it("balances", () => {
    expect(r.balances).toBe(true);
    expect(r.check).toBeCloseTo(0, 6);
  });

  it("walks in IS → CFS → BS order with the add-back on the cash-flow statement", () => {
    expect(line(r, "cfs", "Add back depreciation")).toBeCloseTo(10, 2);
    expect(r.is[0].line).toBe("Depreciation");
  });

  it("at a 0 % tax rate cash is unchanged", () => {
    const zero = walk({ kind: "depreciation", amount: 10, taxRate: 0 });
    expect(zero.cashDelta).toBeCloseTo(0, 2);
    expect(zero.netIncomeDelta).toBeCloseTo(-10, 2);
  });
});

describe("walk — inventory bought on credit", () => {
  const r = walk({ kind: "inventory_on_credit", amount: 20 });

  it("has no income-statement or cash impact", () => {
    expect(r.netIncomeDelta).toBeCloseTo(0, 2);
    expect(r.cashDelta).toBeCloseTo(0, 2);
  });

  it("grows inventory and payables equally", () => {
    expect(line(r, "bs", "Inventory")).toBeCloseTo(20, 2);
    expect(line(r, "bs", "Accounts payable")).toBeCloseTo(20, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — raise debt", () => {
  it("without interest, cash and debt both rise and nothing hits the income statement", () => {
    const r = walk({ kind: "raise_debt", amount: 100 });
    expect(r.cashDelta).toBeCloseTo(100, 2);
    expect(line(r, "bs", "Debt")).toBeCloseTo(100, 2);
    expect(r.netIncomeDelta).toBeCloseTo(0, 2);
    expect(r.balances).toBe(true);
  });

  it("with interest, net income falls by the after-tax interest", () => {
    const r = walk({ kind: "raise_debt", amount: 100, interestRate: 0.05, taxRate: 0.25 });
    expect(r.netIncomeDelta).toBeCloseTo(-3.75, 2);
    expect(r.cashDelta).toBeCloseTo(96.25, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — buy PP&E with debt", () => {
  it("is cash-neutral in year 0 and balances", () => {
    const r = walk({ kind: "buy_ppe_with_debt", amount: 50 });
    expect(r.cashDelta).toBeCloseTo(0, 2);
    expect(line(r, "bs", "PP&E")).toBeCloseTo(50, 2);
    expect(line(r, "bs", "Debt")).toBeCloseTo(50, 2);
    expect(r.balances).toBe(true);
  });

  it("with a useful life, the first year's depreciation reduces net income after tax", () => {
    const r = walk({ kind: "buy_ppe_with_debt", amount: 50, usefulLife: 5, taxRate: 0.25 });
    expect(r.netIncomeDelta).toBeCloseTo(-7.5, 2);
    expect(line(r, "bs", "PP&E")).toBeCloseTo(40, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — pay a dividend", () => {
  const r = walk({ kind: "pay_dividend", amount: 15 });

  it("never touches the income statement", () => {
    expect(r.netIncomeDelta).toBeCloseTo(0, 2);
  });

  it("takes cash and retained earnings down together", () => {
    expect(r.cashDelta).toBeCloseTo(-15, 2);
    expect(line(r, "bs", "Retained earnings")).toBeCloseTo(-15, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — PIK interest", () => {
  const r = walk({ kind: "pik_interest", amount: 8, taxRate: 0.25 });

  it("cuts net income, accrues to debt, and lifts cash by the tax shield alone", () => {
    expect(r.netIncomeDelta).toBeCloseTo(-6, 2);
    // No cash interest is paid, but the charge is still deductible: cash rises by 8 × 25 %.
    expect(r.cashDelta).toBeCloseTo(2, 2);
    expect(line(r, "bs", "Debt (accrued PIK)")).toBeCloseTo(8, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — asset sale", () => {
  it("at a gain: cash in, asset out, gain reversed from operating", () => {
    const r = walk({ kind: "asset_sale", bookValue: 30, salePrice: 50, taxRate: 0.25 });
    expect(r.netIncomeDelta).toBeCloseTo(15, 2);
    expect(r.cashDelta).toBeCloseTo(45, 2); // 50 proceeds − 5 tax on the 20 gain
    expect(line(r, "bs", "PP&E")).toBeCloseTo(-30, 2);
    expect(r.balances).toBe(true);
  });

  it("at a loss: the loss is added back and shelters tax", () => {
    const r = walk({ kind: "asset_sale", bookValue: 30, salePrice: 20, taxRate: 0.25 });
    expect(r.netIncomeDelta).toBeCloseTo(-7.5, 2);
    expect(r.cashDelta).toBeCloseTo(22.5, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — deferred revenue", () => {
  const r = walk({ kind: "deferred_revenue", cashReceived: 120, revenueRecognised: 30, taxRate: 0.25 });

  it("recognises only the earned slice on the income statement", () => {
    expect(r.netIncomeDelta).toBeCloseTo(22.5, 2);
  });

  it("parks the rest as a liability and keeps the cash", () => {
    expect(line(r, "bs", "Deferred revenue")).toBeCloseTo(90, 2);
    expect(r.cashDelta).toBeCloseTo(112.5, 2);
    expect(r.balances).toBe(true);
  });
});

describe("walk — write-down", () => {
  const r = walk({ kind: "write_down", amount: 40, taxRate: 0.25 });

  it("is non-cash but shelters tax", () => {
    expect(r.netIncomeDelta).toBeCloseTo(-30, 2);
    expect(r.cashDelta).toBeCloseTo(10, 2);
    expect(r.balances).toBe(true);
  });
});

describe("every walk variant balances", () => {
  const inputs: WalkInput[] = [
    { kind: "depreciation", amount: 10, taxRate: 0.25 },
    { kind: "inventory_on_credit", amount: 20 },
    { kind: "raise_debt", amount: 100, interestRate: 0.06, taxRate: 0.25 },
    { kind: "buy_ppe_with_debt", amount: 50, usefulLife: 5, taxRate: 0.25 },
    { kind: "pay_dividend", amount: 15 },
    { kind: "pik_interest", amount: 8, taxRate: 0.25 },
    { kind: "asset_sale", bookValue: 30, salePrice: 50, taxRate: 0.25 },
    { kind: "deferred_revenue", cashReceived: 120, revenueRecognised: 30, taxRate: 0.25 },
    { kind: "write_down", amount: 40, taxRate: 0.25 },
  ];

  it("covers every declared kind", () => {
    expect(inputs.map((i) => i.kind).sort()).toEqual([...WALK_KINDS].sort());
  });

  it.each(inputs)("$kind balances", (input) => {
    expect(walk(input).balances).toBe(true);
  });
});

describe("walkSummary", () => {
  it("reads as a textual diff for the reduced-motion path", () => {
    const s = walkSummary(walk({ kind: "depreciation", amount: 10, taxRate: 0.25 }));
    expect(s).toContain("Cash +£2.5m");
    expect(s).toContain("PP&E −£10m");
    expect(s).toContain("Retained earnings −£7.5m");
  });
});
