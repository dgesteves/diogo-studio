"use client";

import { useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type MeshBasicMaterial } from "three";

/**
 * The indicator light every box on this desk wears, and the only thing in the room that moves
 * on its own while nobody is interacting with it. A core sphere plus an additive halo, and the
 * halo follows the core: a pulse where only the sphere brightens reads as a flicker rather
 * than as a light.
 *
 * It sits in its own file because three different boxes wear one and one of them — the Mac
 * Studio — is modeled elsewhere. Keeping it in the cluster made that a cycle between the two.
 */

const HALO_SCALE = 3.4;
const HALO_OPACITY = 0.26;
const IDLE_LEVEL = 0.22;

type StatusLedProps = {
  position: [number, number, number];
  color: string;
  radius: number;
  blinkSpeed?: number;
  phase?: number;
};

export function StatusLed({
  position,
  color,
  radius,
  blinkSpeed = 0,
  phase = 0,
}: StatusLedProps): ReactElement {
  const core = useRef<MeshBasicMaterial>(null);
  const halo = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!blinkSpeed || !core.current || !halo.current) return;
    const wave = 0.5 + 0.5 * Math.sin(clock.elapsedTime * blinkSpeed + phase);
    const level = IDLE_LEVEL + (1 - IDLE_LEVEL) * wave * wave;
    core.current.opacity = level;
    halo.current.opacity = HALO_OPACITY * level;
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 12, 10]} />
        <meshBasicMaterial ref={core} color={color} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, radius * 0.2]}>
        <circleGeometry args={[radius * HALO_SCALE, 20]} />
        <meshBasicMaterial
          ref={halo}
          color={color}
          transparent
          opacity={HALO_OPACITY}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
