"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";

/**
 * Wireframe perspective grid — a thin cyan grid receding into depth.
 *
 * The plane is tilted ~80° away from camera so it reads as a floor. Lines
 * are drawn by a shader (no geometry-instanced lines) so the grid stays
 * crisp at any DPR and we can apply a per-pixel fog/horizon fade.
 *
 * This is the single most "3D-feeling" element of the scene: a perspective
 * cue that anchors the otherwise floating volumetric field. We keep it
 * very faint by default so it reads as ambient infrastructure, not as
 * decoration.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  // Distance from camera, normalized later in the FS via the far plane.
  vec4 viewPos = viewMatrix * worldPos;
  vDepth = -viewPos.z;
  gl_Position = projectionMatrix * viewPos;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying float vDepth;

uniform float uTime;
uniform float uIntensity;
uniform vec3 uAccent;

void main() {
  // Grid coords — large lattice for the "highways", smaller for the fine
  // grid. The fine grid only paints near the camera; the coarse grid
  // remains visible all the way to the horizon.
  vec2 g = vUv * vec2(20.0, 12.0);
  // Slow translation toward the camera gives a perpetual "drifting toward
  // the horizon" feel — like a HUD overlay.
  g.y -= uTime * 0.10;

  vec2 gFine = fract(g);
  vec2 gCoarse = fract(g * 0.25);

  // Lines: pick the smaller of the two fract distances from 0/1 (which
  // is just |0.5 - fract|).
  float fineX = min(gFine.x, 1.0 - gFine.x);
  float fineY = min(gFine.y, 1.0 - gFine.y);
  float coarseX = min(gCoarse.x, 1.0 - gCoarse.x);
  float coarseY = min(gCoarse.y, 1.0 - gCoarse.y);

  float fineLine = max(
    smoothstep(0.04, 0.0, fineX),
    smoothstep(0.04, 0.0, fineY)
  );
  float coarseLine = max(
    smoothstep(0.012, 0.0, coarseX),
    smoothstep(0.012, 0.0, coarseY)
  );

  // Depth fade — fine grid disappears by mid-distance; coarse hangs on.
  float fineFade = smoothstep(6.0, 1.5, vDepth);
  float coarseFade = smoothstep(14.0, 3.0, vDepth);

  // Horizon fade — top of the plane (vUv.y → 1) fades to nothing.
  float horizon = smoothstep(1.0, 0.5, 1.0 - vUv.y);
  // Side fade — keeps the floor from butting against the canvas edges.
  float sides = smoothstep(0.0, 0.15, vUv.x) * smoothstep(0.0, 0.15, 1.0 - vUv.x);

  float lines = fineLine * fineFade * 0.35 + coarseLine * coarseFade * 0.8;
  float alpha = lines * horizon * sides * uIntensity * 0.45;

  gl_FragColor = vec4(uAccent, alpha);
}
`;

export function GridFloor({ intensity = 1 }: { intensity?: number }): ReactElement {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const accent = useMemo(() => resolveCssVarColor("--accent"), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uAccent: { value: accent },
    }),
    [accent, intensity],
  );

  useFrame(({ clock }) => {
    const uTime = matRef.current?.uniforms.uTime;
    if (!uTime) return;
    uTime.value = clock.elapsedTime;
  });

  // Tilt + translation: floor sits below the camera, recedes into +z.
  // Sized big so we never see its far edge — only the horizon fade.
  return (
    <mesh
      position={[0, -1.4, -3]}
      rotation={[-Math.PI / 2 + 0.18, 0, 0]}
      renderOrder={-1}
      frustumCulled={false}
    >
      <planeGeometry args={[18, 18]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
