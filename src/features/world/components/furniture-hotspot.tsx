"use client";

import { useState, type ReactElement } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { setHoveredStation } from "@/stores/world-store";
import type { WorldStation } from "../types";
import type { FurnitureHotspot as Hotspot } from "../constants/hotspots";
import { createRadialGlowTexture } from "../lib/radial-glow";
import { NeonLabel } from "./neon-label";

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
  const glow = createRadialGlowTexture();
  const glowSize = Math.max(0.6, Math.max(sx, sz) * 0.8) * 2;

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
          <mesh position={[cx, hotspot.groundY, cz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[glowSize, glowSize]} />
            <meshBasicMaterial
              map={glow}
              color={station.accent}
              transparent
              opacity={0.6}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={station.anchor}
            color={station.accent}
            intensity={1.4}
            distance={2.4}
            decay={2}
          />
          <NeonLabel position={[ax, ay + 0.24, az]} accent={station.accent} label={label} />
        </>
      ) : null}
    </group>
  );
}
