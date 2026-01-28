import { describe, it, expect, beforeEach } from "vitest";
import { getClientIp } from "@/lib/rate-limit";

// We test the in-memory fallback directly since Redis won't be available in tests
describe("rate limiting (in-memory fallback)", () => {
  // Import dynamically to reset module state
  let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

  beforeEach(async () => {
    // Reset module state between tests
    const mod = await import("@/lib/rate-limit");
    rateLimit = mod.rateLimit;
  });

  it("should allow requests within the limit", async () => {
    const result = await rateLimit("test-allow:1", { maxRequests: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests exceeding the limit", async () => {
    const identifier = "test-block:" + Date.now();
    for (let i = 0; i < 3; i++) {
      await rateLimit(identifier, { maxRequests: 3, windowSeconds: 60 });
    }
    const result = await rateLimit(identifier, { maxRequests: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track remaining requests correctly", async () => {
    const identifier = "test-remaining:" + Date.now();
    const r1 = await rateLimit(identifier, { maxRequests: 5, windowSeconds: 60 });
    expect(r1.remaining).toBe(4);

    const r2 = await rateLimit(identifier, { maxRequests: 5, windowSeconds: 60 });
    expect(r2.remaining).toBe(3);

    const r3 = await rateLimit(identifier, { maxRequests: 5, windowSeconds: 60 });
    expect(r3.remaining).toBe(2);
  });

  it("should return resetInSeconds > 0", async () => {
    const result = await rateLimit("test-reset:" + Date.now(), {
      maxRequests: 5,
      windowSeconds: 120,
    });
    expect(result.resetInSeconds).toBeGreaterThan(0);
    expect(result.resetInSeconds).toBeLessThanOrEqual(120);
  });
});

describe("getClientIp", () => {
  it("should extract IP from X-Forwarded-For header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("should return 'unknown' when no forwarding header", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });

  it("should trim whitespace from IP", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  1.2.3.4  " },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });
});
