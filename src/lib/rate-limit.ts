/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, use Redis-based solution like @upstash/ratelimit.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Max requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number;
}

/**
 * Check if a request should be rate limited.
 * @param identifier Unique identifier for the client (IP, email, etc.)
 * @param config Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Clean up old entries periodically (every 100 calls)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    if (!entry || now > entry.resetTime) {
        // Create new entry
        const resetTime = now + config.windowSeconds * 1000;
        rateLimitStore.set(identifier, { count: 1, resetTime });
        return {
            success: true,
            remaining: config.limit - 1,
            reset: resetTime,
        };
    }

    if (entry.count >= config.limit) {
        return {
            success: false,
            remaining: 0,
            reset: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;
    return {
        success: true,
        remaining: config.limit - entry.count,
        reset: entry.resetTime,
    };
}

function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Get client identifier from request headers.
 * Falls back to a generic identifier if no IP found.
 */
export function getClientIdentifier(headers: Headers): string {
    return (
        headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "unknown"
    );
}
