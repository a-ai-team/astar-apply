import { describe, expect, it } from "vitest";
import { money, mult, pct, price, signed, spokenValue } from "./fmt";

describe("widget formatting", () => {
  // The EV bridge's readouts are asserted verbatim by e2e/03-technicals.spec.ts — these strings
  // are a contract, not a preference.
  it("formats £m the way the EV bridge e2e expects", () => {
    expect(money(1530)).toBe("£1,530m");
    expect(money(1150)).toBe("£1,150m");
    expect(money(380)).toBe("£380m");
  });

  it("uses a true minus sign for negatives", () => {
    expect(money(-120)).toBe("−£120m");
    expect(money(0)).toBe("£0m");
  });

  it("rounds to whole £m by default and honours dp", () => {
    expect(money(1529.6)).toBe("£1,530m");
    expect(money(2.54, 1)).toBe("£2.5m");
  });

  it("signs deltas", () => {
    expect(signed(2.5)).toBe("+£2.5m");
    expect(signed(-10)).toBe("−£10m");
    expect(signed(-7.5)).toBe("−£7.5m");
  });

  it("formats rates, multiples and share prices", () => {
    expect(pct(0.095)).toBe("9.5%");
    expect(pct(0.6, 0)).toBe("60%");
    expect(mult(9)).toBe("9.0×");
    expect(price(4.2)).toBe("£4.20");
  });

  it("speaks values with their units for aria-valuetext", () => {
    expect(spokenValue(500, "£m")).toBe("500 million pounds");
    expect(spokenValue(0.095, "%")).toBe("9.5 percent");
    expect(spokenValue(4.2, "£")).toBe("4.20 pounds");
  });
});
