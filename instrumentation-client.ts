import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Session Replay is part of the production observability story this
    // portfolio is meant to demonstrate. We record only on error (zero
    // ongoing-session sampling) and mask text + media so it's privacy-safe.
    // The ~70 KB client cost is the price of being able to debug what a
    // hiring manager actually did when something broke.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
