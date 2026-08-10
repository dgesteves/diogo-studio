---
trigger: model_decision
description: Apply when handling environment variables, secrets, authorization, route handlers, the /api/chat AI endpoint, security headers or CSP, or any untrusted input.
---

# Security & environment

The AI-endpoint invariants and the CSP position are in `AGENTS.md`; they are not repeated here.

## Env and secrets

- Only `NEXT_PUBLIC_`-prefixed variables reach the client, and `.env*` stays out of git.
- **Read env through `@/config/env` only.** Lint errors on any `process.env` access in `src/**`
  outside `src/config/env.ts` (except `NODE_ENV`). `next.config.ts`, `instrumentation*.ts` and
  `scripts/` read it directly because they run before or outside the validated module — that is
  not a precedent for new code.
- `createEnv` validates and freezes at import, which is why a test cannot stub it; see
  `testing.md`.

## Untrusted input and output

- **Validate at the boundary with Zod** and treat every client input as hostile — including its
  size. Rate-limit expensive or unauthenticated endpoints with `src/rate-limit.ts`.
- Authenticate **and** authorize inside each Route Handler or Server Action. A proxy sits at the
  network boundary and is explicitly not an authorization boundary.
- Validate redirect and navigation targets against the typed route SSOT (`asInternalHref()`),
  never by string-building a URL from input.
- Avoid `dangerouslySetInnerHTML`. The two existing uses — a JSON-LD block and a boot-state
  inline script — must stay non-user-derived and `JSON.stringify`-escaped; that property is what
  makes the current CSP acceptable.
- Never log secrets or PII. Show a friendly error and report the real one to Sentry.

## Headers

Security headers live in `next.config.ts` and apply to `/:path*`. `frame-ancestors 'none'` and
`X-Frame-Options: DENY` must stay in agreement — the CSP directive is the one browsers honor,
and a contradicting pair is a review finding. `X-XSS-Protection` is deliberately absent: OWASP
says not to set it and MDN documents it as deprecated and capable of introducing XSS, so don't
add it back. Any new inline script or third-party origin is a deliberate CSP change and a
deliberate Core Web Vitals cost.

## Dependencies

Keep the lockfile pinned and let releases age. Review new packages for maintenance and
supply-chain risk. For an advisory from the daily audit, prefer an aged patch or a
`pnpm-workspace.yaml` override.
