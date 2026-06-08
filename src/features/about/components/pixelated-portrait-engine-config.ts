import { brandColors } from "@/config/brand";

export const CELL_GAP = 1;
export const DISTURB_RADIUS_RATIO = 0.42;
export const REPEL_STRENGTH = 2.4;
export const SPRING_PULL = 0.1;
export const DAMPING = 0.82;
export const TINT_STRENGTH = 0.7;
export const AMBIENT_AMPLITUDE = 0.9;
export const AMBIENT_SPEED = 0.0015;

export type Pointer = { x: number; y: number; active: boolean };
type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export const TINT = hexToRgb(brandColors.accent);

export type PortraitEngineOptions = {
  src: string;
  cellSize: number;
  interactive: boolean;
  onLoaded?: () => void;
  onError?: () => void;
};
