"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotionPreference } from "./reduced-motion-provider";

/**
 * Lenis-powered inertia scroll, opt-out via reduced-motion.
 *
 * - We _smooth_ the scroll, we never _hijack_ it: the page still scrolls 1:1,
 *   Lenis just damps the curve.
 * - Disabled on touch devices (`smoothTouch: false`) and on reduced-motion.
 * - Cleaned up on unmount so HMR / route changes don't leak rAF loops.
 */
export function LenisProvider(): null {
  const { reducedMotion } = useReducedMotionPreference();

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;

    const lenis = new Lenis({
      duration: 1.1,
      // ease-out-expo, gives a confident, premium feel without scroll-jacking
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
