"use client";

import { useEffect, useState } from "react";

type Disposable = { dispose: () => void };

function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}

/**
 * Every disposable the factory handed back, whether alone, in an array or on an object.
 * `Object.values` covers the array case too, so there is no separate branch for it.
 */
function disposablesIn(value: unknown): readonly Disposable[] {
  if (isDisposable(value)) return [value];
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(disposablesIn);
  }
  return [];
}

/**
 * Builds a GPU resource once and releases it when the component unmounts.
 *
 * R3F disposes what it reconciles from JSX, but a texture or geometry built imperatively
 * and passed in as a prop was never reconciled, so nothing else ever frees it. That matters
 * because the canvas really does unmount: `world-stage.tsx` drops the whole scene when a
 * visitor turns motion off mid-session, and without this every such toggle strands another
 * copy of the city, the moon, the mouse and the television on the GPU.
 *
 * The factory replaces the `useMemo` it would otherwise be wrapped in, so a call site
 * cannot memoize the resource and forget the cleanup — or write the cleanup against an
 * array literal rebuilt every render, which disposes the live resource instead.
 *
 * It is held in state rather than a memo deliberately: React is free to discard a `useMemo`
 * and recompute it, which for a resource that has to be disposed by hand is the leak this
 * hook exists to close. A lazy `useState` initializer is the one that runs exactly once.
 */
export function useDisposable<T>(create: () => T): T {
  const [resource] = useState(() => create());

  useEffect(() => {
    const items = disposablesIn(resource);
    return () => {
      for (const item of items) item.dispose();
    };
  }, [resource]);

  return resource;
}
