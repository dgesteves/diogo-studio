"use client";

import { useEffect, useRef, type RefObject } from "react";
import { setExplore } from "@/stores/explore-store";
import { EXPLORE } from "../constants/explore";
import { clampPitch } from "../utils/explore";
import { isWorldSurface } from "./orbit-input-state";
import {
  axesFromKeys,
  keyToAction,
  neutralExploreState,
  type ExploreAxis,
  type ExploreInputState,
} from "./explore-input-state";

export type { ExploreInputState };

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
