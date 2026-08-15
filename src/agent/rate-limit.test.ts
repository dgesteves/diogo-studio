import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetTestEnv, setTestEnv } from "@tests/env";
import { createRateLimiter } from "./rate-limit";

const { upstashLimit, slidingWindow, RatelimitCtor, RedisCtor } = vi.hoisted(() => ({
  upstashLimit: vi.fn<(key: string) => Promise<{ success: boolean }>>(),
  slidingWindow: vi.fn<(limit: number, window: string) => string>(),
  RatelimitCtor: vi.fn(),
  RedisCtor: vi.fn(),
}));

vi.mock("@/env", async () => ({ env: (await import("@tests/env")).testEnv }));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    limit = upstashLimit;
    static slidingWindow = slidingWindow;
    constructor(config: unknown) {
      RatelimitCtor(config);
    }
  }
  return { Ratelimit };
});

vi.mock("@upstash/redis", () => {
  class Redis {
    constructor(config: unknown) {
      RedisCtor(config);
    }
  }
  return { Redis };
});

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://diogo.studio/api/chat", { method: "POST", headers });
}

const UPSTASH = {
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

afterEach(() => {
  resetTestEnv();
  vi.clearAllMocks();
});

describe("client identity", () => {
  beforeEach(() => {
    setTestEnv(UPSTASH);
    upstashLimit.mockResolvedValue({ success: true });
  });

  function identify(headers: Record<string, string>): Promise<boolean> {
    return createRateLimiter({ prefix: "p", limit: 5, windowMs: 1000 })(request(headers));
  }

  it("identifies the caller by the first x-forwarded-for entry", async () => {
    await identify({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" });
    expect(upstashLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("trims whitespace around the forwarded address", async () => {
    await identify({ "x-forwarded-for": "  203.0.113.7  , 70.41.3.18" });
    expect(upstashLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    await identify({ "x-real-ip": "198.51.100.4" });
    expect(upstashLimit).toHaveBeenCalledWith("198.51.100.4");
  });

  it("prefers x-forwarded-for over x-real-ip", async () => {
    await identify({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.4" });
    expect(upstashLimit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", async () => {
    await identify({ "x-forwarded-for": "", "x-real-ip": "198.51.100.4" });
    expect(upstashLimit).toHaveBeenCalledWith("198.51.100.4");
  });

  it("buckets every unidentifiable caller together as anonymous", async () => {
    await identify({});
    expect(upstashLimit).toHaveBeenCalledWith("anonymous");
  });
});

describe("in-memory limiting (no Upstash configured)", () => {
  const caller = request({ "x-real-ip": "198.51.100.4" });

  beforeEach(() => {
    setTestEnv();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not construct an Upstash client", () => {
    createRateLimiter({ prefix: "p", limit: 3, windowMs: 1000 });
    expect(RatelimitCtor).not.toHaveBeenCalled();
    expect(RedisCtor).not.toHaveBeenCalled();
  });

  it("allows exactly `limit` requests, then refuses", async () => {
    const allow = createRateLimiter({ prefix: "p", limit: 3, windowMs: 1000 });

    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(false);
  });

  it("refills one request per window/limit of elapsed time", async () => {
    const allow = createRateLimiter({ prefix: "p", limit: 3, windowMs: 900 });
    for (let i = 0; i < 3; i += 1) await allow(caller);
    await expect(allow(caller)).resolves.toBe(false);

    vi.advanceTimersByTime(299);
    await expect(allow(caller)).resolves.toBe(false);

    vi.advanceTimersByTime(2);
    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(false);
  });

  it("never refills past `limit`, however long the caller idles", async () => {
    const allow = createRateLimiter({ prefix: "p", limit: 3, windowMs: 1000 });
    await allow(caller);
    vi.advanceTimersByTime(60_000);

    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(true);
    await expect(allow(caller)).resolves.toBe(false);
  });

  it("keeps one caller's exhausted budget from affecting another", async () => {
    const allow = createRateLimiter({ prefix: "p", limit: 2, windowMs: 1000 });
    await allow(caller);
    await allow(caller);
    await expect(allow(caller)).resolves.toBe(false);

    await expect(allow(request({ "x-real-ip": "203.0.113.7" }))).resolves.toBe(true);
  });

  it("gives each limiter its own budget", async () => {
    const chat = createRateLimiter({ prefix: "chat", limit: 1, windowMs: 1000 });
    const other = createRateLimiter({ prefix: "other", limit: 1, windowMs: 1000 });

    await expect(chat(caller)).resolves.toBe(true);
    await expect(chat(caller)).resolves.toBe(false);
    await expect(other(caller)).resolves.toBe(true);
  });
});

describe("Upstash limiting", () => {
  const caller = request({ "x-real-ip": "198.51.100.4" });

  it("defers the decision to Upstash when both credentials are present", async () => {
    setTestEnv(UPSTASH);
    upstashLimit.mockResolvedValue({ success: false });
    const allow = createRateLimiter({ prefix: "agent-chat", limit: 10, windowMs: 60_000 });

    await expect(allow(caller)).resolves.toBe(false);
    expect(RedisCtor).toHaveBeenCalledWith({
      url: UPSTASH.UPSTASH_REDIS_REST_URL,
      token: UPSTASH.UPSTASH_REDIS_REST_TOKEN,
    });
  });

  it("translates windowMs into an Upstash duration string", () => {
    setTestEnv(UPSTASH);
    createRateLimiter({ prefix: "agent-chat", limit: 10, windowMs: 60_000 });
    expect(slidingWindow).toHaveBeenCalledWith(10, "60000 ms");
  });

  it("ignores Upstash when only the URL is configured", async () => {
    setTestEnv({ UPSTASH_REDIS_REST_URL: UPSTASH.UPSTASH_REDIS_REST_URL });
    const allow = createRateLimiter({ prefix: "p", limit: 1, windowMs: 1000 });

    await expect(allow(caller)).resolves.toBe(true);
    expect(upstashLimit).not.toHaveBeenCalled();
  });

  it("ignores Upstash when only the token is configured", async () => {
    setTestEnv({ UPSTASH_REDIS_REST_TOKEN: UPSTASH.UPSTASH_REDIS_REST_TOKEN });
    const allow = createRateLimiter({ prefix: "p", limit: 1, windowMs: 1000 });

    await expect(allow(caller)).resolves.toBe(true);
    expect(upstashLimit).not.toHaveBeenCalled();
  });
});
