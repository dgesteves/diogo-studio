"use client";

import { useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import type { Group } from "three";

type GlowPadProps = {
  accent: string;
  focus: boolean;
  seed: number;
};

export function GlowPad({ accent, focus, seed }: GlowPadProps): ReactElement {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + seed) * 0.08;
    group.scale.setScalar((focus ? 1.25 : 1) * pulse);
  });

  return (
    <Billboard>
      <group ref={groupRef}>
        <mesh>
          <circleGeometry args={[focus ? 0.016 : 0.013, 24]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        {focus ? (
          <>
            <mesh>
              <torusGeometry args={[0.06, 0.004, 8, 48]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.001]}>
              <circleGeometry args={[0.057, 32]} />
              <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.16} />
            </mesh>
          </>
        ) : null}
      </group>
    </Billboard>
  );
}
