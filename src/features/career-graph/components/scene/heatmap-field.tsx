"use client";

import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCssVarColor } from "./css-color";
import { fragmentShader, vertexShader } from "./heatmap-field-shaders";

export function HeatmapField({ intensity = 1 }: { intensity?: number }): ReactElement {
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

  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseCurrent = useRef(new THREE.Vector2(0, 0));
  useFrame(({ clock }, delta) => {
    const u = matRef.current?.uniforms;
    if (!u?.uTime || !u.uAspect || !u.uMouse || !u.uPulse) return;
    u.uTime.value = clock.elapsedTime;
    u.uAspect.value = size.width / Math.max(size.height, 1);

    mouseCurrent.current.lerp(mouseTarget.current, Math.min(1, delta * 4));
    u.uMouse.value.copy(mouseCurrent.current);

    const phase = (clock.elapsedTime % 8) / 8;
    u.uPulse.value = Math.pow(phase, 0.6);
  });

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
