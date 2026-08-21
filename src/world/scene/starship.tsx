"use client";

import { type ReactElement } from "react";
import { DoubleSide, Vector2 } from "three";
import { darkMetalMaterial, frameMaterial } from "../materials";
import { type Vec3 } from "../stations";

/**
 * Desk models of the two Starship stages, standing side by side on the bottom floating shelf
 * rather than stacked. Unstacked, the tallest piece is the 71 m booster instead of the 123 m
 * full stack, which buys the pair about 70% more hull at the same shelf clearance — the whole
 * reason they are apart.
 *
 * Every dimension below is in **meters of the real vehicle**, and both models are scaled by
 * the same `SCALE` at their group. That is what makes the proportions checkable — a 9 m hull
 * under a 71 m booster is a number anyone can look up, where the same shape authored in shelf
 * units is fifteen magic numbers nobody can argue with — and it is what keeps the two reading
 * as one matched set rather than two unrelated toys.
 *
 * The generation modeled is the current one: an integrated hot-stage ring at the top of the
 * booster, three grid fins rather than four, and the smaller forward flaps moved leeward.
 */

const HULL_RADIUS = 4.5;
const BOOSTER_HEIGHT = 71;
const SHIP_HEIGHT = 52;
const NOSE_HEIGHT = 18;
const SHIP_BARREL_HEIGHT = SHIP_HEIGHT - NOSE_HEIGHT;
export const STACK_HEIGHT = BOOSTER_HEIGHT + SHIP_HEIGHT;

const SKIRT_HEIGHT = 3;

/**
 * The vented ring at the top of the booster. On the real one it is an open lattice of
 * triangles; at this size that resolves to a band, so it is built as a bright ring standing
 * proud of the hull over a dark gap, which is what the lattice reads as from across a room.
 */
const HOT_STAGE_HEIGHT = 3.4;
const HOT_STAGE_RADIUS = HULL_RADIUS + 0.35;
const HOT_STAGE_GAP = 1.2;

/** The engine end: a dark thrust section under a ring of bells, both wider than the hull. */
const ENGINE_RING_HEIGHT = 2.2;
const ENGINE_RING_RADIUS = HULL_RADIUS + 0.25;

/**
 * The four raised panels down the lower half of the booster. They are what stops the barrel
 * reading as a plain tube, and they are the most visible thing about the aft end at this size.
 */
const CHINE_BASE = 4;
const CHINE_HEIGHT = 26;
const CHINE_SIZE: Vec3 = [1.4, CHINE_HEIGHT, 3.6];
const CHINE_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

const STAND_HEIGHT = 1.6;
const STAND_RADIUS = 7.5;

/** The taller of the two, and so the one the shelf's clear height is spent on. */
export const BOOSTER_MODEL_HEIGHT = 0.46;
const SCALE = BOOSTER_MODEL_HEIGHT / (STAND_HEIGHT + BOOSTER_HEIGHT);
/** Not authored: the ship is shorter because the real one is, at the same scale. */
export const SHIP_MODEL_HEIGHT = (STAND_HEIGHT + SHIP_HEIGHT) * SCALE;

/**
 * The tiled windward half of the hull. Where the band starts is aimed at the room in its own
 * right rather than by turning the whole model: the two want opposite things, so `SHIP_YAW`
 * sets the silhouette and this offset carries the seam back to where the yaw used to put it.
 */
const TILE_STANDOFF = 0.09;
const TILE_ORIENT = -0.35;
const TILE_START = -Math.PI / 2 + TILE_ORIENT;
const TILE_SWEEP = Math.PI;

/**
 * Turned on its stand, but barely. Past about a quarter turn one flap pair swings behind the
 * hull and the ship reads as a lumpy cone rather than a vehicle; this is the most it takes to
 * be off-square without losing the second pair. The tiles used to be aimed by turning the
 * model further, which is what cost the flaps — `TILE_ORIENT` aims them now.
 */
const SHIP_YAW = -0.25;

