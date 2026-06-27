"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { EXPLORE } from "../constants/explore";
import { clampPitch, clampToBounds, derivePitch, deriveYaw, moveVector } from "../utils/explore";
import type { ExploreInputState } from "../hooks/use-explore-input";

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
