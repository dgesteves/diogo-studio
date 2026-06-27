import { MathUtils } from "three";
import { ORBIT } from "../constants/orbit";

export function clampAzimuth(value: number): number {
  return MathUtils.clamp(value, -ORBIT.azimuthLimitRad, ORBIT.azimuthLimitRad);
}

export function clampPolar(value: number): number {
  return MathUtils.clamp(value, -ORBIT.polarLimitRad, ORBIT.polarLimitRad);
}

export function clampZoom(value: number): number {
  return MathUtils.clamp(value, ORBIT.zoomMinFactor, ORBIT.zoomMaxFactor);
}

export function isOrbitIdle(now: number, lastInput: number, dragging: boolean): boolean {
  return !dragging && now - lastInput > ORBIT.returnDelayMs;
}

export function damp(current: number, goal: number, rate: number, delta: number): number {
  return current + (goal - current) * (1 - Math.exp(-delta * rate));
}
