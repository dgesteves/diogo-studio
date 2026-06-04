"use client";

/* eslint-disable react-hooks/immutability --
 * R3F per-frame mutation of `camera.position` is the documented pattern.
 * `useFrame` runs inside the rAF loop, outside React reconciliation; the
 * react-hooks/immutability rule treats it as a render-time side effect.
 * Disabling locally is the canonical escape hatch (see drei docs).
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export function CameraDolly({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): null {
  const { camera } = useThree();

  const scrollProgress = useRef(0);
  const targetProgress = useRef(0);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let rafId = 0;
    let pendingScroll = false;
    let pendingMouse = false;
    let mouseX = 0;
    let mouseY = 0;

    const flush = () => {
      rafId = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

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
