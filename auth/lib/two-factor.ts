import * as OTPAuth from "otpauth";
import { encrypt, decrypt } from "./encryption";

const APP_NAME = process.env.APP_NAME || "Auth App";

/**
 * Generate a new TOTP secret for a user.
 * Returns the encrypted secret (for DB storage), the plain secret
 * (to show the user once during setup), and a URI for QR code generation.
 */
export function generateTwoFactorSecret(email: string): {
  encryptedSecret: string;
  plainSecret: string;
  uri: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    encryptedSecret: encrypt(totp.secret.base32),
    plainSecret: totp.secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Check whether a stored secret is in the encrypted format (hex:hex:hex)
 * or a legacy plain base32 string.
 */
function isEncryptedFormat(secret: string): boolean {
  const parts = secret.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}

/**
 * Verify a TOTP code against a stored secret.
 * Supports both encrypted (new) and plain base32 (legacy) secrets.
 * Allows a window of 1 period (30s) before and after for clock drift.
 */
export function verifyTwoFactorCode(
  storedSecret: string,
  code: string
): boolean {
  const secret = isEncryptedFormat(storedSecret)
    ? decrypt(storedSecret)
    : storedSecret;
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // delta returns null if invalid, or a number indicating time step difference
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
