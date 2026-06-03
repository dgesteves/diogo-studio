---
trigger: model_decision
description: Apply when handling errors/exceptions, logging, monitoring/observability, error boundaries, loading/empty/error states, retries/timeouts, or graceful-degradation and resilience concerns.
---

# Error handling, resilience & observability

- **Fail loudly in dev, gracefully in prod.** Never silently swallow errors
  (no empty `catch {}`). Catch at meaningful boundaries, add context, then handle
  or rethrow — don't log-and-continue on unrecoverable state.
- Use **error boundaries**: route-level `error.tsx` (with `reset()`) and a
  top-level `global-error.tsx`. Provide accessible, recoverable fallback UI — not
  a blank screen or a raw stack trace.
- Model the **full async state matrix** for every data-driven UI: loading, empty,
  error, and success. Don't ship the happy path alone.
- Prefer **typed result/error objects** over throwing across the server/client
  boundary. Show users a friendly message while reporting the real error.
- **Observability**: report errors + performance to a monitoring tool (e.g.
  Sentry) with environment and release tagging. Track Core Web Vitals
  (LCP, CLS, INP) in production.
- **Logging**: structured, leveled logs on the server; never log secrets or PII.
  No stray `console.log` in committed code.
- **Resilience**: set timeouts on outbound calls, handle network failure and
  sensible retries, and degrade features gracefully when an optional
  dependency/env var is missing instead of crashing the route.
- **Wire-up**: register monitoring (errors + OpenTelemetry traces) in
  `instrumentation.ts`, and capture client errors / Web Vitals in
  `instrumentation-client.ts`. Defer non-blocking telemetry with `after()`.
