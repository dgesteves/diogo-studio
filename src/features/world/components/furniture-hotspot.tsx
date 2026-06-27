"use client";

import { useEffect, useRef, type ReactElement } from "react";
import type { Mesh } from "three";
import { useHoveredStation } from "../hooks/use-hovered-station";
import { registerHotspot, unregisterHotspot } from "../utils/hotspot-registry";
import type { WorldStation } from "../types";
import type { FurnitureHotspot as Hotspot } from "../constants/hotspots";
import { HotspotFocus } from "./hotspot-focus";

const GLOW_SPREAD = 1.6;
const GLOW_PADDING = 0.18;
const WALL_GLOW_OFFSET = 0.02;
const LABEL_GAP = 0.16;

type FurnitureHotspotProps = {
  station: WorldStation;
  hotspot: Hotspot;
  label: string;
  active: boolean;
};

export function FurnitureHotspot({
  station,
  hotspot,
  label,
  active,
}: FurnitureHotspotProps): ReactElement {
  const meshRef = useRef<Mesh>(null);
  const hovered = useHoveredStation() === station.slug;
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

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.userData.hotspotSlug = station.slug;
    registerHotspot(mesh);
    return () => unregisterHotspot(mesh);
  }, [station.slug]);

  return (
    <group>
      <mesh ref={meshRef} position={[cx, cy, cz]}>
        <boxGeometry args={[sx, sy, sz]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <HotspotFocus
        focus={focus}
        accent={station.accent}
        label={label}
        lightPosition={station.anchor}
        glowPosition={glowPosition}
        glowRotation={glowRotation}
        glowSize={glowSize}
        labelPosition={labelPosition}
      />
    </group>
  );
}
