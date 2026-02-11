import { describe, it, expect, vi, beforeAll } from "vitest";

// Set ENCRYPTION_KEY before importing modules that use it
const TEST_ENCRYPTION_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);

import {
  generateTwoFactorSecret,
  verifyTwoFactorCode,
} from "@/lib/two-factor";
import * as OTPAuth from "otpauth";

describe("generateTwoFactorSecret", () => {
  it("should generate an encrypted secret, plain secret, and URI", () => {
    const result = generateTwoFactorSecret("test@example.com");
    expect(result.encryptedSecret).toBeTruthy();
    expect(result.plainSecret).toBeTruthy();
    expect(result.plainSecret.length).toBeGreaterThan(0);
    expect(result.uri).toContain("otpauth://totp/");
    expect(result.uri).toContain("test%40example.com");
  });

  it("should generate unique secrets for different calls", () => {
    const r1 = generateTwoFactorSecret("a@test.com");
    const r2 = generateTwoFactorSecret("b@test.com");
    expect(r1.plainSecret).not.toBe(r2.plainSecret);
  });

  it("should include the app name as issuer in URI", () => {
    const result = generateTwoFactorSecret("test@example.com");
    // Default APP_NAME is "Auth App"
    expect(result.uri).toContain("issuer=Auth");
  });

  it("should return an encrypted secret different from the plain secret", () => {
    const result = generateTwoFactorSecret("test@example.com");
    expect(result.encryptedSecret).not.toBe(result.plainSecret);
    // Encrypted format: hex(iv):hex(authTag):hex(ciphertext)
    expect(result.encryptedSecret.split(":")).toHaveLength(3);
  });
});

describe("verifyTwoFactorCode", () => {
  it("should verify a valid TOTP code against encrypted secret", () => {
    const { encryptedSecret, plainSecret } = generateTwoFactorSecret("test@example.com");

    // Generate a valid code using the plain secret
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(plainSecret),
    });
    const validCode = totp.generate();

    // Verify using the encrypted secret (as stored in DB)
    expect(verifyTwoFactorCode(encryptedSecret, validCode)).toBe(true);
  });

  it("should reject an invalid TOTP code", () => {
    const { encryptedSecret } = generateTwoFactorSecret("test@example.com");
    expect(verifyTwoFactorCode(encryptedSecret, "000000")).toBe(false);
    expect(verifyTwoFactorCode(encryptedSecret, "123456")).toBe(false);
  });

  it("should reject a code with wrong length", () => {
    const { encryptedSecret } = generateTwoFactorSecret("test@example.com");
    expect(verifyTwoFactorCode(encryptedSecret, "12345")).toBe(false);
    expect(verifyTwoFactorCode(encryptedSecret, "1234567")).toBe(false);
  });
});
