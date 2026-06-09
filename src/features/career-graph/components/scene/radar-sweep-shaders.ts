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
