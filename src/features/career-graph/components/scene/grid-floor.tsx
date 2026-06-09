"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";
import { fragmentShader, vertexShader } from "./grid-floor-shaders";

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
