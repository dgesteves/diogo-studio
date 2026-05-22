"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";

/**
 * Atmospheric particle field — small cyan flecks slowly drifting through 3D
 * space. Adds depth and a sense of "live telemetry" behind the SVG graph
 * without drawing attention to itself.
 *
 * - One buffered `Points` mesh — single draw call.
 * - Position-only attribute (3 floats per point). Velocity stored in a
 *   sibling Float32Array but never uploaded to the GPU — the CPU loop just
 *   updates positions in place.
 * - Particles wrap around the bounds when they drift out.
 */

const COUNT = 140;
const BOUND_X = 3.4;
const BOUND_Y = 2.2;
const BOUND_Z = 1.6;

export function CareerParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const accent = useMemo(() => resolveCssVarColor("--accent"), []);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3 + 0] = (Math.random() * 2 - 1) * BOUND_X;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * BOUND_Y;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOUND_Z;
      velocities[i * 3 + 0] = (Math.random() * 2 - 1) * 0.015;
      velocities[i * 3 + 1] = (Math.random() * 2 - 1) * 0.01;
      velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 0.008;
    }
    return { positions, velocities };
  }, []);

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const geo = pts.geometry as THREE.BufferGeometry;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const step = Math.min(delta, 0.05); // clamp delta on long pauses

    for (let i = 0; i < COUNT; i += 1) {
      const idx = i * 3;
      arr[idx + 0]! += velocities[idx + 0]! * step * 60;
      arr[idx + 1]! += velocities[idx + 1]! * step * 60;
      arr[idx + 2]! += velocities[idx + 2]! * step * 60;
      // Wrap-around so the field is self-replenishing.
      if (arr[idx]! > BOUND_X) arr[idx]! = -BOUND_X;
      else if (arr[idx]! < -BOUND_X) arr[idx]! = BOUND_X;
      if (arr[idx + 1]! > BOUND_Y) arr[idx + 1]! = -BOUND_Y;
      else if (arr[idx + 1]! < -BOUND_Y) arr[idx + 1]! = BOUND_Y;
      if (arr[idx + 2]! > BOUND_Z) arr[idx + 2]! = -BOUND_Z;
      else if (arr[idx + 2]! < -BOUND_Z) arr[idx + 2]! = BOUND_Z;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={0}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={accent}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
