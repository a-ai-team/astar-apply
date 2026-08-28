import { describe, expect, it } from "vitest";
import { balanceFromDays, cashConversionCycle, daysFromBalance, workingCapitalTiedUp } from "./working-capital";

// Kestrel Foods plc base year (£m): revenue 500, COGS 300, receivables 50, inventory 40, payables 30.
const KESTREL = { revenue: 500, cogs: 300, receivables: 50, inventory: 40, payables: 30 };

describe("daysFromBalance", () => {
  it("turns Kestrel's receivables into DSO off revenue", () => {
    expect(daysFromBalance(KESTREL.receivables, KESTREL.revenue)).toBeCloseTo(36.5, 2);
  });

  it("turns inventory and payables into days off COGS", () => {
    expect(daysFromBalance(KESTREL.inventory, KESTREL.cogs)).toBeCloseTo(48.67, 2);
    expect(daysFromBalance(KESTREL.payables, KESTREL.cogs)).toBeCloseTo(36.5, 2);
  });

  it("returns zero rather than dividing by zero when there is no flow", () => {
    expect(daysFromBalance(50, 0)).toBe(0);
  });
});

describe("balanceFromDays", () => {
  it("is the inverse of daysFromBalance", () => {
    const days = daysFromBalance(KESTREL.receivables, KESTREL.revenue);
    expect(balanceFromDays(days, KESTREL.revenue)).toBeCloseTo(KESTREL.receivables, 6);
  });
});

describe("cashConversionCycle", () => {
  it("is DIO + DSO − DPO — about 48.7 days for Kestrel", () => {
    expect(cashConversionCycle({ dso: 36.5, dio: 48.67, dpo: 36.5 })).toBeCloseTo(48.67, 2);
  });

  it("goes negative once DPO exceeds DIO + DSO — the supermarket case", () => {
    const ccc = cashConversionCycle({ dso: 5, dio: 20, dpo: 45 });
    expect(ccc).toBeCloseTo(-20, 6);
    expect(ccc).toBeLessThan(0);
  });

  it("is unchanged when receivables and payables move together", () => {
    expect(cashConversionCycle({ dso: 40, dio: 30, dpo: 40 })).toBeCloseTo(cashConversionCycle({ dso: 60, dio: 30, dpo: 60 }), 6);
  });
});

describe("workingCapitalTiedUp", () => {
  const base = { dso: 36.5, dio: daysFromBalance(40, 300), dpo: 36.5, revenue: 500, cogs: 300 };

  it("reproduces Kestrel's balance sheet from its days", () => {
    const w = workingCapitalTiedUp(base);
    expect(w.receivables).toBeCloseTo(50, 6);
    expect(w.inventory).toBeCloseTo(40, 6);
    expect(w.payables).toBeCloseTo(30, 6);
  });

  it("nets to £60m of operating working capital, excluding cash and debt", () => {
    expect(workingCapitalTiedUp(base).netWorkingCapital).toBeCloseTo(60, 6);
  });

  it("ties up proportionally more cash as the business grows at the same days", () => {
    const doubled = workingCapitalTiedUp({ ...base, revenue: 1000, cogs: 600 });
    expect(doubled.netWorkingCapital).toBeCloseTo(120, 6);
  });

  it("releases cash when the company takes longer to pay its suppliers", () => {
    const slower = workingCapitalTiedUp({ ...base, dpo: base.dpo + 30 });
    expect(slower.netWorkingCapital).toBeLessThan(workingCapitalTiedUp(base).netWorkingCapital);
    // 30 extra days on £300m of COGS releases about £24.7m.
    expect(workingCapitalTiedUp(base).netWorkingCapital - slower.netWorkingCapital).toBeCloseTo(24.66, 1);
  });

  it("carries the cycle alongside the balances", () => {
    expect(workingCapitalTiedUp(base).ccc).toBeCloseTo(48.67, 2);
  });
});
