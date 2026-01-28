import { describe, it, expect } from "vitest";
import {
  generateTwoFactorSecret,
  verifyTwoFactorCode,
} from "@/lib/two-factor";
import * as OTPAuth from "otpauth";

describe("generateTwoFactorSecret", () => {
  it("should generate a secret and URI", () => {
    const result = generateTwoFactorSecret("test@example.com");
    expect(result.secret).toBeTruthy();
    expect(result.secret.length).toBeGreaterThan(0);
    expect(result.uri).toContain("otpauth://totp/");
    expect(result.uri).toContain("test%40example.com");
  });

  it("should generate unique secrets for different calls", () => {
    const r1 = generateTwoFactorSecret("a@test.com");
    const r2 = generateTwoFactorSecret("b@test.com");
    expect(r1.secret).not.toBe(r2.secret);
  });

  it("should include the app name as issuer in URI", () => {
    const result = generateTwoFactorSecret("test@example.com");
    // Default APP_NAME is "Auth App"
    expect(result.uri).toContain("issuer=Auth");
  });
});

describe("verifyTwoFactorCode", () => {
  it("should verify a valid TOTP code", () => {
    const { secret } = generateTwoFactorSecret("test@example.com");

    // Generate a valid code using the same secret
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const validCode = totp.generate();

    expect(verifyTwoFactorCode(secret, validCode)).toBe(true);
  });

  it("should reject an invalid TOTP code", () => {
    const { secret } = generateTwoFactorSecret("test@example.com");
    expect(verifyTwoFactorCode(secret, "000000")).toBe(false);
    expect(verifyTwoFactorCode(secret, "123456")).toBe(false);
  });

  it("should reject a code with wrong length", () => {
    const { secret } = generateTwoFactorSecret("test@example.com");
    expect(verifyTwoFactorCode(secret, "12345")).toBe(false);
    expect(verifyTwoFactorCode(secret, "1234567")).toBe(false);
  });
});
