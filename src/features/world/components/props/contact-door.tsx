"use client";

import { type ReactElement } from "react";
import { darkMetalMaterial, frameMaterial } from "@/world/materials";

import type { Vec3 } from "../../types";

const LEAF_W = 0.92;
const LEAF_H = 2.08;
const LEAF_T = 0.05;
const REVEAL = 0.07;
const REVEAL_DEPTH = 0.14;
const REVEAL_CENTER_Z = 0.005;

const LEAF = { color: "#17212b", roughness: 0.45, metalness: 0.4 } as const;

const JAMBS: readonly { position: Vec3; args: Vec3 }[] = [
  {
    position: [-(LEAF_W + REVEAL) / 2, LEAF_H / 2, REVEAL_CENTER_Z],
    args: [REVEAL, LEAF_H + REVEAL, REVEAL_DEPTH],
  },
  {
    position: [(LEAF_W + REVEAL) / 2, LEAF_H / 2, REVEAL_CENTER_Z],
    args: [REVEAL, LEAF_H + REVEAL, REVEAL_DEPTH],
  },
  {
    position: [0, LEAF_H + REVEAL / 2, REVEAL_CENTER_Z],
    args: [LEAF_W + REVEAL * 2, REVEAL, REVEAL_DEPTH],
  },
];

const PULL_X = LEAF_W / 2 - 0.08;
const PULL_Y = 1.06;
const PULL_LENGTH = 0.72;
const STANDOFF_YS = [PULL_Y - 0.32, PULL_Y + 0.32] as const;

export function ContactDoor(): ReactElement {
  return (
    <group position={[-2.27, 0, 2.28]} rotation={[0, Math.PI / 2, 0]}>
      {JAMBS.map((jamb) => (
        <mesh key={jamb.position.join(",")} position={jamb.position}>
          <boxGeometry args={jamb.args} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      ))}

      <mesh position={[0, LEAF_H / 2 + 0.012, 0]}>
        <boxGeometry args={[LEAF_W, LEAF_H, LEAF_T]} />
        <meshStandardMaterial {...LEAF} />
      </mesh>

      {STANDOFF_YS.map((y) => (
        <mesh key={y} position={[PULL_X, y, 0.048]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.048, 10]} />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
      ))}
      <mesh position={[PULL_X, PULL_Y, 0.072]}>
        <cylinderGeometry args={[0.013, 0.013, PULL_LENGTH, 12]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
    </group>
  );
}
