import * as OTPAuth from "otpauth";

const APP_NAME = process.env.APP_NAME || "Auth App";

/**
 * Generate a new TOTP secret for a user.
 * Returns the secret and a URI for QR code generation.
 */
export function generateTwoFactorSecret(email: string): {
  secret: string;
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
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify a TOTP code against a stored secret.
 * Allows a window of 1 period (30s) before and after for clock drift.
 */
export function verifyTwoFactorCode(
  secret: string,
  code: string
): boolean {
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
