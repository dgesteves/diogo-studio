"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ORBIT, clampAzimuth, clampPolar, clampZoom } from "./camera";
import { setExplore } from "./store";
import { EXPLORE, clampPitch } from "./explore";

/**
 * Pointer, wheel and key input for the two camera modes, kept out of the components that
 * consume it. Both modes accumulate into a mutable state object read once per frame rather
 * than into React state — an orbit that re-renders on every pointer move is an orbit that
 * drops frames.
 */

function isWorldSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.tagName === "MAIN" || target.closest("[data-world-root]") !== null;
}

export type OrbitInputState = {
  azimuth: number;
  polar: number;
  zoom: number;
  dragging: boolean;
  lastInput: number;
  clientX: number;
  clientY: number;
  overWorld: boolean;
  clickSeq: number;
  clickX: number;
  clickY: number;
};

export function neutralOrbitState(): OrbitInputState {
  return {
    azimuth: 0,
    polar: 0,
    zoom: 1,
    dragging: false,
    lastInput: 0,
    clientX: -1,
    clientY: -1,
    overWorld: false,
    clickSeq: 0,
    clickX: 0,
    clickY: 0,
  };
}

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

type ExploreAxis = "forward" | "back" | "left" | "right";
type ExploreKeyAction = ExploreAxis | "exit";

const KEY_ACTIONS: Record<string, ExploreKeyAction> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Escape: "exit",
};

function keyToAction(code: string): ExploreKeyAction | null {
  return KEY_ACTIONS[code] ?? null;
}

export type ExploreInputState = {
  forward: number;
  strafe: number;
  yaw: number;
  pitch: number;
  dragging: boolean;
};

export function neutralExploreState(): ExploreInputState {
  return { forward: 0, strafe: 0, yaw: 0, pitch: 0, dragging: false };
}

function axesFromKeys(held: ReadonlySet<ExploreAxis>): {
  forward: number;
  strafe: number;
} {
  const forward = (held.has("forward") ? 1 : 0) - (held.has("back") ? 1 : 0);
  const strafe = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
  return { forward, strafe };
}

export function useExploreInput(enabled: boolean): RefObject<ExploreInputState> {
  const state = useRef<ExploreInputState>(neutralExploreState());

  useEffect(() => {
    if (!enabled) return;
    const input = state.current;
    input.forward = 0;
    input.strafe = 0;
    input.yaw = 0;
    input.pitch = 0;
    input.dragging = false;

    const held = new Set<ExploreAxis>();
    let down = false;
    let lastX = 0;
    let lastY = 0;

    function syncAxes(): void {
      const { forward, strafe } = axesFromKeys(held);
      input.forward = forward;
      input.strafe = strafe;
    }

    function onKeyDown(event: KeyboardEvent): void {
      const action = keyToAction(event.code);
      if (!action) return;
      event.preventDefault();
      if (action === "exit") {
        setExplore(false);
        return;
      }
      held.add(action);
      syncAxes();
    }

    function onKeyUp(event: KeyboardEvent): void {
      const action = keyToAction(event.code);
      if (!action || action === "exit") return;
      held.delete(action);
      syncAxes();
    }

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      down = isWorldSurface(event.target);
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onPointerMove(event: PointerEvent): void {
      if (!down) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      input.dragging = true;
      input.yaw -= dx * EXPLORE.lookSensitivity;
      input.pitch = clampPitch(input.pitch - dy * EXPLORE.lookSensitivity);
    }

    function onPointerUp(): void {
      down = false;
      input.dragging = false;
    }

    function onBlur(): void {
      held.clear();
      syncAxes();
      down = false;
      input.dragging = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  return state;
}
