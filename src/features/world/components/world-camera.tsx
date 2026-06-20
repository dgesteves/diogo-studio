"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { RouteKey } from "@/constants/routes";
import { getStation } from "../constants/stations";
import { consumeIntro, introStartPosition } from "../utils/intro";

export function WorldCamera({ active }: { active: RouteKey }): null {
  const look = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());
  const ready = useRef(false);
  const intro = useRef(false);

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

    const settle = intro.current ? 1.1 : 2.4;
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
