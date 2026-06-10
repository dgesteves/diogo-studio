---
trigger: model_decision
description: Apply when handling environment variables, secrets, authentication/authorization, Server Actions, Route Handlers, security headers/CSP, user input, or any security-sensitive code.
---

# Security & environment

- **Secrets stay server-side.** Only `NEXT_PUBLIC_`-prefixed variables reach the
  client. Keep `.env*` files out of git. Read env through a single validated
  module (e.g. Zod-checked) instead of scattered `process.env` access.
- **Authorize every mutation.** Verify authentication AND authorization inside
  each Server Action / Route Handler — never rely on middleware, layout, or page
  checks alone. Use `import "server-only"` to keep sensitive modules off the client.
- **Server Actions are public HTTP endpoints.** Treat every action like an
  exposed API: authenticate, authorize, and schema-validate its input — even
  if no UI currently calls it.
- **Validate all input** at the boundary (Zod) before use; treat every client
  input as hostile. Rate-limit expensive or unauthenticated endpoints. Validate
  redirect targets against an allowlist (no open redirects) and validate file
  uploads (type, size) before processing.
- Use parameterized queries / an ORM — never string-build SQL. Avoid
  `dangerouslySetInnerHTML`; if unavoidable, sanitize the HTML first.
- Add baseline **security headers** and a **Content-Security-Policy** (nonce-based
  where possible). Consider React **taint** APIs to prevent accidental exposure
  of sensitive data to the client.
- Never log secrets or PII. Surface user-facing errors without leaking stack
  traces or internal details; report real errors to your observability tool.
- Keep dependencies patched (automated updates + audit in CI); pin the
  lockfile and review new packages for maintenance and supply-chain risk.
