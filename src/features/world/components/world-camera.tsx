"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { RouteKey } from "@/constants/routes";
import { getStation } from "../constants/stations";

export function WorldCamera({ active }: { active: RouteKey }): null {
  const look = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());
  const ready = useRef(false);

  useFrame(({ camera, clock, pointer }, delta) => {
    const station = getStation(active);
    const [px, py, pz] = station.position;
    const [tx, ty, tz] = station.target;

    const t = clock.elapsedTime;
    const orbitX = Math.sin(t * 0.1) * 0.16 + pointer.x * 0.4;
    const orbitY = Math.cos(t * 0.08) * 0.08 - pointer.y * 0.25;

    desired.current.set(px + orbitX, py + orbitY, pz);
    lookTarget.current.set(tx, ty, tz);

    if (!ready.current) {
      camera.position.copy(desired.current);
      look.current.copy(lookTarget.current);
      ready.current = true;
    }

    const lerp = 1 - Math.exp(-delta * 2.4);
    camera.position.lerp(desired.current, lerp);
    look.current.lerp(lookTarget.current, lerp);
    camera.lookAt(look.current);
  });

  return null;
}
