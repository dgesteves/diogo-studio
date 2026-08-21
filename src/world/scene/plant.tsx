"use client";

import { type ReactElement } from "react";
import { DoubleSide, Vector3 } from "three";
import { useDisposable } from "../gpu";
import { worldColors } from "../materials";
import { mulberry32 } from "../random";
import { type Vec3 } from "../stations";
import { createShell, sampleCurve, smoothStep, type Knot, type Sheet } from "./shell";

/**
 * Every plant in the room. Four of them, and no two the same species, because they are in four
 * different places and a room that repeats one houseplant reads as a room that owns one asset.
 * The pots go the other way: one terracotta at four sizes, so the four read as one person's
 * plants rather than four things bought separately.
 *
 * They are built from two shapes and nothing else: a **blade**, which is one parametric sheet
 * carrying its own stalk, and a **stem**, which is a tube swept down a path. A rubber plant is
 * three stems with broad blades up them; a snake plant is blades and no stem at all; a pothos
 * is stems that fall off a shelf with small blades along them; an aloe is a rosette of short
 * ones. What changes between them is a table of measurements, not a modeling technique.
 *
 * The reason for sheets rather than the clumped icosahedra these replaced: a clump is a fine
 * plant at 6 cm and an obviously fake one at anything larger, and three of these four are read
 * from across the room. `scene/chair.tsx` builds its stretched panels the same way and
 * `createShell` in `scene/shell.ts` is the primitive both share.
 */

const TAU = Math.PI * 2;
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

/* ---------------------------------------------------------------- the stem */

/** A tube swept down a path. `radius` is free to close it to a point at either end. */
type Stem = {
  path: (u: number) => Vector3;
  radius: (u: number) => number;
  segments: number;
  sides: number;
};

const TANGENT_STEP = 1e-3;

function tangentOf(stem: Stem, u: number): Vector3 {
  const ahead = stem.path(Math.min(u + TANGENT_STEP, 1));
  const behind = stem.path(Math.max(u - TANGENT_STEP, 0));
  return ahead.sub(behind).normalize();
}

/**
 * A ring perpendicular to the path rather than a horizontal one: a pothos vine turns past
 * horizontal on its way over the shelf edge, and a horizontal ring collapses to a line there.
 *
 * The frame is right-handed on purpose — `createShell` takes its winding from the sheet's own
 * u × v, so `normal × binormal = tangent` is what puts the tube's normals on the outside. A
 * stem wound the other way renders as a stem-shaped hole and throws nothing.
 */
function stemSheet(stem: Stem): Sheet {
  return {
    rows: stem.segments,
    columns: stem.sides,
    point: (u, v) => {
      const tangent = tangentOf(stem, u);
      // Any axis the tangent is not already parallel to; a parallel one has no cross product.
      const reference = Math.abs(tangent.y) > 0.9 ? X_AXIS : Y_AXIS;
      const binormal = new Vector3().crossVectors(tangent, reference).normalize();
      const normal = new Vector3().crossVectors(binormal, tangent);
      const angle = v * TAU;
      const radius = stem.radius(u);

      return stem
        .path(u)
        .addScaledVector(normal, Math.cos(angle) * radius)
        .addScaledVector(binormal, Math.sin(angle) * radius);
    },
  };
}

/* --------------------------------------------------------------- the blade */

/**
 * A species' leaf, in fractions of its own length: how wide it is along that length, how its
 * midrib rises and falls, and how far the edges ride above that midrib.
 */
type BladeProfile = {
  /** Half the blade's width. The first fifth is the petiole, thin enough to read as a stalk. */
  width: readonly Knot[];
  /** The midrib's own arc, before the blade is pitched up off its stem. */
  droop: readonly Knot[];
  /** As a fraction of the local half-width, so the trough closes as the blade comes to a point. */
  cup: number;
  rows: number;
  columns: number;
};

type Blade = {
  profile: BladeProfile;
  /** Where the petiole starts. */
  anchor: Vector3;
  length: number;
  /** Which way the blade points, measured about the vertical. */
  yaw: number;
  /** How far its base is raised off horizontal. */
  pitch: number;
  /** The twist along its own axis that keeps no two blades parallel. */
  roll: number;
};

