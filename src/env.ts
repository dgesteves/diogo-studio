import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Type-safe, validated environment variables.
 *
 * - `server` vars are only available on the server.
 * - `client` vars MUST be prefixed with `NEXT_PUBLIC_` and are inlined into the
 *   client bundle by Next.js at build time.
 * - `runtimeEnv` maps the schema to `process.env` so Next.js can statically
 *   analyze which vars are consumed.
 *
 * Add new variables here AND to `.env.example`.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),

    /* --- Phase 4: agentic ⌘K Inspector ---
     * All three blocks are optional. The Edge `/api/chat` route reports a
     * structured 503 if `OPENAI_API_KEY` is missing, the build script
     * degrades the index to keyword-only when it's missing, and the rate
     * limiter falls back to an in-memory token bucket without Upstash. */
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    /* --- Phase 5: contact form (Resend) ---
     * All optional. Without `RESEND_API_KEY` the `/api/contact` route
     * validates + rate-limits as usual but returns a structured 503 instead
     * of sending — the client shows a "email me directly" fallback, so the
     * page is never broken. `CONTACT_TO_EMAIL` defaults to the public address
     * in site-config; `RESEND_FROM_EMAIL` must be on a Resend-verified domain
     * in production (the `onboarding@resend.dev` default only delivers to the
     * account owner). */
    RESEND_API_KEY: z.string().min(1).optional(),
    CONTACT_TO_EMAIL: z.string().email().optional(),
    RESEND_FROM_EMAIL: z.string().default("Diogo Studio <onboarding@resend.dev>"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
    NEXT_PUBLIC_PERF_HUD: z.enum(["0", "1"]).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_PERF_HUD: process.env.NEXT_PUBLIC_PERF_HUD,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
    OPENAI_EMBED_MODEL: process.env.OPENAI_EMBED_MODEL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
