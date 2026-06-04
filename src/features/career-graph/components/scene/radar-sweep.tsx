"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { resolveCssVarColor } from "./css-color";

/**
 * Radar sweep — a thin cyan arc rotating around the origin, leaving a
 * decaying angular trail behind it.
 *
 * It's a single fullscreen quad with a tiny GLSL shader. Implementing it
 * as a fullscreen pass means the sweep scales to any aspect, never clips
 * at the corners, and stays cheap (just a polar coordinate transform).
 *
 * The blueprint asks for "subtle / RF-heatmap-inspired telemetry." A radar
 * sweep is the most literal expression of that vocabulary; we keep the
 * radius below the visible canvas so the leading edge is always on screen
 * but never punches out of the field.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uAspect;
uniform vec3 uAccent;
uniform float uIntensity;

#define TAU 6.2831853

void main() {
  // Aspect-correct, centered coords. Y is inverted so angle increases
  // clockwise (matches radar convention without changing the math).
  vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);

  float r = length(uv);

  // Skip work outside the disc — the sweep is a circular phenomenon and
  // shouldn't paint into the corners.
  if (r > 0.98) discard;

  // Polar angle, normalized 0..1.
  float ang = atan(uv.y, uv.x) / TAU;
  if (ang < 0.0) ang += 1.0;

  // Sweep phase travels around the disc every ~14 seconds.
  float sweep = mod(uTime / 14.0, 1.0);

  // Angular distance behind the current sweep position. The trail wraps
  // around 1.0, so we mod with that in mind.
  float behind = mod(sweep - ang, 1.0);

  // Trail spans ~30% of the disc, exponentially decaying toward 0.
  float trail = pow(1.0 - clamp(behind / 0.30, 0.0, 1.0), 3.0);

  // Leading edge — a sharp, narrow arc at the sweep position.
  float lead = smoothstep(0.018, 0.0, abs(behind));

  // Radial vignette: brightest at mid-radius, fades at the rim and the
  // dead-center (so the rotation axis doesn't read as a glowing dot).
  float radial = smoothstep(0.02, 0.20, r) * smoothstep(0.98, 0.6, r);

  float intensity = (trail * 0.45 + lead * 1.0) * radial;
  gl_FragColor = vec4(uAccent, intensity * uIntensity * 0.55);
}
`;

export function RadarSweep({ intensity = 1 }: { intensity?: number }): ReactElement {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const accent = useMemo(() => resolveCssVarColor("--accent"), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uAccent: { value: accent },
      uIntensity: { value: intensity },
    }),
    [accent, intensity],
  );

  useFrame(({ clock }) => {
    const u = matRef.current?.uniforms;
    if (!u?.uTime || !u.uAspect) return;
    u.uTime.value = clock.elapsedTime;
    u.uAspect.value = size.width / Math.max(size.height, 1);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-2}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
