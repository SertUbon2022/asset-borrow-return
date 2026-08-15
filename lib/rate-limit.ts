import { headers } from 'next/headers';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now && (!record.blockedUntil || record.blockedUntil <= now)) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Extracts client IP address from incoming Next.js request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
    const cfConnectingIp = headerList.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  } catch {
    // Fallback if headers() cannot be called
  }
  return '127.0.0.1';
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remainingAttempts: number;
  resetInSeconds: number;
  retryAfterSeconds: number;
}

/**
 * Checks if the action is currently blocked by rate limit
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 5 * 60 * 1000
): RateLimitStatus {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return {
      isAllowed: true,
      remainingAttempts: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
      retryAfterSeconds: 0,
    };
  }

  // If currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: retryAfterSeconds,
      retryAfterSeconds,
    };
  }

  // If the window expired, clean it up
  if (record.resetAt <= now) {
    rateLimitStore.delete(key);
    return {
      isAllowed: true,
      remainingAttempts: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
      retryAfterSeconds: 0,
    };
  }

  // If within window and reached max attempts
  if (record.count >= maxAttempts) {
    const blockUntil = now + blockDurationMs;
    record.blockedUntil = blockUntil;
    const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
    return {
      isAllowed: false,
      remainingAttempts: 0,
      resetInSeconds: retryAfterSeconds,
      retryAfterSeconds,
    };
  }

  const remaining = Math.max(0, maxAttempts - record.count);
  const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);

  return {
    isAllowed: true,
    remainingAttempts: remaining,
    resetInSeconds,
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt for a given key and returns the updated rate limit status
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 5 * 60 * 1000
): RateLimitStatus {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
  } else {
    record.count += 1;
  }

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
  }

  rateLimitStore.set(key, record);

  const isAllowed = record.count < maxAttempts && (!record.blockedUntil || record.blockedUntil <= now);
  const retryAfterSeconds = record.blockedUntil && record.blockedUntil > now
    ? Math.ceil((record.blockedUntil - now) / 1000)
    : 0;

  return {
    isAllowed,
    remainingAttempts: Math.max(0, maxAttempts - record.count),
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    retryAfterSeconds,
  };
}

/**
 * Resets the rate limit for a given key on successful completion
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
