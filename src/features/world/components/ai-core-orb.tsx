"use client";

import type { ReactElement, Ref, RefObject } from "react";
import type { Group, Mesh, PointLight } from "three";
import {
  AI_CORE_ACCENT,
  AI_CORE_HITBOX_RADIUS,
  AI_CORE_LABEL,
  AI_CORE_RADIUS,
  AI_CORE_RING_ACCENT,
} from "../constants/ai-core";
import { NeonLabel } from "./neon-label";

type AiCoreOrbProps = {
  bobRef: Ref<Group>;
  coreRef: Ref<Mesh>;
  shellRef: Ref<Mesh>;
  ringARef: Ref<Mesh>;
  ringBRef: Ref<Mesh>;
  hitRef: Ref<Mesh>;
  lightRef: Ref<PointLight>;
  labelRef: RefObject<HTMLSpanElement | null>;
};

export function AiCoreOrb({
  bobRef,
  coreRef,
  shellRef,
  ringARef,
  ringBRef,
  hitRef,
  lightRef,
  labelRef,
}: AiCoreOrbProps): ReactElement {
  return (
    <group ref={bobRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[AI_CORE_RADIUS, 2]} />
        <meshStandardMaterial
          color="#062a33"
          emissive={AI_CORE_ACCENT}
          emissiveIntensity={2}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[AI_CORE_RADIUS * 1.55, 1]} />
        <meshBasicMaterial
          color={AI_CORE_ACCENT}
          wireframe
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ringARef} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[AI_CORE_RADIUS * 2.1, 0.008, 8, 64]} />
        <meshBasicMaterial color={AI_CORE_ACCENT} transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <mesh ref={ringBRef} rotation={[-Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[AI_CORE_RADIUS * 2.6, 0.006, 8, 64]} />
        <meshBasicMaterial
          color={AI_CORE_RING_ACCENT}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={hitRef}>
        <sphereGeometry args={[AI_CORE_HITBOX_RADIUS, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight ref={lightRef} color={AI_CORE_ACCENT} intensity={1.2} distance={4.5} decay={2} />
      <NeonLabel
        ref={labelRef}
        position={[0, 0.62, 0]}
        accent={AI_CORE_ACCENT}
        label={AI_CORE_LABEL}
      />
    </group>
  );
}
