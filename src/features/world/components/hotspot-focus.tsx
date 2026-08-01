"use client";

import { useRef, useState, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import { FOCUS_FADE_RATE, FOCUS_GLOW_OPACITY, FOCUS_UNMOUNT_THRESHOLD } from "../constants/focus";
import { HotspotGlow } from "./hotspot-glow";
import { NeonLabel } from "./neon-label";

type HotspotFocusProps = {
  focus: boolean;
  accent: string;
  label: string;
  glowPosition: [number, number, number];
  glowRotation: [number, number, number];
  glowSize: number;
  labelPosition: [number, number, number];
};

export function HotspotFocus(props: HotspotFocusProps): ReactElement | null {
  const { focus, accent, label } = props;
  const [mounted, setMounted] = useState(focus);
  const amount = useRef(0);
  const glowRef = useRef<Mesh>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useFrame(({ clock }, delta) => {
    if (focus && !mounted) setMounted(true);
    amount.current += ((focus ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * FOCUS_FADE_RATE));
    const a = amount.current;

    const glow = glowRef.current;
    if (glow) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.03 * a;
      glow.scale.setScalar((0.88 + 0.12 * a) * pulse);
      (glow.material as MeshBasicMaterial).opacity = FOCUS_GLOW_OPACITY * a;
    }
    const span = labelRef.current;
    if (span) {
      span.style.opacity = String(a);
      span.style.transform = `translateY(${(1 - a) * 6}px)`;
    }

    if (!focus && a < FOCUS_UNMOUNT_THRESHOLD && mounted) setMounted(false);
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
      <NeonLabel ref={labelRef} position={props.labelPosition} accent={accent} label={label} />
    </>
  );
}
