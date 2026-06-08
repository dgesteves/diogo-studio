"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type BufferAttribute, type BufferGeometry, type Points } from "three";

const COUNT = 90;
const BOUND_X = 3.2;
const Y_MIN = 0.2;
const Y_MAX = 3;
const BOUND_Z = 2.4;

function createMotes(): { positions: Float32Array; speeds: Float32Array } {
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    positions[i * 3 + 0] = (Math.random() * 2 - 1) * BOUND_X;
    positions[i * 3 + 1] = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOUND_Z;
    speeds[i] = 0.04 + Math.random() * 0.07;
  }
  return { positions, speeds };
}

const MOTE_FIELD = createMotes();

export function DustMotes(): ReactElement {
  const pointsRef = useRef<Points>(null);
  const positions = useMemo(() => MOTE_FIELD.positions.slice(), []);
  const speeds = MOTE_FIELD.speeds;

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const geo = pts.geometry as BufferGeometry;
    const attr = geo.getAttribute("position") as BufferAttribute;
    const arr = attr.array as Float32Array;
    const step = Math.min(delta, 0.05);

    for (let i = 0; i < COUNT; i += 1) {
      const idx = i * 3;
      let y = (arr[idx + 1] ?? 0) + (speeds[i] ?? 0) * step;
      if (y > Y_MAX) y = Y_MIN;
      arr[idx + 1] = y;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        color="#9fd8e8"
        transparent
        opacity={0.28}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
