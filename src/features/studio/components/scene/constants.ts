export const DESK_TOP_THICKNESS = 0.06;
export const DESK_LEG_HEIGHT = 0.7;
export const DESK_TOP_Y = DESK_LEG_HEIGHT + DESK_TOP_THICKNESS / 2;

export const METAL = { color: "#11161b", roughness: 0.5, metalness: 0.6 } as const;

export const LEFT_WALL = {
  x: -2.3,
  centerY: 3,
  width: 22,
  height: 10,
} as const;

export const CITY_WINDOW = {
  centerZ: -0.5,
  centerY: 2,
  width: 3,
  height: 3.2,
} as const;
