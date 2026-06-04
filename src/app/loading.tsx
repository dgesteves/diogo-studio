import type { ReactElement } from "react";

export default function Loading(): ReactElement {
  return (
    <main className="flex flex-1 items-center justify-center" aria-label="Loading">
      <div
        role="status"
        aria-live="polite"
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"
      />
    </main>
  );
}
