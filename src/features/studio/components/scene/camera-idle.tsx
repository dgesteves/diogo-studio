"use client";

import { type RefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function CameraIdle({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}): null {
  const target = useRef(new THREE.Vector3());
  const base = useRef<THREE.Vector3 | null>(null);
  const scrollProgress = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    if (!base.current) base.current = camera.position.clone();
    if (!base.current) return;

    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const traveled = Math.max(0, -rect.top + viewportH * 0.4);
      const distance = Math.max(1, rect.height + viewportH * 0.4);
      scrollProgress.current = Math.min(1, Math.max(-0.2, traveled / distance));
    }

    const t = clock.elapsedTime;
    const orbit = Math.sin(t * 0.08) * 0.18;
    const orbitY = Math.cos(t * 0.06) * 0.08;
    const p = scrollProgress.current;

    target.current.set(
      base.current.x + orbit - p * 0.4,
      base.current.y + orbitY + p * 0.12,
      base.current.z + p * 0.2,
    );

    const lerp = 1 - Math.exp(-delta * 3);
    camera.position.lerp(target.current, lerp);
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}
