import * as Sentry from "@sentry/nextjs";

import { DEFAULT_TRACES_SAMPLE_RATE } from "@/telemetry/constants";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? DEFAULT_TRACES_SAMPLE_RATE,
    ),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
