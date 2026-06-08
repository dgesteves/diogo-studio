import { noiseGlsl } from "./heatmap-noise-glsl";

export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uIntensity;
uniform float uAspect;
uniform vec2  uMouse;
uniform float uPulse;     // 0..1 oscillator for the scan ping
uniform vec3  uAccent;    // primary cyan
uniform vec3  uAccentDeep;// darker cyan for shadow band
${noiseGlsl}
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