const STAINLESS = { color: "#c2ccd4", roughness: 0.3, metalness: 0.85 } as const;
/** Tiles read as a lit mid-gray, not as shadow: near-black turned the ship into a silhouette. */
const TILES = { color: "#41484e", roughness: 0.95, metalness: 0.04 } as const;
/**
 * Flaps and grid fins are dark on the real vehicles and were invisible here: a thin dark plate
 * against an unlit room is the room, and against the ship's own tiled gray it is the ship.
 * They are lit metal instead — the parts that carry the silhouette have to be the parts that
 * read against what is behind them.
 */
const GUNMETAL = { color: "#9aa4ac", roughness: 0.4, metalness: 0.7 } as const;

const RADIAL_SEGMENTS = 24;
const NOSE_SEGMENTS = 9;

/**
 * The ship's outline, revolved rather than stacked out of a cylinder and a cone: the nose is
 * an ogive that meets the barrel tangentially and rounds off at the tip, and a cone meeting a
 * cylinder at a hard corner is the single thing that most stops a model reading as Starship.
 */
const HULL_PROFILE: readonly Vector2[] = [
  new Vector2(0, 0),
  new Vector2(HULL_RADIUS, 0),
  new Vector2(HULL_RADIUS, SHIP_BARREL_HEIGHT),
  ...Array.from({ length: NOSE_SEGMENTS }, (_, index) => {
    const t = (index + 1) / NOSE_SEGMENTS;

    return new Vector2(HULL_RADIUS * Math.sqrt(1 - t * t), SHIP_BARREL_HEIGHT + NOSE_HEIGHT * t);
  }),
];

/** The same outline standing off the hull, minus the closed ends a shell has no use for. */
const TILE_PROFILE: readonly Vector2[] = HULL_PROFILE.filter((point) => point.x > 0).map(
  (point) => new Vector2(point.x + TILE_STANDOFF, point.y),
);

export type StarshipFin = {
  key: string;
  /** Meters above the stage's own base, at the fin's center. */
  y: number;
  /** How far the outer edge reaches from the vehicle's axis. */
  reach: number;
  position: Vec3;
  rotation: Vec3;
  args: Vec3;
};

const GRID_FIN_Y = 63;
/** Deployed: thin plates lying flat and reaching well past the hull, not slabs against it. */
const GRID_FIN_SIZE: Vec3 = [6.5, 1.6, 4.2];
/** Three, since the current booster dropped the fourth, and stowed rather than deployed. */
const GRID_FIN_ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

export const GRID_FINS: readonly StarshipFin[] = GRID_FIN_ANGLES.map((angle, index) => {
  const offset = HULL_RADIUS + GRID_FIN_SIZE[0] / 2 - 0.8;

  return {
    key: `grid-${index}`,
    y: GRID_FIN_Y,
    reach: offset + GRID_FIN_SIZE[0] / 2,
    position: [Math.sin(angle) * offset, GRID_FIN_Y, Math.cos(angle) * offset],
    rotation: [0, angle, 0],
    args: GRID_FIN_SIZE,
  };
});

const AFT_FLAP_Y = 7;
const AFT_FLAP_SIZE: Vec3 = [9, 13, 1.3];
const FORWARD_FLAP_Y = SHIP_BARREL_HEIGHT + 2;
const FORWARD_FLAP_SIZE: Vec3 = [8, 10, 1.1];
/**
 * The pair sits on the hull's diameter rather than set back toward the leeward side. Offset
 * in z, `SHIP_YAW` swings one flap behind the hull and foreshortens the other to half its
 * span — on the diameter both project, which is the whole of what the flaps are here for.
 */
const FLAP_LEEWARD_Z = 0;
const AFT_FLAP_CANT = 0.3;
const FORWARD_FLAP_CANT = 0.66;

function flapPair(
  key: string,
  y: number,
  size: Vec3,
  cant: number,
  inset: number,
): readonly StarshipFin[] {
  return [-1, 1].map((side) => {
    const offset = HULL_RADIUS + size[0] / 2 - inset;

    return {
      key: `${key}-${side < 0 ? "left" : "right"}`,
      y,
      reach: offset + size[0] / 2,
      position: [side * offset, y, FLAP_LEEWARD_Z],
      rotation: [0, 0, side * cant],
      args: size,
    };
  });
}

