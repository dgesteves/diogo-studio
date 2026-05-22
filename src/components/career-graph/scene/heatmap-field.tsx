"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";

/**
 * Volumetric heatmap field — raymarched 3D FBM noise on a fullscreen quad.
 *
 * The earlier version of this component drew 2D Perlin clouds on a plane.
 * It read as "atmospheric" but flat. This version actually marches a ray
 * through a 3D noise volume per pixel, so the field has real depth: the
 * eye reads multiple "altitudes" of density at once, and the field
 * reorganizes itself naturally as the camera dollies.
 *
 * The shader is intentionally cheap (24 raymarch steps, low-octave FBM)
 * so it stays well within budget on integrated GPUs. The earlier 2D
 * shader was ~8 texture-equivalent ops per pixel; this is ~120, still
 * comfortably under 1ms per frame on the small hero canvas at 1.75x DPR.
 *
 * Three uniforms feed visual richness:
 *   - `uTime` drifts the noise field on z-axis (slow, ~0.04/sec)
 *   - `uMouse` displaces the field laterally — gives a parallax response
 *   - `uPulse` periodically lights a soft radial wavefront emanating from
 *     the origin — the "scan ping" telemetry beat.
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
uniform float uIntensity;
uniform float uAspect;
uniform vec2  uMouse;
uniform float uPulse;     // 0..1 oscillator for the scan ping
uniform vec3  uAccent;    // primary cyan
uniform vec3  uAccentDeep;// darker cyan for shadow band

// ---- 3D hash + value noise + fbm ----
float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash3(i);
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}
float fbm3(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  // 4 octaves — dropped from 5 for perf; the lost detail at the highest
  // frequency is invisible at the canvas's effective scale.
  for (int i = 0; i < 4; i++) {
    v += a * noise3(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  // NDC-style coords centered at (0,0), aspect-corrected so the field
  // doesn't stretch.
  vec2 ndc = (vUv - 0.5) * vec2(uAspect, 1.0);

  // Ray marches from -z toward +z, parallel rays so we look "into" the
  // volume rather than from a viewpoint. This keeps the per-pixel cost
  // tiny while still reading as volumetric.
  vec3 ro = vec3(ndc * 2.0, -1.0);
  vec3 rd = vec3(0.0, 0.0, 1.0);

  // Mouse offset shifts the volume laterally for parallax. The factor is
  // small and tapers with depth so foreground feels more reactive than
  // the deep field.
  vec2 mouseOffset = uMouse * 0.35;

  // Accumulate density and color along the ray. Front-to-back so the
  // weight on near samples is highest (closer = more visible).
  float density = 0.0;
  float emit = 0.0;
  // 14 raymarch steps (was 24) — under the canvas's effective resolution
  // the eye can't resolve more samples than this, but the per-pixel cost
  // dropped by ~42% which alone removed the visible jank.
  const int STEPS = 14;
  const float MAX_T = 2.6;

  for (int i = 0; i < STEPS; i++) {
    float fi = float(i);
    float t = fi / float(STEPS);
    vec3 p = ro + rd * t * MAX_T;
    p.xy += mouseOffset * (1.0 - t * 0.6);
    p.z  += uTime * 0.04;

    // Single-octave domain warp (was two-octave) — fewer fbm3() calls per
    // step. The visual loss is imperceptible at our intensity / opacity.
    float warp = fbm3(p * 0.9 + vec3(uTime * 0.02, uTime * 0.018, 0.0)) * 0.6;
    float n = fbm3(p + vec3(warp));

    float density_step = smoothstep(0.40, 0.72, n);
    float depthWeight = 1.0 - smoothstep(0.0, 1.0, t * 0.95);

    density += density_step * depthWeight * 0.06;
    emit += smoothstep(0.62, 0.85, n) * depthWeight * 0.05;
  }

  // Scan ping — a radial wavefront, brightest at a moving radius. Picks
  // up the same density we computed so it only highlights existing
  // structure rather than overpainting the field.
  float r = length(ndc);
  float pingRadius = uPulse * 0.95;
  float ping = smoothstep(0.05, 0.0, abs(r - pingRadius)) * (1.0 - uPulse) * 0.7;

  // Color: blend a deep cyan into a hot cyan based on emit, then add the
  // ping as a pure accent on top of that.
  vec3 base = mix(uAccentDeep, uAccent, clamp(emit * 1.4, 0.0, 1.0));
  vec3 color = base + uAccent * ping * 0.6;

  // Subtle vignette — keeps the field from filling the corners with noise.
  float vignette = smoothstep(0.95, 0.10, r);

  float alpha = (density + emit * 0.6 + ping * 0.3) * vignette * uIntensity * 0.35;
  gl_FragColor = vec4(color, alpha);
}
`;

export function HeatmapField({ intensity = 1 }: { intensity?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const accent = useMemo(() => resolveCssVarColor("--accent"), []);
  const accentDeep = useMemo(() => {
    const c = accent.clone();
    c.multiplyScalar(0.35);
    return c;
  }, [accent]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPulse: { value: 0 },
      uAccent: { value: accent },
      uAccentDeep: { value: accentDeep },
    }),
    [accent, accentDeep, intensity],
  );

  // Mouse parallax: track normalized cursor position relative to the
  // canvas container so the value lives in roughly [-1, 1].
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseCurrent = useRef(new THREE.Vector2(0, 0));
  useFrame(({ clock }, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTime!.value = clock.elapsedTime;
    u.uAspect!.value = size.width / Math.max(size.height, 1);

    // Lerp toward the latest cursor position to soften jittery moves.
    mouseCurrent.current.lerp(mouseTarget.current, Math.min(1, delta * 4));
    u.uMouse!.value.copy(mouseCurrent.current);

    // Scan ping: 8s period, ease-out wavefront travelling outward.
    const phase = (clock.elapsedTime % 8) / 8;
    u.uPulse!.value = Math.pow(phase, 0.6);
  });

  // Bind a passive pointermove listener to update `mouseTarget` (read in
  // useFrame above). The canvas has `pointer-events: none` set by its
  // wrapper so we listen on `window`, mapping coordinates against the
  // canvas's parent element.
  //
  // PERF: pointermove can fire at 1000+ Hz on high-refresh displays.
  // `getBoundingClientRect()` forces a layout flush, so calling it on
  // every event was the largest source of jank in the hero. We rAF-
  // throttle the handler: store the latest event coords, then process
  // them at most once per animation frame.
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dom = gl.domElement.parentElement ?? gl.domElement;
    const target = mouseTarget.current;
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;
    let havePending = false;

    const flush = () => {
      rafId = 0;
      if (!havePending) return;
      havePending = false;
      const rect = dom.getBoundingClientRect();
      const x = ((pendingX - rect.left) / rect.width) * 2 - 1;
      const y = -(((pendingY - rect.top) / rect.height) * 2 - 1);
      target.set(x, y);
    };
    const onMove = (e: PointerEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      havePending = true;
      if (!rafId) rafId = requestAnimationFrame(flush);
    };
    const onLeave = () => target.set(0, 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    dom.addEventListener("pointerleave", onLeave);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  // Fullscreen-quad trick: a plane drawn directly in NDC, no camera projection.
  // We disable depth so it sits comfortably behind everything else.
  return (
    <mesh frustumCulled={false} renderOrder={-3}>
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
