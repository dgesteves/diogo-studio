import type { Vec3 } from "../../types";

export const LOUNGE_ORIGIN = [3.6, 0, -0.9] as const satisfies Vec3;
export const LOUNGE_ROTATION_Y = 0;

export const SOFA_Z = 0.6;
export const TABLE_Z = -0.1;
export const CONSOLE_Z = -1.2;
export const TV_WALL_Z = -1.35;
export const TV_CENTER_Y = 1.5;

export const UPHOLSTERY = { color: "#16202a", roughness: 0.85, metalness: 0.05 } as const;
export const FRAME = { color: "#0c1116", roughness: 0.6, metalness: 0.35 } as const;
export const WOOD = { color: "#1a1410", roughness: 0.7, metalness: 0.1 } as const;
