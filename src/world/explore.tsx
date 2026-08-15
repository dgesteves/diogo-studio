"use client";

import { MathUtils, Vector3 } from "three";
import { useSyncExternalStore, useEffect, useRef, type RefObject } from "react";
import { getExploreServerSnapshot, getExploreSnapshot, subscribeExplore } from "./store";
import { useRouter } from "next/navigation";
import { routes, type RouteKey } from "@/content/pages";
import { useFrame } from "@react-three/fiber";
import { type ExploreInputState } from "./input";

/**
 * Free-look: the mode where the visitor takes the camera off the rails, the bounds that keep
 * them inside the room, and the handoff back to route-driven framing when they navigate.
 */

export const EXPLORE = {
  eyeHeight: 1.6,
  moveSpeed: 2.6,
  lookSensitivity: 0.0026,
  pitchMinRad: -0.62,
  pitchMaxRad: 0.62,
  positionDamp: 9,
  bounds: { minX: -2.0, maxX: 4.6, minZ: 0.9, maxZ: 4.6 },
} as const;

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

export function useExplore(): boolean {
  return useSyncExternalStore(subscribeExplore, getExploreSnapshot, getExploreServerSnapshot);
}

export function useExploreHandoff(active: RouteKey, explore: boolean): void {
  const router = useRouter();
  const wasExploring = useRef(false);

  useEffect(() => {
    const was = wasExploring.current;
    wasExploring.current = explore;
    if (!explore && was && active !== "home") {
      router.replace(routes.home, { scroll: false });
    }
  }, [explore, active, router]);
}

type ExploreControllerProps = {
  input: RefObject<ExploreInputState>;
};

export function ExploreController({ input }: ExploreControllerProps): null {
  const target = useRef(new Vector3());
  const dir = useRef(new Vector3());
  const baseYaw = useRef(0);
  const basePitch = useRef(0);
  const ready = useRef(false);

  useFrame(({ camera }, delta) => {
    const i = input.current;
    if (!ready.current) {
      camera.getWorldDirection(dir.current);
      baseYaw.current = deriveYaw(dir.current.x, dir.current.z);
      basePitch.current = derivePitch(dir.current.y);
      const [sx, sz] = clampToBounds(camera.position.x, camera.position.z);
      target.current.set(sx, EXPLORE.eyeHeight, sz);
      ready.current = true;
    }

    const yaw = baseYaw.current + i.yaw;
    const pitch = clampPitch(basePitch.current + i.pitch);
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch, yaw, 0);

    const [mx, mz] = moveVector(yaw, i.forward, i.strafe);
    const step = EXPLORE.moveSpeed * delta;
    const [x, z] = clampToBounds(target.current.x + mx * step, target.current.z + mz * step);
    target.current.set(x, EXPLORE.eyeHeight, z);

    camera.position.lerp(target.current, 1 - Math.exp(-delta * EXPLORE.positionDamp));
  });

  return null;
}
