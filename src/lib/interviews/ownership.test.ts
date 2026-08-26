import { describe, expect, it } from "vitest";
import { assertOwnership, checkOwnership, OwnershipError } from "./ownership";

describe("interview ownership", () => {
  const row = { id: "i-1", user_id: "u-1" };
  it("own row passes", () => {
    expect(checkOwnership(row, "u-1")).toEqual({ ok: true });
    expect(assertOwnership(row, "u-1")).toBe(row);
  });
  it("another user's interview → 403", () => {
    expect(checkOwnership(row, "u-2")).toMatchObject({ ok: false, status: 403 });
    expect(() => assertOwnership(row, "u-2")).toThrow(OwnershipError);
    try {
      assertOwnership(row, "u-2");
    } catch (e) {
      expect((e as OwnershipError).status).toBe(403);
    }
  });
  it("missing interview → 404", () => {
    expect(checkOwnership(null, "u-1")).toMatchObject({ ok: false, status: 404 });
    expect(() => assertOwnership(undefined, "u-1")).toThrow(/not found/);
  });
});
