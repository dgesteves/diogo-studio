"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, type ReactElement } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest ? <p className="text-xs text-zinc-500">Error id: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="bg-foreground text-background mt-2 rounded-full px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
