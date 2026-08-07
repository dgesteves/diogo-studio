import { ROOM } from "@/constants/room";

const WALL_INSET = 0.03;
const CENTER_Z = 2.4;
const SPACING_Z = 0.78;

/**
 * The screens hang on the right wall, so their panels face -x and the row runs
 * along z — starting just past the lounge sofa and reading left-to-right for
 * anyone standing in front of them.
 */
export const WALL_SCREEN = {
  x: ROOM.maxX - WALL_INSET,
  y: 1.5,
  centerZ: CENTER_Z,
  width: 0.5,
  height: 0.66,
  rotationY: -Math.PI / 2,
} as const;

export const WALL_SCREEN_Z = {
  resume: CENTER_Z - SPACING_Z * 2,
  timeline: CENTER_Z - SPACING_Z,
  principles: CENTER_Z,
  stack: CENTER_Z + SPACING_Z,
  playground: CENTER_Z + SPACING_Z * 2,
} as const;

export type WallScreenSlug = keyof typeof WALL_SCREEN_Z;
