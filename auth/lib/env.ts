/**
 * Environment variable validation.
 *
 * Import this module early (e.g. in layout.tsx or instrumentation.ts)
 * so missing variables surface immediately at startup instead of at
 * runtime when a user hits an endpoint.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env file or deployment configuration.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  GOOGLE_CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requireEnv("GOOGLE_CLIENT_SECRET"),
  RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
  FROM_EMAIL: optionalEnv("FROM_EMAIL", "onboarding@resend.dev"),
  APP_NAME: optionalEnv("APP_NAME", "Auth App"),

  // Encryption key for 2FA secrets (64 hex chars = 32 bytes for AES-256)
  ENCRYPTION_KEY: requireEnv("ENCRYPTION_KEY"),

  // Optional: Redis for rate limiting (Upstash)
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",

  // Optional: Secret for cron job endpoints (token cleanup, etc.)
  CRON_SECRET: process.env.CRON_SECRET || "",
} as const;
