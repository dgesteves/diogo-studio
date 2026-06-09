"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { resolveCssVarColor } from "./css-color";
import { fragmentShader, vertexShader } from "./radar-sweep-shaders";

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
