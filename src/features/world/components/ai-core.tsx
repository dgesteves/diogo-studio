"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, PointLight } from "three";
import { AI_CORE_ACCENT, AI_CORE_POSITION } from "../constants/ai-core";
import { useAiCoreHovered } from "../hooks/use-ai-core-hovered";
import { animateAiCore } from "../utils/ai-core-animation";
import { registerHotspot, unregisterHotspot } from "../utils/hotspot-registry";
import { AiCoreOrb } from "./ai-core-orb";
import { HotspotGlow } from "./hotspot-glow";

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