function bladeSheet(blade: Blade): Sheet {
  const { profile } = blade;

  return {
    rows: profile.rows,
    columns: profile.columns,
    clusterRows: true,
    point: (u, v) => {
      const across = v * 2 - 1;
      const halfWidth = sampleCurve(profile.width, u) * blade.length;
      const cup = profile.cup * halfWidth * smoothStep(0.14, 0.42, u);

      return new Vector3(
        u * blade.length,
        sampleCurve(profile.droop, u) * blade.length + cup * across * across,
        across * halfWidth,
      )
        .applyAxisAngle(X_AXIS, blade.roll)
        .applyAxisAngle(Z_AXIS, blade.pitch)
        .applyAxisAngle(Y_AXIS, blade.yaw)
        .add(blade.anchor);
    },
  };
}

/** The blade a rubber plant carries: broad, blunt, and heavy enough to tip at the end. */
const RUBBER_BLADE: BladeProfile = {
  width: [
    [0, 0.014],
    [0.16, 0.022],
    [0.27, 0.17],
    [0.52, 0.265],
    [0.74, 0.25],
    [0.9, 0.15],
    [0.97, 0.06],
    [1, 0],
  ],
  droop: [
    [0, 0],
    [0.22, 0.06],
    [0.5, 0.055],
    [0.78, -0.02],
    [1, -0.13],
  ],
  cup: 0.32,
  rows: 9,
  columns: 7,
};

/** A snake plant's: near-parallel edges the whole way, a sharp tip, folded down the midrib. */
const SPEAR_BLADE: BladeProfile = {
  width: [
    [0, 0.022],
    [0.12, 0.068],
    [0.4, 0.082],
    [0.75, 0.07],
    [0.93, 0.032],
    [1, 0],
  ],
  droop: [
    [0, 0],
    [0.55, -0.03],
    [1, -0.16],
  ],
  cup: 0.55,
  rows: 10,
  columns: 5,
};

/** A pothos leaf: wide where the stalk meets it, drawn to a point, and hanging off its vine. */
const HEART_BLADE: BladeProfile = {
  width: [
    [0, 0.02],
    [0.18, 0.05],
    [0.3, 0.36],
    [0.5, 0.38],
    [0.72, 0.28],
    [0.9, 0.14],
    [1, 0],
  ],
  droop: [
    [0, 0],
    [0.3, 0.02],
    [1, -0.2],
  ],
  cup: 0.3,
  rows: 7,
  columns: 6,
};

/** An aloe's: short, fat at the base and tapering the whole way, held in a stiff rosette. */
const ROSETTE_BLADE: BladeProfile = {
  width: [
    [0, 0.1],
    [0.25, 0.115],
    [0.6, 0.08],
    [0.88, 0.035],
    [1, 0],
  ],
  droop: [
    [0, 0],
    [0.6, -0.06],
    [1, -0.24],
  ],
  cup: 0.45,
  rows: 8,
  columns: 5,
};

/**
 * Leaves climb a stem on a fixed turn rather than a random bearing, which is the only thing
 * that reliably stops two of them growing into the same piece of air.
 *
 * It has to be the golden angle and not a tidy fraction near it. Two-fifths of a turn was the
 * first try and it is a ratio real plants use, but 2/5 closes after five leaves: every blade
 * landed on one of five bearings, so the snake plant was a five-pointed star that read as a
 * clump from five angles and as a flat sheaf from the five between them. The golden angle
 * never closes, so no two blades share a bearing however many there are.
 */
const PHYLLOTAXIS = Math.PI * (3 - Math.sqrt(5));

/* ------------------------------------------------------------------ the pot */

const SOIL = { color: "#0c0805", roughness: 1, metalness: 0 } as const;
const TERRACOTTA = { color: "#2a1c11", roughness: 0.85, metalness: 0.05 } as const;
const TERRACOTTA_RIM = { color: "#3a261a", roughness: 0.85, metalness: 0.05 } as const;

