"use client";

import { useState, type ReactElement } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { setHoveredStation } from "@/stores/world-store";
import type { WorldStation } from "../types";
import type { FurnitureHotspot as Hotspot } from "../constants/hotspots";
import { HotspotGlow } from "./hotspot-glow";
import { NeonLabel } from "./neon-label";

const GLOW_SPREAD = 1.6;
const GLOW_PADDING = 0.18;
const WALL_GLOW_OFFSET = 0.02;
const LABEL_GAP = 0.16;

type FurnitureHotspotProps = {
  station: WorldStation;
  hotspot: Hotspot;
  label: string;
  active: boolean;
  onSelect: () => void;
};

export function FurnitureHotspot({
  station,
  hotspot,
  label,
  active,
  onSelect,
}: FurnitureHotspotProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const focus = hovered || active;
  const [cx, cy, cz] = hotspot.center;
  const [sx, sy, sz] = hotspot.size;
  const [ax, ay, az] = station.anchor;
  const isWall = hotspot.glow === "wall";
  const floorY = hotspot.glow === "wall" ? 0 : hotspot.groundY;
  const glowSize = Math.max(sx, isWall ? sy : sz) * GLOW_SPREAD + GLOW_PADDING;
  const glowPosition: [number, number, number] = isWall
    ? [cx, cy, cz - WALL_GLOW_OFFSET]
    : [cx, floorY, cz];
  const glowRotation: [number, number, number] = isWall ? [0, 0, 0] : [-Math.PI / 2, 0, 0];
  const labelPosition: [number, number, number] = isWall
    ? [cx, cy + sy / 2 + LABEL_GAP, cz]
    : [ax, ay + 0.24, az];

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
    <group>
      <mesh
        position={[cx, cy, cz]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <boxGeometry args={[sx, sy, sz]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {focus ? (
        <>
          <HotspotGlow
            position={glowPosition}
            rotation={glowRotation}
            size={glowSize}
            accent={station.accent}
          />
          <pointLight
            position={station.anchor}
            color={station.accent}
            intensity={1.4}
            distance={2.4}
            decay={2}
          />
          <NeonLabel position={labelPosition} accent={station.accent} label={label} />
        </>
      ) : null}
    </group>
  );
}
