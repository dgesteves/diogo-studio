"use client";

import { useState, type ReactElement } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { setHoveredStation } from "@/stores/world-store";
import type { WorldStation } from "../types";
import { GlowPad } from "./objects/glow-pad";

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
  const [hovered, setHovered] = useState(false);
  const focus = hovered || active;

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
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <GlowPad accent={station.accent} focus={focus} seed={station.anchor[0]} />
      <pointLight color={station.accent} intensity={focus ? 1.3 : 0.12} distance={2} decay={2} />
      {focus ? (
        <Html position={[0, 0.28, 0]} center distanceFactor={9} zIndexRange={[0, 0]}>
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
