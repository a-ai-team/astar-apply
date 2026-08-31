import { describe, expect, it } from "vitest";
import { enterpriseFromEquity, impliedFromMultiple, mean, median, multipleFromValue, spread } from "./comps";

// Marlow Instruments plc and its five peers — docs/research/technicals-v2/15-valuation.md
// § Chapter numbers. Every figure below is pinned to that table.
const PEER_EV_EBITDA = [11.0, 9.0, 12.0, 8.0, 12.0]; // Kestrel, Thornbury, Ashdown, Penrose, Halden
const MARLOW = { ebitda: 150, netDebt: 210, shares: 120 }; // debt 240 + leases 30 − cash 60

describe("median and mean", () => {
  it("takes the median of the five peer EV/EBITDA multiples", () => {
    expect(median(PEER_EV_EBITDA)).toBe(11.0);
  });

  it("takes the mean, which Penrose at 8.0× drags below the median", () => {
    expect(mean(PEER_EV_EBITDA)).toBeCloseTo(10.4, 2);
  });

  it("averages the two central values when the count is even", () => {
    expect(median([8.0, 9.0, 11.0, 12.0])).toBeCloseTo(10.0, 2);
  });

  it("returns null on an empty set rather than NaN", () => {
    expect(median([])).toBeNull();
    expect(mean([])).toBeNull();
  });

  it("shows why the median is the default: one silly peer moves the mean, not the median", () => {
    const withOutlier = [...PEER_EV_EBITDA, 30.0];
    expect(median(withOutlier)).toBeCloseTo(11.5, 2);
    expect(mean(withOutlier)).toBeCloseTo(13.67, 2);
  });
});

describe("spread", () => {
  it("gives the 8.0×–12.0× range and the quartiles the football field shades", () => {
    const s = spread(PEER_EV_EBITDA)!;
    expect(s.low).toBe(8.0);
    expect(s.high).toBe(12.0);
    expect(s.median).toBe(11.0);
    // Inclusive quartiles — the band lesson 5 shades on the football field.
    expect(s.q1).toBeCloseTo(9.0, 2);
    expect(s.q3).toBeCloseTo(12.0, 2);
  });
});

describe("impliedFromMultiple", () => {
  it("comps median 11.0× → EV £1,650m → equity £1,440m → £12.00 a share", () => {
    const r = impliedFromMultiple({ multiple: 11.0, metric: MARLOW.ebitda, netDebt: MARLOW.netDebt, shares: MARLOW.shares });
    expect(r.enterpriseValue).toBeCloseTo(1650, 2);
    expect(r.equityValue).toBeCloseTo(1440, 2);
    expect(r.perShare).toBeCloseTo(12.0, 2);
  });

  it("the mean 10.4× lands at £1,560m, £90m below the median", () => {
    const r = impliedFromMultiple({ multiple: 10.4, metric: MARLOW.ebitda, netDebt: MARLOW.netDebt, shares: MARLOW.shares });
    expect(r.enterpriseValue).toBeCloseTo(1560, 2);
  });

  it("precedents median 12.5× → EV £1,875m → equity £1,665m → £13.88 a share", () => {
    const r = impliedFromMultiple({ multiple: 12.5, metric: MARLOW.ebitda, netDebt: MARLOW.netDebt, shares: MARLOW.shares });
    expect(r.enterpriseValue).toBeCloseTo(1875, 2);
    expect(r.equityValue).toBeCloseTo(1665, 2);
    expect(r.perShare).toBeCloseTo(13.875, 3); // the spec's £13.88 is this rounded for display
  });

  // NOTE for the lesson-5 author: the spec's § Lesson 5 quotes this range as "£10.90–£13.20 →
  // equity 1,010–1,610". That does not follow from the chapter's own bridge (net debt £210m):
  // EV 1,200–1,800 gives equity £990–1,590m and £8.25–£13.25 a share. The bridge is right — it is
  // the one used for the £12.00 and £13.88 headline figures — so lesson 5's per-share range needs
  // recomputing. Same for its precedents band: 11×–14× is £12.00–£15.75, not £12.38–£14.00.
  it("the 8.0×–12.0× peer range brackets £8.25–£13.25 a share", () => {
    const low = impliedFromMultiple({ multiple: 8.0, metric: MARLOW.ebitda, netDebt: MARLOW.netDebt, shares: MARLOW.shares });
    const high = impliedFromMultiple({ multiple: 12.0, metric: MARLOW.ebitda, netDebt: MARLOW.netDebt, shares: MARLOW.shares });
    expect(low.enterpriseValue).toBeCloseTo(1200, 2);
    expect(low.perShare).toBeCloseTo(8.25, 2);
    expect(high.enterpriseValue).toBeCloseTo(1800, 2);
    expect(high.perShare).toBeCloseTo(13.25, 2);
  });

  it("returns no per-share figure when the share count is unknown", () => {
    expect(impliedFromMultiple({ multiple: 11.0, metric: 150, netDebt: 210 }).perShare).toBeNull();
  });

  it("Thornbury's own comps run: median 11.0× on £110m EBITDA → £21.40 a share", () => {
    // Lesson 2's your-turn: the other four peers plus Marlow's own 8.6× market multiple.
    const set = [11.0, 12.0, 8.0, 12.0, 1290 / 150];
    expect(median(set)).toBeCloseTo(11.0, 2);
    expect(mean(set)).toBeCloseTo(10.3, 1);
    const r = impliedFromMultiple({ multiple: 11.0, metric: 110, netDebt: 140, shares: 50 });
    expect(r.enterpriseValue).toBeCloseTo(1210, 2);
    expect(r.equityValue).toBeCloseTo(1070, 2);
    expect(r.perShare).toBeCloseTo(21.4, 2);
  });

  it("Penrose under all three methods (lesson 1's your-turn)", () => {
    const p = { metric: 80, netDebt: 130, shares: 50 };
    expect(impliedFromMultiple({ multiple: 11.0, ...p }).perShare).toBeCloseTo(15.0, 2);
    expect(impliedFromMultiple({ multiple: 12.5, ...p }).perShare).toBeCloseTo(17.4, 2);
  });
});

describe("reading a multiple back off the market", () => {
  it("Marlow's own EV of £1,290m is 8.6× its £150m EBITDA — below every peer", () => {
    expect(multipleFromValue({ enterpriseValue: 1290, metric: 150 })).toBeCloseTo(8.6, 2);
  });

  it("builds that EV from the equity value and the bridge", () => {
    expect(enterpriseFromEquity({ equityValue: 1080, netDebt: 210 })).toBe(1290);
  });

  it("guards against a zero metric rather than returning Infinity", () => {
    expect(multipleFromValue({ enterpriseValue: 1290, metric: 0 })).toBeNull();
  });
});
