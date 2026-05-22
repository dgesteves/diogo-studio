"use client";

/* eslint-disable react-hooks/immutability --
 * R3F per-frame mutation of `camera.position` is the documented pattern.
 * `useFrame` runs inside the rAF loop, outside React reconciliation; the
 * react-hooks/immutability rule treats it as a render-time side effect.
 * Disabling locally is the canonical escape hatch (see drei docs).
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Scroll-driven camera dolly + subtle parallax orbit.
 *
 * - Reads `window.scrollY` against the hero's bounding rect on every frame.
 *   Lenis already smooths the underlying scroll, so we don't need our own
 *   easing on the read.
 * - Eases the camera position toward a target each frame so the dolly feels
 *   like inertia rather than a stiff binding to scroll.
 * - A slow, idle orbit gives the scene life even when the page is static —
 *   tuned low enough that it doesn't trigger motion-sickness or compete with
 *   the user's scroll.
 *
 * Reduced-motion never mounts this component (the canvas itself is gated),
 * so we don't need an additional check here.
 */
export function CameraDolly({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const { camera } = useThree();

  // Cached state read in useFrame — refs to avoid React re-renders.
  const scrollProgress = useRef(0);
  const targetProgress = useRef(0);

  useEffect(() => {
    function read() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Progress 0 when the hero top is at viewport top, 1 when it has fully
      // scrolled out. Clamped.
      const viewportH = window.innerHeight;
      const traveled = Math.max(0, -rect.top);
      const distance = Math.max(1, rect.height - viewportH * 0.4);
      targetProgress.current = Math.min(1, traveled / distance);
    }
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [containerRef]);

  useFrame((state, delta) => {
    // Critically-damped lerp toward the target progress so input feels alive
    // without overshooting.
    const lerpRate = 1 - Math.exp(-delta * 4);
    scrollProgress.current += (targetProgress.current - scrollProgress.current) * lerpRate;
    const p = scrollProgress.current;

    // Idle orbit — a *very* slow figure-eight around the origin. Tuned by
    // taste, not physics.
    const t = state.clock.elapsedTime;
    const orbitX = Math.sin(t * 0.08) * 0.18;
    const orbitY = Math.sin(t * 0.05) * 0.1;

    // Dolly: zoom in slightly on scroll while drifting left to suggest depth.
    const targetX = orbitX - p * 0.25;
    const targetY = orbitY + p * 0.08;
    const targetZ = 4.4 - p * 0.7;

    camera.position.x += (targetX - camera.position.x) * lerpRate;
    camera.position.y += (targetY - camera.position.y) * lerpRate;
    camera.position.z += (targetZ - camera.position.z) * lerpRate;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
