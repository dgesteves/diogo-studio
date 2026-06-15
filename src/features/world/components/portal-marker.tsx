"use client";

import { useRef, useState, type ReactElement } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import { setHoveredStation } from "@/stores/world-store";
import type { WorldStation } from "../types";

type PortalMarkerProps = {
  station: WorldStation;
  label: string;
  active: boolean;
  onSelect: () => void;
};

export function PortalMarker({
  station,
  label,
  active,
  onSelect,
}: PortalMarkerProps): ReactElement {
  const ringRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const focus = hovered || active;

  useFrame(({ clock }) => {
    const ring = ringRef.current;
    if (!ring) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + station.anchor[0]) * 0.08;
    ring.scale.setScalar((focus ? 1.4 : 1) * pulse);
  });

  function handleOver(event: ThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    setHovered(true);
    setHoveredStation(station.slug);
    document.body.style.cursor = "pointer";
  }

  function handleOut(event: ThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    setHovered(false);
    setHoveredStation(null);
    document.body.style.cursor = "auto";
  }

  function handleClick(event: ThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    onSelect();
  }

  return (
    <group
      position={station.anchor}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.012, 8, 32]} />
        <meshBasicMaterial color={station.accent} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color={station.accent} toneMapped={false} />
      </mesh>
      <pointLight color={station.accent} intensity={focus ? 1.1 : 0.45} distance={1.6} decay={2} />
      {focus ? (
        <Html position={[0, 0.26, 0]} center distanceFactor={9} zIndexRange={[0, 0]}>
          <span
            aria-hidden="true"
            className="pointer-events-none font-mono text-[11px] font-medium tracking-[0.18em] whitespace-nowrap uppercase"
            style={{
              color: station.accent,
              textShadow: `0 0 10px ${station.accent}, 0 0 22px ${station.accent}`,
            }}
          >
            {label}
          </span>
        </Html>
      ) : null}
    </group>
  );
}
