import { anodizedMetalMaterial, darkMetalMaterial, portMaterial } from "@/config/brand";

export const DESK_TOP_THICKNESS = 0.06;
export const DESK_LEG_HEIGHT = 0.7;
export const DESK_TOP_Y = DESK_LEG_HEIGHT + DESK_TOP_THICKNESS / 2;

export const METAL = darkMetalMaterial;
export const ANODIZED = anodizedMetalMaterial;
export const PORT = portMaterial;

export const CITY_WINDOW = {
  centerZ: -0.5,
  centerY: 2,
  width: 3,
  height: 3.2,
} as const;