/**
 * Every plant in the room is in the same pot at a different size: one terracotta, one taper,
 * one rolled rim. Four vessels in four finishes read as four assets that happened to end up in
 * one room; one vessel at four sizes reads as somebody's collection.
 */
type Pot = { radius: number; height: number; segments: number };

/** How much narrower the foot is than the mouth. */
const POT_TAPER = 0.8;
/**
 * Both as fractions of the radius, so a pot is the one shape scaled rather than four shapes
 * that have to be re-tuned together every time the family changes.
 */
const RIM_TUBE = 0.055;
const SOIL_DROP = 0.13;

export const RUBBER_POT: Pot = { radius: 0.25, height: 0.44, segments: 24 };
export const SNAKE_POT: Pot = { radius: 0.19, height: 0.34, segments: 22 };
const ALOE_POT: Pot = { radius: 0.055, height: 0.1, segments: 20 };
const POTHOS_POT: Pot = { radius: 0.046, height: 0.07, segments: 18 };

/** The soil's surface: what everything planted in a pot grows out of. */
export function soilTop(pot: Pot): number {
  return pot.height - pot.radius * SOIL_DROP;
}

function Planter({ pot }: { pot: Pot }): ReactElement {
  const rim = pot.radius * RIM_TUBE;

  return (
    <>
      <mesh position={[0, pot.height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pot.radius, pot.radius * POT_TAPER, pot.height, pot.segments]} />
        <meshStandardMaterial {...TERRACOTTA} />
      </mesh>
      <mesh position={[0, pot.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[pot.radius, rim, 8, pot.segments]} />
        <meshStandardMaterial {...TERRACOTTA_RIM} />
      </mesh>
      <mesh position={[0, soilTop(pot) - rim, 0]}>
        <cylinderGeometry args={[pot.radius - rim, pot.radius - rim, rim * 2, pot.segments]} />
        <meshStandardMaterial {...SOIL} />
      </mesh>
    </>
  );
}

/* --------------------------------------------------------- the rubber plant */

/** The canes start below the soil line, so no cane ever shows an open end. */
const CANE_BASE_Y = soilTop(RUBBER_POT) - 0.05;

type Cane = {
  /** Where the cane leaves the soil, relative to the pot's center. */
  base: readonly [x: number, z: number];
  /** How far the tip has wandered from that base by the time it gets there. */
  lean: readonly [x: number, z: number];
  height: number;
  radius: number;
  leaves: number;
  seed: number;
};

const CANES: readonly Cane[] = [
  { base: [-0.05, 0.02], lean: [-0.13, 0.09], height: 1.24, radius: 0.03, leaves: 10, seed: 4817 },
  { base: [0.07, -0.05], lean: [0.12, 0.05], height: 1.0, radius: 0.026, leaves: 8, seed: 9231 },
  { base: [0.0, 0.08], lean: [0.03, 0.14], height: 0.72, radius: 0.022, leaves: 6, seed: 2605 },
];

/**
 * A cane stands up before it leans: `u²` keeps it vertical where it leaves the soil, which is
 * what stops three stems from reading as three wires splayed out of one point.
 */
function caneStem(cane: Cane): Stem {
  return {
    segments: 14,
    sides: 8,
    path: (u) =>
      new Vector3(
        cane.base[0] + cane.lean[0] * u * u,
        CANE_BASE_Y + cane.height * u,
        cane.base[1] + cane.lean[1] * u * u,
      ),
    // Thick where it is carrying the plant, closed to a point at the growing tip.
    radius: (u) => cane.radius * (1 - 0.62 * u) * (1 - smoothStep(0.94, 1, u)),
  };
}

/** Where the lowest leaf on a cane sits, as a fraction of its height. */
const FIRST_LEAF_U = 0.26;

function caneBlades(cane: Cane): readonly Blade[] {
  const random = mulberry32(cane.seed);
  const stem = caneStem(cane);
  const blades: Blade[] = [];

  for (let index = 0; index < cane.leaves; index += 1) {
    // Half a step in from either end: the last leaf stays off the point the cane closes to,
    // where there is no stem left to grow out of.
    const step = (index + 0.5) / cane.leaves;
    // Jittered, or the leaves read as rungs on a ladder from either flank.
    const u = FIRST_LEAF_U + (1 - FIRST_LEAF_U) * step + (random() - 0.5) * 0.06;
    const center = stem.path(u);
    const yaw = cane.seed + index * PHYLLOTAXIS + random() * 0.3;
    // Just inside the cane rather than on its axis, so a petiole leaves the wood at the side
    // it points from and no blade is left bridging a gap to the stem.
    const radius = stem.radius(u) * 0.85;

    blades.push({
      profile: RUBBER_BLADE,
      anchor: new Vector3(
        center.x + Math.cos(-yaw) * radius,
        center.y,
        center.z + Math.sin(-yaw) * radius,
      ),
      length: 0.26 + random() * 0.13,
      yaw,
      // The crown holds its leaves up; the older ones below it have given up on that.
      pitch: 0.62 * step - 0.16 + random() * 0.16,
      roll: (random() - 0.5) * 0.5,
    });
  }

  return blades;
}

export function rubberStemSheets(): readonly Sheet[] {
  return CANES.map((cane) => stemSheet(caneStem(cane)));
}

export function rubberBladeSheets(): readonly Sheet[] {
  return CANES.flatMap((cane) => caneBlades(cane).map(bladeSheet));
}

/* ---------------------------------------------------------- the snake plant */

const SNAKE_BLADES = 21;
const SNAKE_SEED = 7741;

/**
 * A clump, not the flat fan a real sansevieria grows in. The fan was authentic and wrong for
 * this room: a plane of blades all leaning one way reads as a plant from the two bearings that
 * face it and as a swept-up pile of leaves from every other, and this plant is passed on three
 * sides — the door, the desk, and anyone walking the room in explore mode.
 *
 * So the blades climb the same turn that leaves climb a stem, and how far a blade leans out is
 * how far out of the middle it started rather than which way it happens to point. Every bearing
 * then sees blades leaning toward it, away from it and across it, which is what a clump is.
 */
function snakeBlades(): readonly Blade[] {
  const random = mulberry32(SNAKE_SEED);
  const blades: Blade[] = [];

  for (let index = 0; index < SNAKE_BLADES; index += 1) {
    // 0 in the crown, 1 at the rim.
    const out = (index + 0.5) / SNAKE_BLADES;
    const yaw = index * PHYLLOTAXIS + (random() - 0.5) * 0.35;
    const spread = 0.016 + out * 0.055;

    blades.push({
      profile: SPEAR_BLADE,
      anchor: new Vector3(
        Math.cos(-yaw) * spread,
        soilTop(SNAKE_POT) - 0.02,
        Math.sin(-yaw) * spread,
      ),
      // Tall in the middle, short at the rim: the clump reads as one plant, not a bundle.
      length: 0.5 + (1 - out) * 0.38 + random() * 0.09,
      // The crown stands up and the rim leans out. Spread in yaw alone would not show —
      // turning a vertical blade about the vertical only spins it where it stands.
      //
      // How far the rim may lean is bounded by the corner this plant stands in rather than by
      // taste: it is half a meter off the left wall, and a blade that crosses that plane is
      // not clipped by anything, it simply vanishes into a wall with no other side.
      pitch: Math.PI / 2 - 0.04 - out * 0.46 - random() * 0.1,
      yaw,
      roll: (random() - 0.5) * 0.6,
    });
  }

  return blades;
}

export function snakeBladeSheets(): readonly Sheet[] {
  return snakeBlades().map(bladeSheet);
}

/* -------------------------------------------------------------- the pothos */

/**
 * The shelf is on the back wall, so a vine has one hemisphere to fall into. Bearings are
 * measured off straight-out-into-the-room rather than off the x axis, which is what keeps a
 * vine from being aimed at the wall by a sign nobody checked.
 */
const VINE_FACING = -Math.PI / 2;
const VINE_SPREAD = 1.2;

type Vine = {
  /** Which way the vine sets off, as a fraction of a half turn either side of the room. */
  bearing: number;
  /** How high it arches before its own weight takes it over the edge. */
  arch: number;
  /** How far out it has travelled by the time it is falling. */
  reach: number;
  /** How far below the shelf it hangs. */
  fall: number;
  leaves: number;
  seed: number;
};

const VINES: readonly Vine[] = [
  { bearing: 0.55, arch: 0.05, reach: 0.15, fall: 0.26, leaves: 8, seed: 3301 },
  { bearing: -0.15, arch: 0.07, reach: 0.12, fall: 0.2, leaves: 7, seed: 8123 },
  { bearing: -0.8, arch: 0.04, reach: 0.13, fall: 0.13, leaves: 6, seed: 5507 },
  { bearing: 0.95, arch: 0.09, reach: 0.07, fall: 0, leaves: 5, seed: 6449 },
  { bearing: 0.05, arch: 0.11, reach: 0.05, fall: 0, leaves: 4, seed: 1861 },
];

function vineYaw(vine: Vine): number {
  return VINE_FACING + vine.bearing * VINE_SPREAD;
}

/**
 * Up, over, and down: the arch is spent in the first third and the rest is the fall, which is
 * what makes a trailing plant read as trailing rather than as a stem pointing at the floor.
 * `reach` carries it clear of the plank it is hanging off before any of that happens.
 */
function vineStem(vine: Vine): Stem {
  const yaw = vineYaw(vine);
  const out = new Vector3(Math.cos(-yaw), 0, Math.sin(-yaw));

  return {
    segments: 16,
    sides: 6,
    path: (u) =>
      out
        .clone()
        .multiplyScalar(vine.reach * Math.sin((u * Math.PI) / 2))
        // The arch is spent by the end rather than subtracted from the fall, so `fall` is how
        // far below the shelf the vine actually finishes.
        .setY(soilTop(POTHOS_POT) + vine.arch * Math.sin(u * Math.PI) - vine.fall * u * u * u),
    radius: (u) => 0.004 * (1 - 0.4 * u) * (1 - smoothStep(0.92, 1, u)),
  };
}

/**
 * A leaf takes the next bearing on the spiral, mirrored back into the room if that bearing
 * would have sent it into the wall the shelf is fixed to. Reflected rather than clamped: a row
 * of leaves folded onto one bearing is the other way this goes wrong, and a mirror keeps every
 * leaf's spread while costing it only its side.
 */
function roomward(yaw: number): number {
  return Math.sin(yaw) > 0 ? -yaw : yaw;
}

function vineBlades(vine: Vine): readonly Blade[] {
  const random = mulberry32(vine.seed);
  const stem = vineStem(vine);
  const blades: Blade[] = [];

  for (let index = 0; index < vine.leaves; index += 1) {
    const u = (index + 0.6) / (vine.leaves + 0.2);
    const anchor = stem.path(u);
    const yaw = roomward(vineYaw(vine) + index * PHYLLOTAXIS + random() * 0.4);

    blades.push({
      profile: HEART_BLADE,
      anchor,
      length: 0.05 + random() * 0.028,
      yaw,
      // Held out near the crown, hanging by the time the vine is falling.
      pitch: 0.35 - u * 1.1 + random() * 0.2,
      roll: (random() - 0.5) * 0.7,
    });
  }

  return blades;
}

export function pothosStemSheets(): readonly Sheet[] {
  return VINES.map((vine) => stemSheet(vineStem(vine)));
}

export function pothosBladeSheets(): readonly Sheet[] {
  return VINES.flatMap((vine) => vineBlades(vine).map(bladeSheet));
}

/* ---------------------------------------------------------------- the aloe */

const ALOE_BLADES = 11;
const ALOE_SEED = 1279;

/** A rosette: every blade leaves the same crown, and the outer ones have fallen furthest open. */
function aloeBlades(): readonly Blade[] {
  const random = mulberry32(ALOE_SEED);
  const blades: Blade[] = [];

  for (let index = 0; index < ALOE_BLADES; index += 1) {
    const step = index / ALOE_BLADES;
    const yaw = index * PHYLLOTAXIS + random() * 0.2;
    const spread = 0.004 + step * 0.008;

    blades.push({
      profile: ROSETTE_BLADE,
      anchor: new Vector3(Math.cos(-yaw) * spread, soilTop(ALOE_POT), Math.sin(-yaw) * spread),
      length: 0.072 + (1 - step) * 0.052 + random() * 0.014,
      // The oldest blade is nearly flat; each newer one stands closer to upright.
      pitch: 0.3 + (1 - step) * 1.12 + random() * 0.12,
      yaw,
      roll: (random() - 0.5) * 0.4,
    });
  }

  return blades;
}

export function aloeBladeSheets(): readonly Sheet[] {
  return aloeBlades().map(bladeSheet);
}

/* ------------------------------------------------------------------ growth */

const CANE_WOOD = { color: "#26362c", roughness: 0.8, metalness: 0.05 } as const;
const VINE_WOOD = { color: "#2f4a35", roughness: 0.75, metalness: 0.05 } as const;

/** One green per species. A room whose four plants share a leaf color reads as one plant. */
const RUBBER_GREEN = { color: worldColors.foliage, roughness: 0.52, metalness: 0.03 } as const;
const SNAKE_GREEN = { color: "#2f5f3a", roughness: 0.62, metalness: 0.02 } as const;
const POTHOS_GREEN = { color: "#3c8a4f", roughness: 0.5, metalness: 0.03 } as const;
const ALOE_GREEN = { color: "#3d7a5c", roughness: 0.45, metalness: 0.04 } as const;

type FoliageProps = {
  stems?: readonly Sheet[];
  stemMaterial?: { color: string; roughness: number; metalness: number };
  blades: readonly Sheet[];
  bladeMaterial: { color: string; roughness: number; metalness: number };
};

/**
 * A plant is two draw calls: every stem skinned into one geometry and every blade into another.
 * A blade has no thickness, so the underside of a leaf is the same sheet seen from behind.
 */
function Foliage({ stems, stemMaterial, blades, bladeMaterial }: FoliageProps): ReactElement {
  const parts = useDisposable(() => ({
    stems: stems ? createShell(stems) : undefined,
    blades: createShell(blades),
  }));

  return (
    <>
      {parts.stems ? (
        <mesh geometry={parts.stems} castShadow>
          <meshStandardMaterial {...stemMaterial} />
        </mesh>
      ) : null}
      <mesh geometry={parts.blades} castShadow>
        <meshStandardMaterial {...bladeMaterial} side={DoubleSide} />
      </mesh>
    </>
  );
}

/* ----------------------------------------------------------------- the four */

/** The big one, on the back wall. `scene/props.tsx` decides which stretch of it. */
export function RubberPlant({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position}>
      <Planter pot={RUBBER_POT} />
      <Foliage
        stems={rubberStemSheets()}
        stemMaterial={CANE_WOOD}
        blades={rubberBladeSheets()}
        bladeMaterial={RUBBER_GREEN}
      />
    </group>
  );
}

