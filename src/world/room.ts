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
/** Front to back. The chair is parked clear of the near edge, so it reads here too. */
export const DESK_DEPTH = 1.1;
/** The working surface: everything that sits on the desk stacks up from here. */
export const DESK_TOP_Y = DESK_LEG_HEIGHT + DESK_TOP_THICKNESS / 2;

const WALL_INSET = 0.03;
const CENTER_Z = 2.4;
const SPACING_Z = 0.78;

/** The plane a flat fixture on the back wall hangs on, clear of the shell so it never z-fights. */
export const BACK_WALL_Z = ROOM.minZ + WALL_INSET;

/**
 * The run of standing fixtures along the left wall, read front to back: the bookcase, the door
 * to /contact, and the snake plant the LAB station is anchored on. Three files place them and
 * three more frame or pick them, so the run lives here rather than as the same number typed
 * six times.
 *
 * The bookcase is measured off the front wall instead of authored, so it reads as built into
 * the corner rather than stopping a stride short of it, and widening the case moves it instead
 * of pushing it through the wall. The other two hold the spacing the run was composed with.
 */
export const BOOKCASE_SPAN = 1.14;
export const BOOKCASE_Z = ROOM.maxZ - BOOKCASE_SPAN / 2 - WALL_INSET;
export const CONTACT_DOOR_Z = 2.98;
export const LEFT_WALL_PLANT_Z = 2.1;

/**
 * The window is the rest of that wall: it runs from just short of the back wall to just short
 * of the plant, so the four fixtures on this wall read as one composition. Its near edge is
 * measured off the plant rather than authored, which is what keeps the two together when the
 * run moves along the wall — they drifted apart once already.
 */
const WINDOW_BACK_GAP = 0.3;
/** Air between the glass and the plant standing beside it, from the pot's center. */
const WINDOW_PLANT_GAP = 0.4;
const WINDOW_FAR_Z = ROOM.minZ + WINDOW_BACK_GAP;
const WINDOW_NEAR_Z = LEFT_WALL_PLANT_Z - WINDOW_PLANT_GAP;

export const CITY_WINDOW = {
  centerZ: (WINDOW_FAR_Z + WINDOW_NEAR_Z) / 2,
  centerY: 2,
  width: WINDOW_NEAR_Z - WINDOW_FAR_Z,
  height: 3.2,
} as const;

/**
 * The neon rule along the left wall. It fills the stretch the window and the bookcase leave
 * between them, so both ends are derived rather than authored: it is the piece that gives way
 * when either neighbor moves, and it ran straight across the glass the first time the window
 * was widened. The door standing in the middle of that stretch hides the rule inside its leaf,
 * which is why the line reads as two.
 */
const BOOKCASE_NEAR_Z = BOOKCASE_Z - BOOKCASE_SPAN / 2;

export const LEFT_WALL_RULE = {
  x: ROOM.minX + WALL_INSET,
  y: 1.7,
  centerZ: (WINDOW_NEAR_Z + BOOKCASE_NEAR_Z) / 2,
  length: BOOKCASE_NEAR_Z - WINDOW_NEAR_Z,
} as const;

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
