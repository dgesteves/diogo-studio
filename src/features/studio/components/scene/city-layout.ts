import { mulberry32 } from "./city-textures";

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
export const FACADE_VARIANTS = 5;

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

export const CITY_BUILDINGS: BuildingInstance[] = buildCity().map((building): BuildingInstance => {
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
