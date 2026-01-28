import { describe, it, expect } from "vitest";
import {
  BCRYPT_SALT_ROUNDS,
  EMAIL_VERIFICATION_TOKEN_EXPIRY_MS,
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
  TOKEN_BYTE_LENGTH,
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCKOUT_DURATION_MS,
} from "@/lib/constants";

describe("security constants", () => {
  it("should have bcrypt salt rounds >= 12 (NIST recommendation)", () => {
    expect(BCRYPT_SALT_ROUNDS).toBeGreaterThanOrEqual(12);
  });

  it("should have email verification token expiry of 24 hours", () => {
    expect(EMAIL_VERIFICATION_TOKEN_EXPIRY_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("should have password reset token expiry of 1 hour", () => {
    expect(PASSWORD_RESET_TOKEN_EXPIRY_MS).toBe(60 * 60 * 1000);
  });

  it("should have token byte length >= 32 for security", () => {
    expect(TOKEN_BYTE_LENGTH).toBeGreaterThanOrEqual(32);
  });

  it("should have account lockout after 5 failed attempts", () => {
    expect(MAX_FAILED_LOGIN_ATTEMPTS).toBe(5);
  });

  it("should have lockout duration of 15 minutes", () => {
    expect(ACCOUNT_LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000);
  });
});
