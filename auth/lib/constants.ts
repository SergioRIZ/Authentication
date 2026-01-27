// Centralized security constants
// Change these values in one place instead of hunting through multiple files

/** bcrypt salt rounds — NIST recommends >= 12 for production */
export const BCRYPT_SALT_ROUNDS = 12;

/** Email verification token lifetime in milliseconds (24 hours) */
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Password reset token lifetime in milliseconds (1 hour) */
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** Token byte length for crypto.randomBytes */
export const TOKEN_BYTE_LENGTH = 32;
