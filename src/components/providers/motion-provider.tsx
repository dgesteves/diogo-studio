"use client";

import { MotionConfig } from "motion/react";
import { useReducedMotionPreference } from "./reduced-motion-provider";

/**
 * Project-wide MotionConfig.
 *
 * - Forwards the app's reduced-motion decision to every `motion` component,
 *   so individual components don't have to plumb it through.
 * - Sets sensible default transitions for the console aesthetic: short,
 *   slightly-overshoot springs for interactive elements; ease-out curves for
 *   layout changes.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { reducedMotion } = useReducedMotionPreference();

  return (
    <MotionConfig
      reducedMotion={reducedMotion ? "always" : "never"}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
    >
      {children}
    </MotionConfig>
  );
}
