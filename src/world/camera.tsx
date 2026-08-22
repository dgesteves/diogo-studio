"use client";

import { MathUtils, Spherical, Vector3 } from "three";
import { ROOM } from "./room";
import { type Vec3, type WorldStation } from "./stations";
import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { type PageSlug } from "@/content/pages";
import { getExploreSnapshot } from "./store";
import { getStation } from "./stations";
import { type OrbitInputState } from "./input";

/**
 * Everything that decides where the camera is: the intro flight, the per-route framing, the
 * orbit the visitor can take on the home route, and the damping constants all three share.
 * Framing responds to the viewport by moving the camera, never the objects.
 */

export const ORBIT = {
  azimuthLimitRad: 0.6,
  polarLimitRad: 0.32,
  zoomMinFactor: 0.72,
  zoomMaxFactor: 1.28,
  azimuthRadPerPx: 0.0042,
  polarRadPerPx: 0.0042,
  zoomFactorPerWheelUnit: 0.0009,
  dragThresholdPx: 4,
  followRate: 14,
  returnRate: 2.6,
  returnDelayMs: 2200,
  phiMinRad: 0.2,
  phiMaxRad: 1.52,
  introGlide: 1.1,
  idleGlide: 2.4,
  activeGlide: 9,
} as const;

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

const REFERENCE_ASPECT = 16 / 9;
const MAX_PULLBACK = 3.5;
const SIDE_WALL_CLEARANCE = 0.35;

// A perspective camera fixes the vertical field of view, so narrower viewports
// lose horizontal coverage and the world looks cropped. Pulling the camera back
// by reference/aspect restores that coverage; wider-than-reference screens keep
// the authored framing (pullback of 1).
export function framingPullback(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1;
  const pullback = REFERENCE_ASPECT / Math.min(aspect, REFERENCE_ASPECT);
  return Math.min(pullback, MAX_PULLBACK);
}

// Both side walls carry content — the wall screens hang on the right one and the
// city window is cut into the left one — so a pulled-back camera has to stay
// between them, or it looks at that content from behind.
export function clampCameraX(x: number): number {
  const min = ROOM.minX + SIDE_WALL_CLEARANCE;
  const max = ROOM.maxX - SIDE_WALL_CLEARANCE;
  return Math.min(Math.max(x, min), max);
}

const SESSION_KEY = "world-intro-played";

export function consumeIntro(isHome: boolean): boolean {
  if (!isHome || typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function introStartPosition(station: WorldStation): Vec3 {
  const [x, y, z] = station.position;
  return [x * 1.5, y + 4.2, z * 1.9];
}

type WorldCameraProps = {
  active: PageSlug;
  input: RefObject<OrbitInputState>;
};

export function WorldCamera({ active, input }: WorldCameraProps): null {
  const look = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const spherical = useRef(new Spherical());
  const applied = useRef({ azimuth: 0, polar: 0, zoom: 1 });
  const forward = useRef(new Vector3());
  const ready = useRef(false);
  const intro = useRef(false);

  useFrame(({ camera, size }, delta) => {
    if (getExploreSnapshot()) {
      camera.getWorldDirection(forward.current);
      look.current.copy(camera.position).add(forward.current);
      return;
    }

    const station = getStation(active);
    const [px, py, pz] = station.position;
    const [tx, ty, tz] = station.target;

    lookTarget.current.set(tx, ty, tz);
    direction.current.set(px - tx, py - ty, pz - tz);
    const baseDistance = direction.current.length() || 1;
    direction.current.divideScalar(baseDistance);

    const i = input.current;
    const idle = isOrbitIdle(performance.now(), i.lastInput, i.dragging);
    const rate = idle ? ORBIT.returnRate : ORBIT.followRate;
    const a = applied.current;
    a.azimuth = damp(a.azimuth, idle ? 0 : i.azimuth, rate, delta);
    a.polar = damp(a.polar, idle ? 0 : i.polar, rate, delta);
    a.zoom = damp(a.zoom, idle ? 1 : i.zoom, rate, delta);

    // The camera holds the framing it settles on. It used to carry a permanent sine drift plus
    // a pointer parallax on top of every station, so nothing in the room was ever still: the
    // whole view breathed, and the city outside the window — being the furthest thing from the
    // pivot — swung more than anything else in it. A station is a fixed shot. What moves the
    // camera is the visitor dragging it, and nothing else.
    spherical.current.setFromVector3(direction.current);
    spherical.current.theta += a.azimuth;
    spherical.current.phi = MathUtils.clamp(
      spherical.current.phi + a.polar,
      ORBIT.phiMinRad,
      ORBIT.phiMaxRad,
    );
    spherical.current.radius = 1;
    direction.current.setFromSpherical(spherical.current);

    const distance = baseDistance * framingPullback(size.width / size.height) * a.zoom;
    desired.current.copy(lookTarget.current).addScaledVector(direction.current, distance);
    desired.current.x = clampCameraX(desired.current.x);

    if (!ready.current) {
      intro.current = consumeIntro(active === "home");
      if (intro.current) {
        const [sx, sy, sz] = introStartPosition(station);
        camera.position.set(clampCameraX(sx), sy, sz);
      } else {
        camera.position.copy(desired.current);
      }
      look.current.copy(lookTarget.current);
      ready.current = true;
    }

    const settle = intro.current ? ORBIT.introGlide : idle ? ORBIT.idleGlide : ORBIT.activeGlide;
    const lerp = 1 - Math.exp(-delta * settle);
    camera.position.lerp(desired.current, lerp);
    look.current.lerp(lookTarget.current, lerp);
    camera.lookAt(look.current);

    if (intro.current && camera.position.distanceToSquared(desired.current) < 0.02) {
      intro.current = false;
    }
  });

  return null;
}
