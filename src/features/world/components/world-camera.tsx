"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Spherical, Vector3 } from "three";
import type { RouteKey } from "@/constants/routes";
import { getExploreSnapshot } from "@/stores/explore-store";
import { getStation } from "../constants/stations";
import { consumeIntro, introStartPosition } from "../utils/intro";
import { framingPullback } from "../utils/framing";
import { ORBIT } from "../constants/orbit";
import { damp, isOrbitIdle } from "../utils/orbit";
import type { OrbitInputState } from "../hooks/use-orbit-input";

type WorldCameraProps = {
  active: RouteKey;
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

  useFrame(({ camera, clock, pointer, size }, delta) => {
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

    const t = clock.elapsedTime;
    const driftAz = Math.sin(t * 0.1) * ORBIT.idleAzimuthRad + pointer.x * ORBIT.parallaxAzimuthRad;
    const driftPolar = Math.cos(t * 0.08) * ORBIT.idlePolarRad - pointer.y * ORBIT.parallaxPolarRad;

    spherical.current.setFromVector3(direction.current);
    spherical.current.theta += a.azimuth + driftAz;
    spherical.current.phi = MathUtils.clamp(
      spherical.current.phi + a.polar + driftPolar,
      ORBIT.phiMinRad,
      ORBIT.phiMaxRad,
    );
    spherical.current.radius = 1;
    direction.current.setFromSpherical(spherical.current);

    const distance = baseDistance * framingPullback(size.width / size.height) * a.zoom;
    desired.current.copy(lookTarget.current).addScaledVector(direction.current, distance);

    if (!ready.current) {
      intro.current = consumeIntro(active === "home");
      if (intro.current) {
        const [sx, sy, sz] = introStartPosition(station);
        camera.position.set(sx, sy, sz);
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
