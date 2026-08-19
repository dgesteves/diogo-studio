"use client";

import { type ReactElement } from "react";
import { DoubleSide, Vector2 } from "three";
import { frameMaterial, worldColors } from "../materials";
import { type Vec3 } from "../stations";

/**
 * The collectible figure on the top shelf: helmet, cape, and a lit saber.
 *
 * Authored in **meters of a 2 m figure** and scaled once at the group, the way the rocket
 * models are, so the proportions are arguable rather than tuned. What matters more here is
 * that the figure renders about fifteen pixels tall, where a black statue in an unlit room is
 * a smudge: the **blade** is what carries the read. It is emissive and out of tone mapping,
 * like the room's neon, so the bloom pass finds it — and it throws a small red light of its
 * own onto the shelf, which is the only reason the black silhouette in front of it has an
 * edge at all.
 */

const FIGURE_HEIGHT = 2.02;
const PLINTH_HEIGHT = 0.06;
const PLINTH_RADIUS = 0.32;

/** The whole thing, plinth included, in shelf units. */
export const VADER_MODEL_HEIGHT = 0.21;
const SCALE = VADER_MODEL_HEIGHT / (PLINTH_HEIGHT + FIGURE_HEIGHT);

const ARMOR = { color: "#0b0e12", roughness: 0.34, metalness: 0.55 } as const;
const CLOTH = { color: "#070a0c", roughness: 0.95, metalness: 0 } as const;
const SABER_COLOR = "#ff2e2e";
/**
 * A light's `distance` and `intensity` are **not** scaled by its parent group, so these two
 * are in room units where everything else in this file is in figure meters. Authored at the
 * figure's scale, the glow reached 1.6 units and washed the whole back wall red.
 */
const SABER_LIGHT_REACH = 0.34;
const SABER_INTENSITY = 0.32;

const RADIAL_SEGMENTS = 16;

const HIP_Y = 1.0;
const SHOULDER_Y = 1.55;
const COLLAR_Y = 1.62;
const HELMET_Y = 1.79;
const HELMET_RADIUS = 0.135;

/**
 * The cape, revolved over the back half only. It is the widest thing on the figure and the
 * one part whose outline survives at this size, so it flares to well past the boots.
 */
const CAPE_PROFILE: readonly Vector2[] = [
  new Vector2(0.54, 0.01),
  new Vector2(0.46, 0.35),
  new Vector2(0.38, 0.75),
  new Vector2(0.31, 1.15),
  new Vector2(0.27, 1.45),
  new Vector2(0.26, SHOULDER_Y),
];
const CAPE_START = Math.PI / 2;
const CAPE_SWEEP = Math.PI;

const LEG_SIZE: Vec3 = [0.17, HIP_Y, 0.21];
const LEG_X = 0.14;
const ARM_SIZE: Vec3 = [0.14, 0.62, 0.17];
const ARM_X = 0.32;
const ARM_Y = 1.19;
/** The saber arm hangs out from the body; the other stays at the side. */
const SABER_ARM_CANT = -0.25;

const CHEST_LIGHTS: readonly { key: string; x: number; color: string }[] = [
  { key: "warn", x: -0.045, color: SABER_COLOR },
  { key: "ok", x: 0.045, color: worldColors.statusOk },
];

/**
 * The blade, and the pose it is held in: 30° below horizontal, in the figure's right hand,
 * which is the room's left. Any steeper and the tip goes through the plank it stands on.
 */
const HAND: Vec3 = [-0.4, 0.88, 0.12];
const SABER_PITCH = 2.09;
const HILT_LENGTH = 0.26;
const HILT_RADIUS = 0.028;
const BLADE_LENGTH = 1.25;
/** Thicker than a real blade: at scale this is 2 mm of room, which renders as dashes. */
const BLADE_RADIUS = 0.075;

/**
 * Where the blade ends, in shelf units measured from the figure's feet. Derived rather than
 * eyeballed because both failures are silent: a steeper pitch buries the tip in the plank,
 * and a longer blade hangs it off the end of the shelf.
 */
