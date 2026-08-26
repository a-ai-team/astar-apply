import { describe, expect, it } from "vitest";
import { safeTeamNext, teamEntryTarget } from "./target";

const origin = "https://apply.example";

describe("/auth/team next validation", () => {
  it("accepts same-site relative paths", () => {
    expect(safeTeamNext("/home")).toBe("/home");
    expect(safeTeamNext("/admin/users?x=1")).toBe("/admin/users?x=1");
  });

  it("falls back to /home for missing, absolute or protocol-relative values", () => {
    expect(safeTeamNext(null)).toBe("/home");
    expect(safeTeamNext(undefined)).toBe("/home");
    expect(safeTeamNext("")).toBe("/home");
    expect(safeTeamNext("home")).toBe("/home");
    expect(safeTeamNext("https://evil.example/")).toBe("/home");
    expect(safeTeamNext("//evil.example/")).toBe("/home");
    expect(safeTeamNext(42)).toBe("/home");
  });

  it("redirects to next once the session is established", () => {
    expect(teamEntryTarget(origin, "/admin", "ok")).toBe(`${origin}/admin`);
    expect(teamEntryTarget(origin, "//evil.example", "ok")).toBe(`${origin}/home`);
  });

  it("bounces to /unlock (keeping next) without a valid key cookie", () => {
    expect(teamEntryTarget(origin, "/home/practice", "no-key")).toBe(`${origin}/unlock?next=%2Fhome%2Fpractice`);
  });

  it("flags a session failure on the unlock page", () => {
    expect(teamEntryTarget(origin, "/home", "session-failed")).toBe(`${origin}/unlock?next=%2Fhome&error=session`);
  });
});
