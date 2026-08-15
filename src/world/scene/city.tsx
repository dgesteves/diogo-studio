"use client";

import { type ReactElement } from "react";
import { Instance, Instances } from "@react-three/drei";
import { type CanvasTexture, AdditiveBlending } from "three";
import { useDisposable } from "@/hooks/use-disposable";
import { mulberry32 } from "@/utils/mulberry32";
import { worldColors, frameMaterial } from "../materials";
import { CITY_WINDOW, ROOM } from "../room";
import { createCanvasTexture } from "../screens/texture";
import { Moon } from "./moon";

/**
 * What is outside the window: the frame itself, the skyline behind it, and the two canvas
 * textures that light the buildings. The skyline is seeded (`mulberry32`) rather than random,
 * so the same city renders every time and the texture snapshots stay meaningful.
 *
 * The moon is its own file — it is drawn on its own texture and does not move with the city.
 */

type Building = {
  x: number;
  z: number;
  width: number;
  depth: number;
  top: number;
  seed: number;
};

type BuildingInstance = {
  seed: number;
  variant: number;
  position: [number, number, number];
  scale: [number, number, number];
  capPosition: [number, number, number];
  capScale: [number, number, number];
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

const CITY_BUILDINGS: BuildingInstance[] = buildCity().map((building): BuildingInstance => {
  const height = building.top - BASE_Y;
  const centerY = (building.top + BASE_Y) / 2;
  return {
    seed: building.seed,
    variant: building.seed % FACADE_VARIANTS,
    position: [building.x, centerY, building.z],
    scale: [building.width, height, building.depth],
    capPosition: [building.x, centerY + height / 2 + 0.01, building.z],
    capScale: [building.width * 1.04, 0.04, building.depth * 1.04],
  };
});

const LIT_WINDOW_COLORS = ["#22d3ee", "#67e8f9", "#7dd3fc", "#fbbf24", "#f6efe1"] as const;
const FACADE_BASE = "#070b10";
const FACADE_WIDTH = 128;
const FACADE_HEIGHT = 256;

export function createCityFacadeTexture(seed: number): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(FACADE_WIDTH, FACADE_HEIGHT);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(seed);
  ctx.fillStyle = FACADE_BASE;
  ctx.fillRect(0, 0, FACADE_WIDTH, FACADE_HEIGHT);

  const cols = 5;
  const rows = 18;
  const padding = 8;
  const cellW = (FACADE_WIDTH - padding * 2) / cols;
  const cellH = (FACADE_HEIGHT - padding * 2) / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (rand() < 0.28) continue;
      const color = LIT_WINDOW_COLORS[Math.floor(rand() * LIT_WINDOW_COLORS.length)] ?? "#22d3ee";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55 + rand() * 0.45;
      const x = padding + col * cellW + cellW * 0.16;
      const y = padding + row * cellH + cellH * 0.16;
      ctx.fillRect(x, y, cellW * 0.68, cellH * 0.52);
    }
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

export function createSkyTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(64, 256);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#02040a");
  gradient.addColorStop(0.3, "#081521");
  gradient.addColorStop(0.42, "#16415a");
  gradient.addColorStop(0.49, "#3a92ad");
  gradient.addColorStop(0.56, "#1a4a5e");
  gradient.addColorStop(0.74, "#0a1c28");
  gradient.addColorStop(1, "#04080d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 256);

  const rand = mulberry32(7);
  ctx.fillStyle = "#cfe8f2";
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * 64;
    const y = rand() * 110;
    ctx.globalAlpha = 0.3 + rand() * 0.6;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

function Cityscape(): ReactElement {
  const facades = useDisposable(() =>
    Array.from({ length: FACADE_VARIANTS }, (_, i) => createCityFacadeTexture(100 + i)),
  );
  const sky = useDisposable(() => createSkyTexture());

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

      {facades.map((texture, variant) => {
        const group = CITY_BUILDINGS.filter((building) => building.variant === variant);
        if (!texture || group.length === 0) return null;
        return (
          <Instances key={variant} limit={group.length} range={group.length} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={texture}
              emissive="#ffffff"
              emissiveMap={texture}
              emissiveIntensity={1.3}
              roughness={0.9}
              metalness={0}
              toneMapped={false}
            />
            {group.map((building) => (
              <Instance key={building.seed} position={building.position} scale={building.scale} />
            ))}
          </Instances>
        );
      })}

      <Instances limit={CITY_BUILDINGS.length} range={CITY_BUILDINGS.length} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#080c12" roughness={0.95} metalness={0.1} />
        {CITY_BUILDINGS.map((building) => (
          <Instance key={building.seed} position={building.capPosition} scale={building.capScale} />
        ))}
      </Instances>
    </group>
  );
}

const W = CITY_WINDOW.width;
const H = CITY_WINDOW.height;
const FRAME = 0.07;
const FRAME_DEPTH = 0.14;
const MULLION = 0.035;

type Bar = { size: [number, number, number]; position: [number, number, number] };

const FRAME_BARS: Bar[] = [
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, H / 2 + FRAME / 2, 0] },
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, -H / 2 - FRAME / 2, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [-W / 2 - FRAME / 2, 0, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [W / 2 + FRAME / 2, 0, 0] },
];

const MULLION_BARS: Bar[] = [
  { size: [MULLION, H, MULLION * 1.6], position: [-W / 4, 0, 0] },
  { size: [MULLION, H, MULLION * 1.6], position: [W / 4, 0, 0] },
  { size: [W, MULLION, MULLION * 1.6], position: [0, 0, 0] },
];

export function CityWindow(): ReactElement {
  return (
    <group
      position={[ROOM.minX, CITY_WINDOW.centerY, CITY_WINDOW.centerZ]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <Cityscape />

      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          color={worldColors.accent}
          transparent
          opacity={0.05}
          roughness={0.08}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {[...FRAME_BARS, ...MULLION_BARS].map((bar) => (
        <mesh key={`${bar.position.join(",")}:${bar.size.join(",")}`} position={bar.position}>
          <boxGeometry args={bar.size} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      ))}

      <mesh position={[0, -H / 2 - FRAME / 2, FRAME_DEPTH / 2]}>
        <boxGeometry args={[W, 0.012, 0.012]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>

      <pointLight position={[0, 0.1, 0.6]} intensity={0.5} distance={5} decay={2} color="#bfe9ff" />
    </group>
  );
}
