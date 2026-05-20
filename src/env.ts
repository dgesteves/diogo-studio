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
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
