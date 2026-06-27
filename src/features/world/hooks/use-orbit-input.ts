"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ORBIT } from "../constants/orbit";
import { clampAzimuth, clampPolar, clampZoom } from "../utils/orbit";
import { isWorldSurface, neutralOrbitState, type OrbitInputState } from "./orbit-input-state";

export type { OrbitInputState };

export function useOrbitInput(orbitEnabled: boolean): RefObject<OrbitInputState> {
  const state = useRef<OrbitInputState>(neutralOrbitState());

  useEffect(() => {
    const input = state.current;
    if (!orbitEnabled) {
      input.azimuth = 0;
      input.polar = 0;
      input.zoom = 1;
      input.dragging = false;
    }

    let down = false;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      down = isWorldSurface(event.target);
      dragging = false;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onPointerMove(event: PointerEvent): void {
      input.clientX = event.clientX;
      input.clientY = event.clientY;
      input.overWorld = isWorldSurface(event.target);
      if (!down) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (!dragging && Math.hypot(dx, dy) < ORBIT.dragThresholdPx) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      if (!orbitEnabled) return;
      input.dragging = true;
      input.azimuth = clampAzimuth(input.azimuth - dx * ORBIT.azimuthRadPerPx);
      input.polar = clampPolar(input.polar - dy * ORBIT.polarRadPerPx);
      input.lastInput = performance.now();
    }

    function onPointerUp(event: PointerEvent): void {
      input.clientX = event.clientX;
      input.clientY = event.clientY;
      input.overWorld = isWorldSurface(event.target);
      if (event.type === "pointerup" && down && !dragging && input.overWorld) {
        input.clickX = event.clientX;
        input.clickY = event.clientY;
        input.clickSeq += 1;
      }
      down = false;
      dragging = false;
      input.dragging = false;
      if (orbitEnabled) input.lastInput = performance.now();
    }

    function onWheel(event: WheelEvent): void {
      if (!isWorldSurface(event.target)) return;
      event.preventDefault();
      input.zoom = clampZoom(input.zoom + event.deltaY * ORBIT.zoomFactorPerWheelUnit);
      input.lastInput = performance.now();
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    if (orbitEnabled) window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, [orbitEnabled]);

  return state;
}
