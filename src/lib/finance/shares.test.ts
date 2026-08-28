import { describe, expect, it } from "vitest";
import { equityValue, ifConverted, treasuryStockMethod } from "./shares";

describe("treasuryStockMethod", () => {
  it("in-the-money options dilute only by the net new shares", () => {
    // 20m options at £2.10 with the share at £4.20: proceeds £42m buys back 10m shares.
    const r = treasuryStockMethod({ basicShares: 240, options: [{ count: 20, strike: 2.1 }], sharePrice: 4.2 });
    expect(r.proceeds).toBeCloseTo(42, 2);
    expect(r.sharesRepurchased).toBeCloseTo(10, 2);
    expect(r.netNewShares).toBeCloseTo(10, 2);
    expect(r.dilutedShares).toBeCloseTo(250, 2);
  });

  it("out-of-the-money options are ignored entirely", () => {
    const r = treasuryStockMethod({ basicShares: 240, options: [{ count: 20, strike: 6 }], sharePrice: 4.2 });
    expect(r.inTheMoney).toHaveLength(0);
    expect(r.netNewShares).toBeCloseTo(0, 6);
    expect(r.dilutedShares).toBeCloseTo(240, 6);
  });

  it("splits a mixed grant table correctly", () => {
    const r = treasuryStockMethod({
      basicShares: 240,
      options: [
        { count: 20, strike: 2.1 },
        { count: 15, strike: 5.0 },
        { count: 10, strike: 3.15 },
      ],
      sharePrice: 4.2,
    });
    expect(r.inTheMoney.map((o) => o.strike)).toEqual([2.1, 3.15]);
    expect(r.netNewShares).toBeCloseTo(12.5, 2);
    expect(r.dilutedShares).toBeCloseTo(252.5, 2);
  });

  it("a higher share price dilutes more (the buy-back gets less)", () => {
    const low = treasuryStockMethod({ basicShares: 240, options: [{ count: 20, strike: 2.1 }], sharePrice: 3 });
    const high = treasuryStockMethod({ basicShares: 240, options: [{ count: 20, strike: 2.1 }], sharePrice: 8 });
    expect(high.netNewShares).toBeGreaterThan(low.netNewShares);
  });

  it("options exactly at the money do not dilute", () => {
    const r = treasuryStockMethod({ basicShares: 100, options: [{ count: 10, strike: 4.2 }], sharePrice: 4.2 });
    expect(r.netNewShares).toBeCloseTo(0, 6);
  });

  it("no options leaves the basic count untouched", () => {
    expect(treasuryStockMethod({ basicShares: 240, options: [], sharePrice: 4.2 }).dilutedShares).toBe(240);
  });
});

describe("ifConverted", () => {
  it("converts when the share price clears the conversion price", () => {
    const r = ifConverted({ basicShares: 240, convertible: { principal: 100, conversionPrice: 5 }, sharePrice: 6 });
    expect(r.converts).toBe(true);
    expect(r.newShares).toBeCloseTo(20, 2);
    expect(r.dilutedShares).toBeCloseTo(260, 2);
  });

  it("stays debt below the conversion price", () => {
    const r = ifConverted({ basicShares: 240, convertible: { principal: 100, conversionPrice: 5 }, sharePrice: 4 });
    expect(r.converts).toBe(false);
    expect(r.dilutedShares).toBeCloseTo(240, 6);
  });
});

describe("equityValue", () => {
  it("is price × diluted shares", () => {
    expect(equityValue(4.2, 250)).toBeCloseTo(1050, 2);
  });
});
