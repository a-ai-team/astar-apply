import { describe, expect, it } from "vitest";
import { isRole, isStaff, roleFromClaims } from "./roles";

describe("roles", () => {
  it("reads the user_role claim, never the Postgres role", () => {
    expect(roleFromClaims({ role: "authenticated", user_role: "admin" })).toBe("admin");
    expect(roleFromClaims({ role: "authenticated" })).toBeNull();
    expect(roleFromClaims({ user_role: "superuser" })).toBeNull();
    expect(roleFromClaims(null)).toBeNull();
  });
  it("staff = admin or mentor", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("mentor")).toBe(true);
    expect(isStaff("student")).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
  it("validates role strings", () => {
    expect(isRole("student")).toBe(true);
    expect(isRole("")).toBe(false);
  });
});
