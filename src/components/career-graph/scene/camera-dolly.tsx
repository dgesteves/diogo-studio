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
 * Scroll- and mouse-driven camera dolly + subtle idle orbit.
 *
 * Three signals feed the camera target each frame:
 *   1. **Scroll progress** — zooms the camera in slightly and drifts it
 *      laterally as the hero scrolls out of view, giving the scene a sense
 *      of "the user is moving through space."
 *   2. **Mouse parallax** — the cursor position inside the hero biases the
 *      camera by ±0.15 units on x/y. This is what makes the scene feel
 *      "reactive" without any explicit interaction.
 *   3. **Idle orbit** — a very slow figure-eight so the scene breathes
 *      even when the user is perfectly still.
 *
 * All three sources are smoothed via a critically-damped lerp so input
 * feels inertial, never twitchy. Reduced-motion never mounts the canvas,
 * so this component is always allowed to animate when present.
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
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // PERF: both `scroll` and `pointermove` can fire 1000+ times per second
    // on high-refresh displays, and both handlers below call
    // `getBoundingClientRect()` which forces a layout flush. Coalesce all
    // updates through a single requestAnimationFrame tick so we do at most
    // one layout read per frame regardless of input rate.
    let rafId = 0;
    let pendingScroll = false;
    let pendingMouse = false;
    let mouseX = 0;
    let mouseY = 0;

    const flush = () => {
      rafId = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect(); // a single layout flush

      if (pendingScroll) {
        pendingScroll = false;
        const viewportH = window.innerHeight;
        const traveled = Math.max(0, -rect.top);
        const distance = Math.max(1, rect.height - viewportH * 0.4);
        targetProgress.current = Math.min(1, traveled / distance);
      }
      if (pendingMouse) {
        pendingMouse = false;
        const x = ((mouseX - rect.left) / rect.width) * 2 - 1;
        const y = -(((mouseY - rect.top) / rect.height) * 2 - 1);
        mouseTarget.current = { x, y };
      }
    };
    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(flush);
    };
    const onScroll = () => {
      pendingScroll = true;
      schedule();
    };
    const onMouse = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      pendingMouse = true;
      schedule();
    };
    const onBlur = () => {
      mouseTarget.current = { x: 0, y: 0 };
    };

    // Initial read so the first frame doesn't have to wait for an event.
    pendingScroll = true;
    schedule();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onMouse, { passive: true });
    window.addEventListener("blur", onBlur);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("blur", onBlur);
    };
  }, [containerRef]);

  useFrame((state, delta) => {
    const lerpRate = 1 - Math.exp(-delta * 4);
    scrollProgress.current += (targetProgress.current - scrollProgress.current) * lerpRate;
    mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * lerpRate;
    mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * lerpRate;

    const p = scrollProgress.current;
    const t = state.clock.elapsedTime;
    const orbitX = Math.sin(t * 0.08) * 0.18;
    const orbitY = Math.sin(t * 0.05) * 0.1;

    const targetX = orbitX - p * 0.25 + mouseCurrent.current.x * 0.18;
    const targetY = orbitY + p * 0.08 + mouseCurrent.current.y * 0.12;
    const targetZ = 4.4 - p * 0.7;

    camera.position.x += (targetX - camera.position.x) * lerpRate;
    camera.position.y += (targetY - camera.position.y) * lerpRate;
    camera.position.z += (targetZ - camera.position.z) * lerpRate;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
