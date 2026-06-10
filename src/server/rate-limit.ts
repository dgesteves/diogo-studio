import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

export type RateLimitConfig = {
  prefix: string;
  limit: number;
  windowMs: number;
};

export type RateLimiter = (req: Request) => Promise<boolean>;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export function createRateLimiter({ prefix, limit, windowMs }: RateLimitConfig): RateLimiter {
  const upstashLimiter =
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
          analytics: false,
          prefix,
        })
      : null;

  const buckets = new Map<string, { tokens: number; updatedAt: number }>();
  const refillPerMs = limit / windowMs;

  function allowLocal(key: string): boolean {
    const now = Date.now();
    const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: now };
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillPerMs);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      return false;
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return true;
  }

  return async function allow(req: Request): Promise<boolean> {
    const ip = clientIp(req);
    if (upstashLimiter) {
      const result = await upstashLimiter.limit(ip);
      return result.success;
    }
    return allowLocal(ip);
  };
}
