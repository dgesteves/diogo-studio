"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotionPreference } from "./reduced-motion-provider";

export function LenisProvider(): null {
  const { reducedMotion } = useReducedMotionPreference();

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(2, -10 * t),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