/**
 * Beside the door, and the object the LAB station is anchored on. A snake plant because it is
 * the one houseplant whose silhouette survives being a meter from a doorway in the dark: all
 * vertical, all edge, and nothing that reads as a blob at any distance.
 */
export function SnakePlant({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position}>
      <Planter pot={SNAKE_POT} />
      <Foliage blades={snakeBladeSheets()} bladeMaterial={SNAKE_GREEN} />
    </group>
  );
}

/**
 * On a floating shelf, where the only interesting thing a plant can do is fall off the front of
 * it. The vines hang clear of the plank below rather than through it, which is the whole reason
 * they reach outward before they drop.
 */
export function Pothos({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position}>
      <Planter pot={POTHOS_POT} />
      <Foliage
        stems={pothosStemSheets()}
        stemMaterial={VINE_WOOD}
        blades={pothosBladeSheets()}
        bladeMaterial={POTHOS_GREEN}
      />
    </group>
  );
}

/**
 * On the desk, at 20 cm the smallest of the four and the one seen from closest. An aloe is a
 * rosette, so it is the one plant here that has no stem at all and still reads as a plant from
 * directly above — which is the angle a desk plant is mostly seen from.
 */
export function Aloe({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position}>
      <Planter pot={ALOE_POT} />
      <Foliage blades={aloeBladeSheets()} bladeMaterial={ALOE_GREEN} />
    </group>
  );
}
