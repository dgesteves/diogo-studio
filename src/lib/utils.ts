import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose Tailwind class names safely.
 *
 * - `clsx` handles conditional/object/array inputs.
 * - `tailwind-merge` resolves conflicting utilities so the last write wins
 *   (e.g. `px-2 px-4` → `px-4`).
 *
 * This is the canonical class-composition helper for the whole codebase.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
