"use client";

import type { ReactElement } from "react";
import { MotionConfig } from "motion/react";
import { useReducedMotionPreference } from "./reduced-motion-provider";

export function MotionProvider({ children }: { children: React.ReactNode }): ReactElement {
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
