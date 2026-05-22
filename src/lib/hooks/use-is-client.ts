"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns `true` only after the component has hydrated on the client.
 * Equivalent to the common `mounted` boolean pattern, but built on
 * `useSyncExternalStore` so it doesn't trip React 19's
 * "setState in useEffect" lint rule.
 *
 * Use this when an interactive client component renders different markup
 * before vs. after hydration (e.g. theme-aware icons) and you need to
 * defer the client-only branch to the second render to avoid a
 * hydration mismatch.
 */
const noopSubscribe = (): (() => void) => () => {};

export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
