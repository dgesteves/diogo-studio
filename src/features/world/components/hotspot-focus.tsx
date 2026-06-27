"use client";

import { useRef, useState, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial, PointLight } from "three";
import type { Vec3 } from "../types";
import { HotspotGlow } from "./hotspot-glow";
import { NeonLabel } from "./neon-label";

const GLOW_OPACITY = 0.6;
const LIGHT_INTENSITY = 1.4;
const FADE_RATE = 12;
const UNMOUNT_THRESHOLD = 0.012;

type HotspotFocusProps = {
  focus: boolean;
  accent: string;
  label: string;
  lightPosition: Vec3;
  glowPosition: [number, number, number];
  glowRotation: [number, number, number];
  glowSize: number;
  labelPosition: [number, number, number];
};

export function HotspotFocus(props: HotspotFocusProps): ReactElement | null {
  const { focus, accent, label, lightPosition } = props;
  const [mounted, setMounted] = useState(focus);
  const amount = useRef(0);
  const glowRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useFrame(({ clock }, delta) => {
    if (focus && !mounted) setMounted(true);
    amount.current += ((focus ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * FADE_RATE));
    const a = amount.current;

    const glow = glowRef.current;
    if (glow) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.03 * a;
      glow.scale.setScalar((0.88 + 0.12 * a) * pulse);
      (glow.material as MeshBasicMaterial).opacity = GLOW_OPACITY * a;
    }
    if (lightRef.current) lightRef.current.intensity = LIGHT_INTENSITY * a;
    const span = labelRef.current;
    if (span) {
      span.style.opacity = String(a);
      span.style.transform = `translateY(${(1 - a) * 6}px)`;
    }

    if (!focus && a < UNMOUNT_THRESHOLD && mounted) setMounted(false);
  });

  if (!mounted) return null;

  return (
    <>
      <HotspotGlow
        ref={glowRef}
        position={props.glowPosition}
        rotation={props.glowRotation}
        size={props.glowSize}
        accent={accent}
      />
      <pointLight
        ref={lightRef}
        position={lightPosition}
        color={accent}
        intensity={0}
        distance={2.4}
        decay={2}
      />
      <NeonLabel ref={labelRef} position={props.labelPosition} accent={accent} label={label} />
    </>
  );
}