export const FLAPS: readonly StarshipFin[] = [
  ...flapPair("aft", AFT_FLAP_Y, AFT_FLAP_SIZE, AFT_FLAP_CANT, 1.2),
  ...flapPair("forward", FORWARD_FLAP_Y, FORWARD_FLAP_SIZE, FORWARD_FLAP_CANT, 0.9),
];

/** The turned base both models stand on, and the thing that makes them read as models. */
function Stand(): ReactElement {
  return (
    <mesh position={[0, STAND_HEIGHT / 2, 0]}>
      <cylinderGeometry args={[STAND_RADIUS, STAND_RADIUS, STAND_HEIGHT, RADIAL_SEGMENTS]} />
      <meshStandardMaterial {...frameMaterial} />
    </mesh>
  );
}

/** The engine end of either stage: a short dark taper standing in for the thrust section. */
function EngineSkirt(): ReactElement {
  return (
    <mesh position={[0, SKIRT_HEIGHT / 2, 0]}>
      <cylinderGeometry args={[HULL_RADIUS, HULL_RADIUS - 0.4, SKIRT_HEIGHT, RADIAL_SEGMENTS]} />
      <meshStandardMaterial {...darkMetalMaterial} />
    </mesh>
  );
}

export function SuperHeavy({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position} scale={SCALE}>
      <Stand />

      <group position={[0, STAND_HEIGHT, 0]}>
        <mesh position={[0, ENGINE_RING_HEIGHT / 2, 0]}>
          <cylinderGeometry
            args={[
              ENGINE_RING_RADIUS,
              ENGINE_RING_RADIUS - 0.6,
              ENGINE_RING_HEIGHT,
              RADIAL_SEGMENTS,
            ]}
          />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>

        <EngineSkirt />

        <mesh position={[0, BOOSTER_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[HULL_RADIUS, HULL_RADIUS, BOOSTER_HEIGHT, RADIAL_SEGMENTS]} />
          <meshStandardMaterial {...STAINLESS} />
        </mesh>

        {CHINE_ANGLES.map((angle) => (
          <mesh
            key={angle}
            position={[
              Math.sin(angle) * (HULL_RADIUS + CHINE_SIZE[0] / 2 - 0.5),
              CHINE_BASE + CHINE_HEIGHT / 2,
              Math.cos(angle) * (HULL_RADIUS + CHINE_SIZE[0] / 2 - 0.5),
            ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={CHINE_SIZE} />
            <meshStandardMaterial {...STAINLESS} />
          </mesh>
        ))}

        {GRID_FINS.map((fin) => (
          <mesh key={fin.key} position={fin.position} rotation={fin.rotation}>
            <boxGeometry args={fin.args} />
            <meshStandardMaterial {...GUNMETAL} />
          </mesh>
        ))}

        <mesh position={[0, BOOSTER_HEIGHT - HOT_STAGE_HEIGHT - HOT_STAGE_GAP / 2, 0]}>
          <cylinderGeometry
            args={[HULL_RADIUS + 0.1, HULL_RADIUS + 0.1, HOT_STAGE_GAP, RADIAL_SEGMENTS]}
          />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>

        <mesh position={[0, BOOSTER_HEIGHT - HOT_STAGE_HEIGHT / 2, 0]}>
          <cylinderGeometry
            args={[HOT_STAGE_RADIUS, HOT_STAGE_RADIUS, HOT_STAGE_HEIGHT, RADIAL_SEGMENTS, 1, true]}
          />
          <meshStandardMaterial {...STAINLESS} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function Starship({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position} scale={SCALE} rotation={[0, SHIP_YAW, 0]}>
      <Stand />

      <group position={[0, STAND_HEIGHT, 0]}>
        <EngineSkirt />

        <mesh>
          <latheGeometry args={[[...HULL_PROFILE], RADIAL_SEGMENTS]} />
          <meshStandardMaterial {...STAINLESS} />
        </mesh>

        <mesh>
          <latheGeometry args={[[...TILE_PROFILE], RADIAL_SEGMENTS, TILE_START, TILE_SWEEP]} />
          <meshStandardMaterial {...TILES} side={DoubleSide} />
        </mesh>

        {FLAPS.map((flap) => (
          <mesh key={flap.key} position={flap.position} rotation={flap.rotation}>
            <boxGeometry args={flap.args} />
            <meshStandardMaterial {...GUNMETAL} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
