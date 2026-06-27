import { MathUtils } from "three";
import { EXPLORE } from "../constants/explore";

export function clampPitch(value: number): number {
  return MathUtils.clamp(value, EXPLORE.pitchMinRad, EXPLORE.pitchMaxRad);
}

export function clampToBounds(x: number, z: number): [number, number] {
  const { minX, maxX, minZ, maxZ } = EXPLORE.bounds;
  return [MathUtils.clamp(x, minX, maxX), MathUtils.clamp(z, minZ, maxZ)];
}

export function moveVector(yaw: number, forward: number, strafe: number): [number, number] {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  let x = -sin * forward + cos * strafe;
  let z = -cos * forward - sin * strafe;
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  return [x, z];
}

export function deriveYaw(dirX: number, dirZ: number): number {
  return Math.atan2(-dirX, -dirZ);
}

export function derivePitch(dirY: number): number {
  return Math.asin(MathUtils.clamp(dirY, -1, 1));
}
