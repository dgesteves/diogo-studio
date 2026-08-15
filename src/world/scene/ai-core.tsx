"use client";

import { type Vec3 } from "@/world/stations";
import {
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import {
  useSyncExternalStore,
  type ReactElement,
  type Ref,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "@/world/store";
import { NeonLabel, HotspotGlow } from "../hotspots";
import { useFrame } from "@react-three/fiber";
import { registerHotspot, unregisterHotspot } from "../interact";

export const AI_CORE_POSITION = [-0.55, 1.55, 1.75] as const satisfies Vec3;
export const AI_CORE_ACCENT = "#22d3ee";
const AI_CORE_RING_ACCENT = "#f0468a";
const AI_CORE_LABEL = "ASK THE AI";
export const AI_CORE_RADIUS = 0.16;
export const AI_CORE_HITBOX_RADIUS = 0.52;

export type AiCoreParts = {
  bob: Group | null;
  core: Mesh | null;
  shell: Mesh | null;
  ringA: Mesh | null;
  ringB: Mesh | null;
  glow: Mesh | null;
  light: PointLight | null;
  label: HTMLSpanElement | null;
};

const BOB_SPEED = 1.3;
const BOB_HEIGHT = 0.06;
const PULSE_SPEED = 2.4;
const LABEL_IDLE_OPACITY = 0.28;

export function animateAiCore(parts: AiCoreParts, t: number, a: number): void {
  const pulse = Math.sin(t * PULSE_SPEED);

  if (parts.bob) parts.bob.position.y = Math.sin(t * BOB_SPEED) * BOB_HEIGHT;
  if (parts.core) {
    parts.core.rotation.y = t * 0.6;
    const material = parts.core.material as MeshStandardMaterial;
    material.emissiveIntensity = 1.9 + pulse * 0.45 + a * 1.3;
  }
  if (parts.shell) {
    parts.shell.rotation.y = -t * 0.25;
    parts.shell.rotation.x = Math.sin(t * 0.5) * 0.2;
  }
  if (parts.ringA) parts.ringA.rotation.z = t * 0.8;
  if (parts.ringB) parts.ringB.rotation.z = -t * 0.55;
  if (parts.light) parts.light.intensity = 1.15 + pulse * 0.25 + a * 1.5;
  if (parts.glow) {
    (parts.glow.material as MeshBasicMaterial).opacity = 0.16 + a * 0.3;
    parts.glow.scale.setScalar(1 + pulse * 0.04 + a * 0.25);
  }
  if (parts.label) {
    parts.label.style.opacity = String(LABEL_IDLE_OPACITY + a * (1 - LABEL_IDLE_OPACITY));
    parts.label.style.transform = `translateY(${(1 - a) * 6}px)`;
  }
}

export function useAiCoreHovered(): boolean {
  const state = useSyncExternalStore(subscribeWorld, getWorldSnapshot, getWorldServerSnapshot);
  return state.aiCoreHovered;
}

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

function AiCoreOrb({
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
      <mesh ref={hitRef} visible={false}>
        <sphereGeometry args={[AI_CORE_HITBOX_RADIUS, 12, 12]} />
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

const HOVER_RATE = 10;

export function AiCore(): ReactElement {
  const hovered = useAiCoreHovered();
  const amount = useRef(0);
  const bob = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  const label = useRef<HTMLSpanElement>(null);
  const hit = useRef<Mesh>(null);
  const [x, y, z] = AI_CORE_POSITION;

  useEffect(() => {
    const mesh = hit.current;
    if (!mesh) return;
    mesh.userData.aiCore = true;
    registerHotspot(mesh);
    return () => unregisterHotspot(mesh);
  }, []);

  useFrame(({ clock }, delta) => {
    amount.current += ((hovered ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * HOVER_RATE));
    animateAiCore(
      {
        bob: bob.current,
        core: core.current,
        shell: shell.current,
        ringA: ringA.current,
        ringB: ringB.current,
        glow: glow.current,
        light: light.current,
        label: label.current,
      },
      clock.elapsedTime,
      amount.current,
    );
  });

  return (
    <group position={[x, y, z]}>
      <AiCoreOrb
        bobRef={bob}
        coreRef={core}
        shellRef={shell}
        ringARef={ringA}
        ringBRef={ringB}
        hitRef={hit}
        lightRef={light}
        labelRef={label}
      />
      <HotspotGlow
        ref={glow}
        position={[0, -y + 0.021, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={1.3}
        accent={AI_CORE_ACCENT}
      />
    </group>
  );
}
