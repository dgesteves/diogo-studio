"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = (): (() => void) => () => {};

export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
