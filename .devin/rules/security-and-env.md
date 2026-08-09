---
trigger: model_decision
description: Apply when handling environment variables, secrets, authentication/authorization, Server Actions, Route Handlers, security headers/CSP, user input, or any security-sensitive code.
---

# Security & environment

- **Secrets stay server-side.** Only `NEXT_PUBLIC_`-prefixed variables reach the
  client. Keep `.env*` files out of git.
- **Read env through `@/config/env` only** — never `process.env` elsewhere. This
  is lint-enforced across `src/**`: a `no-restricted-syntax` rule errors on any
  `process.env` access outside `src/config/env.ts` (except `NODE_ENV`). Env is
  validated with `@t3-oss/env-nextjs` + Zod. The rule stops at `src/`, so
  `next.config.ts`, `instrumentation*.ts` and `scripts/` read `process.env`
  directly — they run before or outside the validated module, which is the only
  legitimate reason to. Do not treat them as precedent for new code.
- **Every env var is optional and features degrade** rather than crash: no
  `OPENAI_API_KEY` → `/api/chat` returns `503`; no `UPSTASH_*` → in-memory rate
  limiting; no Sentry DSN → Sentry is skipped. Preserve that property when adding
  a variable — never make a missing key break the build or a route.
- **Authorize every mutation.** Verify authentication AND authorization inside
  each Server Action / Route Handler — never rely on `proxy.ts` (the Next.js 16
  successor to `middleware.ts`), layout, or page checks alone. A proxy sits at the
  network boundary and is explicitly not an authorization boundary. Use `import "server-only"` to keep sensitive modules off the client.
- **Server Actions are public HTTP endpoints.** Treat every action like an
  exposed API: authenticate, authorize, and schema-validate its input — even
  if no UI currently calls it.
- **Validate all input** at the boundary (Zod) before use; treat every client
  input as hostile. Rate-limit expensive or unauthenticated endpoints. Validate
  redirect targets against an allowlist (no open redirects) and validate file
  uploads (type, size) before processing.
- Use parameterized queries / an ORM — never string-build SQL. Avoid
  `dangerouslySetInnerHTML`; if unavoidable, sanitize the HTML first.
- **Security headers and CSP already exist** in `next.config.ts` (CSP, HSTS with
  preload, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`)
  applied to `/:path*`. Extend that list — do not add a competing `proxy.ts` or
  `vercel.json` header block. Known gap: `script-src`/`style-src` still use
  `'unsafe-inline'`; moving to a nonce-based CSP is the improvement worth making,
  and any new inline script or third-party origin must be added deliberately.
- Consider React **taint** APIs to prevent accidental exposure of sensitive data
  to the client.
- Never log secrets or PII. Surface user-facing errors without leaking stack
  traces or internal details; report real errors to your observability tool.
- Keep dependencies patched (automated updates + audit in CI); pin the
  lockfile and review new packages for maintenance and supply-chain risk.