export const SABER_TIP: Vec3 = (() => {
  const reach = HILT_LENGTH + BLADE_LENGTH;

  return [
    (HAND[0] - reach * Math.sin(SABER_PITCH)) * SCALE,
    (PLINTH_HEIGHT + HAND[1] + reach * Math.cos(SABER_PITCH)) * SCALE,
    HAND[2] * SCALE,
  ];
})();

export function Vader({ position }: { position: Vec3 }): ReactElement {
  return (
    <group position={position} scale={SCALE}>
      <mesh position={[0, PLINTH_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[PLINTH_RADIUS, PLINTH_RADIUS, PLINTH_HEIGHT, RADIAL_SEGMENTS]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <group position={[0, PLINTH_HEIGHT, 0]}>
        <mesh>
          <latheGeometry args={[[...CAPE_PROFILE], RADIAL_SEGMENTS, CAPE_START, CAPE_SWEEP]} />
          <meshStandardMaterial {...CLOTH} side={DoubleSide} />
        </mesh>

        {[-LEG_X, LEG_X].map((x) => (
          <mesh key={x} position={[x, HIP_Y / 2, 0]}>
            <boxGeometry args={LEG_SIZE} />
            <meshStandardMaterial {...ARMOR} />
          </mesh>
        ))}

        {/* The tunic over the legs, flaring the way a robe does rather than hanging straight. */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.29, 0.44, 0.62, RADIAL_SEGMENTS]} />
          <meshStandardMaterial {...CLOTH} />
        </mesh>

        <mesh position={[0, HIP_Y + 0.045, 0]}>
          <boxGeometry args={[0.5, 0.09, 0.32]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        <mesh position={[0, (HIP_Y + SHOULDER_Y) / 2 + 0.05, 0]}>
          <boxGeometry args={[0.44, SHOULDER_Y - HIP_Y - 0.1, 0.28]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        <mesh position={[0, 1.34, 0.15]}>
          <boxGeometry args={[0.19, 0.14, 0.04]} />
          <meshStandardMaterial {...CLOTH} />
        </mesh>

        {CHEST_LIGHTS.map((light) => (
          <mesh key={light.key} position={[light.x, 1.36, 0.175]}>
            <boxGeometry args={[0.035, 0.022, 0.008]} />
            <meshBasicMaterial color={light.color} toneMapped={false} />
          </mesh>
        ))}

        <mesh position={[0, SHOULDER_Y, 0]}>
          <boxGeometry args={[0.62, 0.11, 0.32]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * ARM_X, ARM_Y, 0]}
            rotation={[0, 0, side < 0 ? SABER_ARM_CANT : 0]}
          >
            <boxGeometry args={ARM_SIZE} />
            <meshStandardMaterial {...ARMOR} />
          </mesh>
        ))}

        <mesh position={[0, COLLAR_Y, 0]}>
          <cylinderGeometry args={[0.13, 0.2, 0.14, RADIAL_SEGMENTS]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        <mesh position={[0, HELMET_Y, 0]}>
          <sphereGeometry args={[HELMET_RADIUS, RADIAL_SEGMENTS, 12]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        {/* The mask: the one angular thing on an otherwise round head. */}
        <mesh position={[0, HELMET_Y - 0.035, 0.1]}>
          <boxGeometry args={[0.15, 0.15, 0.07]} />
          <meshStandardMaterial {...ARMOR} />
        </mesh>

        <group position={HAND} rotation={[0, 0, SABER_PITCH]}>
          <mesh position={[0, HILT_LENGTH / 2, 0]}>
            <cylinderGeometry args={[HILT_RADIUS, HILT_RADIUS, HILT_LENGTH, 10]} />
            <meshStandardMaterial {...ARMOR} />
          </mesh>

          <mesh position={[0, HILT_LENGTH + BLADE_LENGTH / 2, 0]}>
            <cylinderGeometry args={[BLADE_RADIUS, BLADE_RADIUS, BLADE_LENGTH, 10]} />
            <meshBasicMaterial color={SABER_COLOR} toneMapped={false} />
          </mesh>

          <pointLight
            position={[0, HILT_LENGTH + BLADE_LENGTH / 2, 0]}
            color={SABER_COLOR}
            intensity={SABER_INTENSITY}
            distance={SABER_LIGHT_REACH}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}
