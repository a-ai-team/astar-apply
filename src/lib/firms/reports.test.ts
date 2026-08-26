import { describe, expect, it } from "vitest";
import { dayStart, parseReportInput, reportAllowance, REPORTS_PER_DAY } from "./reports";

describe("report rate limit", () => {
  it("allows five per day and then refuses", () => {
    expect(REPORTS_PER_DAY).toBe(5);
    expect(reportAllowance(0)).toEqual({ allowed: true, remaining: 5 });
    expect(reportAllowance(4)).toEqual({ allowed: true, remaining: 1 });
    expect(reportAllowance(5)).toEqual({ allowed: false, remaining: 0 });
    expect(reportAllowance(9)).toEqual({ allowed: false, remaining: 0 });
  });
  it("uses UTC midnight as the window start", () => {
    expect(dayStart(new Date("2026-08-25T23:59:00Z"))).toBe("2026-08-25T00:00:00.000Z");
    expect(dayStart(new Date("2026-08-26T00:00:01Z"))).toBe("2026-08-26T00:00:00.000Z");
  });
});

describe("parseReportInput", () => {
  const fd = (over: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ firm_id: "3fa85f64-5717-4562-b3c3-2c963f66afa6", programme: "summer", stage: "hirevue", division: "", asked_at: "2026-03", context: "", question: "Why do you want to work in our markets business?", ...over })) f.set(k, v);
    return f;
  };
  it("accepts a good report and normalises blanks + month dates", () => {
    const r = parseReportInput(fd({}));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.division).toBeNull();
      expect(r.value.asked_at).toBe("2026-03-01");
      expect(r.value.context).toBeNull();
    }
  });
  it("rejects short questions, bad enums and bad dates", () => {
    expect(parseReportInput(fd({ question: "Why?" })).ok).toBe(false);
    expect(parseReportInput(fd({ stage: "phone" })).ok).toBe(false);
    expect(parseReportInput(fd({ asked_at: "March 2026" })).ok).toBe(false);
    expect(parseReportInput(fd({ firm_id: "nope" })).ok).toBe(false);
  });
});
