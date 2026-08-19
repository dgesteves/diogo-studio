/**
 * Where things are. Every dimension the room and its fixed furniture are built from, so a
 * mesh reads a named measurement rather than a number typed at the call site.
 *
 * Kept apart from `materials.ts` on purpose: these are the numbers a camera has to respect —
 * `utils/framing`, the explore bounds and the hotspot anchors all derive from `ROOM` — while
 * materials only decide how a surface looks.
 */
export const ROOM = {
  minX: -2.3,
  maxX: 5.4,
  minZ: -2.3,
  maxZ: 5,
  wallSpan: 22,
  wallHeight: 10,
  wallCenterY: 3,
  ceilingY: 3.8,
} as const;

export const DESK_TOP_THICKNESS = 0.06;
export const DESK_LEG_HEIGHT = 0.7;
/** The working surface: everything that sits on the desk stacks up from here. */
export const DESK_TOP_Y = DESK_LEG_HEIGHT + DESK_TOP_THICKNESS / 2;

export const CITY_WINDOW = {
  centerZ: -0.5,
  centerY: 2,
  width: 3,
  height: 3.2,
} as const;

const WALL_INSET = 0.03;
const CENTER_Z = 2.4;
const SPACING_Z = 0.78;

/** The plane a flat fixture on the back wall hangs on, clear of the shell so it never z-fights. */
export const BACK_WALL_Z = ROOM.minZ + WALL_INSET;

/**
 * The ceiling of the band the floating shelves hang in: the monitors take the wall below it
 * and the sign's subtitle sits just above. It was the y of a neon rule under the sign until
 * that rule was removed, which is why `scene/shelving` is now its only reader.
 */
export const SHELF_BAND_TOP_Y = 2.1;

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
