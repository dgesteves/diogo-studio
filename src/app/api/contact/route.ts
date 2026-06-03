/**
 * Phase 5 — contact intake endpoint.
 *
 * Node runtime (Resend + react-email render need a Node-ish environment).
 * Validates with the shared `contactSchema`, rate-limits per-IP (Upstash when
 * configured, in-memory token bucket otherwise — same shape as `/api/chat`),
 * and sends a branded react-email via Resend.
 *
 * Graceful degradation is the contract:
 *  - Missing `RESEND_API_KEY` → structured 503 `{ fallback: true }`. The form
 *    catches this and points the visitor at the direct mailto link, so the
 *    page is never broken in an unconfigured environment.
 *  - Honeypot hit → silent 200 (we don't tell bots they failed).
 *  - Send failure → reported to Sentry, 502 to the client.
 */

import { createElement } from "react";
import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";

import { ContactNotification } from "@/components/emails/contact-notification";
import { contactSchema } from "@/lib/contact-schema";
import { siteConfig } from "@/lib/site-config";
import { env } from "@/env";

export const runtime = "nodejs";
export const maxDuration = 15;

/* ---------------------------------------------------------------------------
 * Rate limiting — 5 submissions per hour per IP. Contact abuse is rarer than
 * chat spam but costlier (it lands in a human inbox), so the window is tight.
 * ------------------------------------------------------------------------- */

const upstashLimiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: false,
        prefix: "contact-form",
      })
    : null;

const localBuckets = new Map<string, { tokens: number; updatedAt: number }>();
const LOCAL_CAPACITY = 5;
const LOCAL_REFILL_PER_MS = LOCAL_CAPACITY / 3_600_000; // 5 tokens / hour

function allowLocal(key: string): boolean {
  const now = Date.now();
  const bucket = localBuckets.get(key) ?? { tokens: LOCAL_CAPACITY, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(LOCAL_CAPACITY, bucket.tokens + elapsed * LOCAL_REFILL_PER_MS);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    localBuckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  localBuckets.set(key, bucket);
  return true;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

async function allow(req: Request): Promise<boolean> {
  const ip = clientIp(req);
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(ip);
    return result.success;
  }
  return allowLocal(ip);
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init?.headers },
  });
}

/* ---------------------------------------------------------------------------
 * Route
 * ------------------------------------------------------------------------- */

export async function POST(req: Request): Promise<Response> {
  // 1) Parse + validate against the shared schema.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const { name, email, company, roleAltitude, message, company_url } = parsed.data;

  // 2) Honeypot — a filled hidden field means a bot. 200 so it never retries.
  if (company_url) {
    return json({ ok: true });
  }

  // 3) Rate limit.
  if (!(await allow(req))) {
    return json(
      { error: "Too many submissions. Try again in a bit, or email me directly." },
      { status: 429 },
    );
  }

  // 4) Not configured → graceful 503 so the client shows the mailto fallback.
  if (!env.RESEND_API_KEY) {
    return json(
      {
        error: "Email delivery isn't configured on this deployment.",
        fallback: true,
        email: siteConfig.email,
      },
      { status: 503 },
    );
  }

  // 5) Send.
  const to = env.CONTACT_TO_EMAIL ?? siteConfig.email;
  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      replyTo: email,
      subject: `Inbound · ${name}${company ? ` · ${company}` : ""}`,
      react: createElement(ContactNotification, {
        name,
        email,
        company,
        roleAltitude,
        message,
        receivedAt: new Date().toUTCString(),
      }),
    });

    if (error) {
      Sentry.captureException(new Error(`Resend send failed: ${error.message}`), {
        tags: { route: "api/contact" },
      });
      return json({ error: "Couldn't send right now. Please email me directly." }, { status: 502 });
    }

    return json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/contact" } });
    return json({ error: "Couldn't send right now. Please email me directly." }, { status: 502 });
  }
}
