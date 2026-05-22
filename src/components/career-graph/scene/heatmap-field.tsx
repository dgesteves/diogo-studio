"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";

/**
 * Ambient heatmap backplane — the explicit RF-heatmap nod called out in the
 * blueprint (§2.2). A single screen-aligned plane with a small custom GLSL
 * shader. Cheap (one quad, ~30 lines of fragment), but unmistakeable: rolling
 * Perlin-noise contours fade toward the page background, color-shifted to
 * the signal-cyan accent.
 *
 * The shader is built around two domain-warped FBMs at different scales
 * blended over time. The blue/cyan range tracks our --accent token; we pass
 * the resolved RGB as a uniform so the shader respects theme changes too.
 */

// Compact 2D FBM in ~25 lines. Hash-based, no texture sampling.
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uAccent;
uniform float uIntensity;
uniform float uAspect;

// 2D hash + value noise — small, deterministic, no textures.
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Compensate for the plane's aspect so contours read circular, not elliptical.
  vec2 uv = vUv;
  uv.x *= uAspect;

  // Two domain-warped FBMs at different rates — produces slow, drifting
  // clouds. No hard contour bands: those were reading as ugly blobs at our
  // canvas resolution. A soft remap keeps the field atmospheric.
  vec2 q = vec2(
    fbm(uv * 1.1 + vec2(uTime * 0.020, 0.0)),
    fbm(uv * 1.1 + vec2(0.0, uTime * 0.016))
  );
  float n = fbm(uv * 1.6 + q * 1.2 + uTime * 0.010);

  // Gentle s-curve remap of the cloud noise — soft falloff at both ends so
  // we get a continuous, painterly field rather than banded blobs.
  float cloud = smoothstep(0.30, 0.70, n);

  // A second, much-larger-scale modulation reveals a subtle "ridge" running
  // through the field — the RF-heatmap nod the blueprint asked for, just
  // dialed way down.
  float ridge = smoothstep(0.48, 0.52, fbm(uv * 0.6 - uTime * 0.008));

  // Radial fade keeps the field reading as ambient, not as a filled rect.
  vec2 center = vec2(uAspect * 0.5, 0.5);
  float r = length(uv - center) / max(uAspect, 1.0);
  float vignette = smoothstep(0.95, 0.10, r);

  // Final alpha — kept low so the field never competes with the nodes.
  float alpha = (cloud * 0.55 + ridge * 0.20) * vignette * 0.10 * uIntensity;
  gl_FragColor = vec4(uAccent, alpha);
}
`;

export function HeatmapField({ intensity = 1 }: { intensity?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  // The accent token is OKLCH; modern browsers resolve `getComputedStyle()`
  // to `lab()`/`oklch()` strings that THREE.Color can't parse. The shared
  // helper routes the value through a 1×1 canvas to normalize to sRGB.
  const accent = useMemo(() => resolveCssVarColor("--accent"), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: accent },
      uIntensity: { value: intensity },
      uAspect: { value: 1 },
    }),
    [accent, intensity],
  );

  useFrame(({ clock, size }) => {
    const u = matRef.current?.uniforms;
    if (!u?.uTime || !u?.uAspect) return;
    u.uTime.value = clock.elapsedTime;
    u.uAspect.value = size.width / Math.max(size.height, 1);
  });

  // Plane sits well behind the nodes, sized generously so it covers the
  // full FOV across all camera dolly positions without revealing edges.
  return (
    <mesh position={[0, 0, -2.5]} renderOrder={-2}>
      <planeGeometry args={[20, 12]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
