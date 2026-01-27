/**
 * Simple in-memory rate limiter for API routes.
 *
 * For production at scale, replace with a Redis-backed implementation
 * (e.g. @upstash/ratelimit) to work across multiple instances.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired — start a new window
    store.set(identifier, {
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
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
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
  // Fallback — in production behind a proxy this header should always exist
  return "unknown";
}
