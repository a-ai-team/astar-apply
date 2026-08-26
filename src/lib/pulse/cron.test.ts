import { describe, expect, it } from "vitest";
import { cronAuthorized } from "./cron";

describe("cronAuthorized", () => {
  it("refuses when no secret is configured", () => {
    expect(cronAuthorized("Bearer x", undefined)).toBe(false);
    expect(cronAuthorized("Bearer x", "")).toBe(false);
  });
  it("refuses a missing, malformed or wrong header", () => {
    expect(cronAuthorized(null, "s3cret")).toBe(false);
    expect(cronAuthorized("s3cret", "s3cret")).toBe(false);
    expect(cronAuthorized("Bearer nope", "s3cret")).toBe(false);
    expect(cronAuthorized("Bearer s3cret-longer", "s3cret")).toBe(false);
  });
  it("accepts the right bearer token (case-insensitive scheme)", () => {
    expect(cronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(cronAuthorized("bearer s3cret", "s3cret")).toBe(true);
  });
});
