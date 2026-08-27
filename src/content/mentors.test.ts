import { describe, expect, it } from "vitest";
import { MENTORS, credentialLine, isSeat, portraitSrc, rosterWithSeats, type Mentor } from "./mentors";

const m = (slug: string): Mentor => ({ slug, name: slug, roles: ["A", "B"], university: "U", focus: [], live: true });

describe("credentialLine", () => {
  it("binds the separator to the preceding word with a non-breaking space", () => {
    expect(credentialLine({ roles: ["President, BIG", "Analyst, Fund"] })).toBe("President, BIG · Analyst, Fund");
  });
  it("single role has no separator", () => {
    expect(credentialLine({ roles: ["Only"] })).toBe("Only");
  });
});

describe("rosterWithSeats", () => {
  it("pads to a full row", () => {
    const r = rosterWithSeats([m("a")], 4);
    expect(r).toHaveLength(4);
    expect(r.filter(isSeat)).toHaveLength(3);
    expect(isSeat(r[0])).toBe(false);
  });
  it("does not pad an aligned roster", () => {
    expect(rosterWithSeats([m("a"), m("b"), m("c"), m("d")], 4).filter(isSeat)).toHaveLength(0);
  });
  it("spills into a second row and pads it", () => {
    expect(rosterWithSeats([m("a"), m("b"), m("c"), m("d"), m("e")], 4)).toHaveLength(8);
  });
  it("empty roster gives one row of seats", () => {
    expect(rosterWithSeats([], 3).every(isSeat)).toBe(true);
    expect(rosterWithSeats([], 3)).toHaveLength(3);
  });
});

describe("roster", () => {
  it("every mentor has a portrait path and at least one role", () => {
    for (const x of MENTORS) {
      expect(portraitSrc(x)).toMatch(/^\/mentors\/[a-z0-9-]+\.jpg$/);
      expect(x.roles.length).toBeGreaterThan(0);
    }
  });
});
