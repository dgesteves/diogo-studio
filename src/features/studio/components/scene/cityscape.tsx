"use client";

import { useMemo, type ReactElement } from "react";
import { AdditiveBlending } from "three";

import { createCityFacadeTexture, createSkyTexture, mulberry32 } from "./city-textures";
import { Moon } from "./moon";

type Building = {
  x: number;
  z: number;
  width: number;
  depth: number;
  top: number;
  seed: number;
};

const BASE_Y = -9;
const FACADE_VARIANTS = 5;

const LAYERS = [
  { z: -1.0, count: 8, spread: 7.0, topMin: -1.4, topMax: -0.85, width: 1.15, depth: 0.7 },
  { z: -2.3, count: 8, spread: 8.5, topMin: -1.15, topMax: -0.45, width: 1.0, depth: 0.8 },
  { z: -3.9, count: 9, spread: 10.5, topMin: -0.75, topMax: 0.15, width: 1.05, depth: 0.9 },
  { z: -6.0, count: 9, spread: 13.0, topMin: -0.6, topMax: 0.3, width: 1.2, depth: 1.0 },
] as const;

function buildCity(): Building[] {
  const rand = mulberry32(20260626);
  const buildings: Building[] = [];
  let seed = 0;
  for (const layer of LAYERS) {
    for (let i = 0; i < layer.count; i += 1) {
      const t = i / (layer.count - 1);
      buildings.push({
        x: (t - 0.5) * layer.spread + (rand() - 0.5) * 0.7,
        z: layer.z + (rand() - 0.5) * 0.8,
        width: layer.width * (0.7 + rand() * 0.6),
        depth: layer.depth * (0.7 + rand() * 0.6),
        top: layer.topMin + rand() * (layer.topMax - layer.topMin),
        seed: seed++,
      });
    }
  }
  return buildings;
}

const BUILDINGS = buildCity();

export function Cityscape(): ReactElement {
  const facades = useMemo(
    () => Array.from({ length: FACADE_VARIANTS }, (_, i) => createCityFacadeTexture(100 + i)),
    [],
  );
  const sky = useMemo(() => createSkyTexture(), []);

  return (
    <group>
      <mesh position={[0, -1, -9]}>
        <planeGeometry args={[46, 14]} />
        <meshBasicMaterial map={sky} toneMapped={false} fog={false} />
      </mesh>

      <mesh position={[0, 0.15, -7.4]}>
        <planeGeometry args={[44, 3.4]} />
        <meshBasicMaterial
          color="#2f86a2"
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      <Moon />

      {BUILDINGS.map((building) => {
        const height = building.top - BASE_Y;
        const centerY = (building.top + BASE_Y) / 2;
        const texture = facades[building.seed % FACADE_VARIANTS];
        if (!texture) return null;
        return (
          <group key={building.seed} position={[building.x, centerY, building.z]}>
            <mesh>
              <boxGeometry args={[building.width, height, building.depth]} />
              <meshStandardMaterial
                map={texture}
                emissive="#ffffff"
                emissiveMap={texture}
                emissiveIntensity={1.3}
                roughness={0.9}
                metalness={0}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, height / 2 + 0.01, 0]}>
              <boxGeometry args={[building.width * 1.04, 0.04, building.depth * 1.04]} />
              <meshStandardMaterial color="#080c12" roughness={0.95} metalness={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
