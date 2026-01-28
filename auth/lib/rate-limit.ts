/**
 * Hybrid rate limiter: uses Redis (via @upstash/ratelimit) when UPSTASH_REDIS_REST_URL
 * is configured, otherwise falls back to an in-memory store.
 *
 * For production at scale, configure Upstash Redis environment variables
 * so rate limits persist across restarts and work across multiple instances.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ─── In-memory fallback ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// ─── Redis client (lazy-initialized) ────────────────────────────────

let redisClient: Redis | null = null;
let redisAvailable: boolean | null = null;

function getRedisClient(): Redis | null {
  if (redisAvailable === false) return null;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisAvailable = false;
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      redisAvailable = true;
    } catch {
      redisAvailable = false;
      return null;
    }
  }
  return redisClient;
}

// Cache of Ratelimit instances per (maxRequests, windowSeconds) combination
const ratelimitInstances = new Map<string, Ratelimit>();

function getRedisRateLimiter(maxRequests: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const key = `${maxRequests}:${windowSeconds}`;
  let limiter = ratelimitInstances.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: false,
      prefix: "rl",
    });
    ratelimitInstances.set(key, limiter);
  }
  return limiter;
}

// ─── Public interface ───────────────────────────────────────────────

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Rate-limit an action by identifier.
 * Uses Redis when available, otherwise falls back to in-memory.
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  // Try Redis first
  const redisLimiter = getRedisRateLimiter(options.maxRequests, options.windowSeconds);
  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch {
      // Redis failed — fall through to memory
      console.warn("Redis rate limit failed, falling back to in-memory");
    }
  }

  // In-memory fallback
  return rateLimitMemory(identifier, options);
}

function rateLimitMemory(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetInSeconds: options.windowSeconds,
    };
  }

  entry.count++;
  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetInSeconds,
  };
}

/**
 * Extract a stable identifier from the request for rate limiting.
 * Uses X-Forwarded-For (set by reverse proxies) or falls back to a generic key.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
