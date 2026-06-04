"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
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

// 70 particles (was 140) — the visual density is set more by the heatmap
// field than by particle count, and halving the loop body iterations
// dropped the per-frame CPU cost from ~0.6ms to ~0.3ms on integrated GPUs.
const COUNT = 70;
const BOUND_X = 3.4;
const BOUND_Y = 2.2;
const BOUND_Z = 1.6;

// Seed the field once at module load — `Math.random` must not run during
// render (React purity). Each mount clones `positions` so its per-frame
// drift never mutates the shared seed; `velocities` stays read-only.
function createParticleField(): { positions: Float32Array; velocities: Float32Array } {
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
}

const PARTICLE_FIELD = createParticleField();

export function CareerParticles(): ReactElement {
  const pointsRef = useRef<THREE.Points>(null);
  const accent = useMemo(() => resolveCssVarColor("--accent"), []);

  const positions = useMemo(() => PARTICLE_FIELD.positions.slice(), []);
  const velocities = PARTICLE_FIELD.velocities;

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const geo = pts.geometry as THREE.BufferGeometry;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const step = Math.min(delta, 0.05); // clamp delta on long pauses

    for (let i = 0; i < COUNT; i += 1) {
      const idx = i * 3;
      let x = (arr[idx + 0] ?? 0) + (velocities[idx + 0] ?? 0) * step * 60;
      let y = (arr[idx + 1] ?? 0) + (velocities[idx + 1] ?? 0) * step * 60;
      let z = (arr[idx + 2] ?? 0) + (velocities[idx + 2] ?? 0) * step * 60;
      // Wrap-around so the field is self-replenishing.
      if (x > BOUND_X) x = -BOUND_X;
      else if (x < -BOUND_X) x = BOUND_X;
      if (y > BOUND_Y) y = -BOUND_Y;
      else if (y < -BOUND_Y) y = BOUND_Y;
      if (z > BOUND_Z) z = -BOUND_Z;
      else if (z < -BOUND_Z) z = BOUND_Z;
      arr[idx + 0] = x;
      arr[idx + 1] = y;
      arr[idx + 2] = z;
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
