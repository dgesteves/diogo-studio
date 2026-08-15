"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "@/world/materials";

import { DESK_TOP_Y } from "@/world/room";
import {
  HARDWARE_CENTER_Z,
  HARDWARE_DEPTH,
  SERVER_BODY_CENTER_Y,
  SERVER_BODY_HEIGHT,
  SERVER_FOOT_HEIGHT,
  SERVER_HEIGHT,
  SERVER_WIDTH,
  SERVER_X,
} from "./desk-hardware-layout";
import { ServerNodeFront } from "./server-node-front";

const CHASSIS_MATERIAL = { color: "#0d1318", roughness: 0.58, metalness: 0.48 } as const;
const VENT_MATERIAL = { color: "#04070a", roughness: 0.95, metalness: 0.1 } as const;
const FOOT_X = SERVER_WIDTH / 2 - 0.018;
const FOOT_Z = HARDWARE_DEPTH / 2 - 0.024;
const SIDE_X = SERVER_WIDTH / 2 - 0.0006;
const TOP_VENT_X = [-0.048, -0.032, -0.016, 0, 0.016, 0.032, 0.048] as const;
const SIDE_VENT_Z = [-0.088, -0.07, -0.052, -0.034, -0.016] as const;

const FEET = [
  [-FOOT_X, -FOOT_Z],
  [FOOT_X, -FOOT_Z],
  [-FOOT_X, FOOT_Z],
  [FOOT_X, FOOT_Z],
] as const;

export function ServerNode(): ReactElement {
  return (
    <group position={[SERVER_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      {FEET.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, SERVER_FOOT_HEIGHT / 2, z]}>
          <cylinderGeometry args={[0.007, 0.0075, SERVER_FOOT_HEIGHT, 12]} />
          <meshStandardMaterial color="#05080b" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
      <RoundedBox
        args={[SERVER_WIDTH, SERVER_BODY_HEIGHT, HARDWARE_DEPTH]}
        radius={0.008}
        smoothness={3}
        position={[0, SERVER_BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...CHASSIS_MATERIAL} />
      </RoundedBox>
      <ChassisVents />
      <ServerNodeFront />
      <pointLight
        position={[0.04, SERVER_HEIGHT * 0.6, HARDWARE_DEPTH / 2 + 0.05]}
        intensity={0.07}
        distance={0.34}
        decay={2}
        color={worldColors.statusOk}
      />
    </group>
  );
}

function ChassisVents(): ReactElement {
  return (
    <>
      {TOP_VENT_X.map((x) => (
        <mesh key={`top-${x}`} position={[x, SERVER_HEIGHT - 0.0008, -0.055]}>
          <boxGeometry args={[0.004, 0.0022, HARDWARE_DEPTH * 0.44]} />
          <meshStandardMaterial {...VENT_MATERIAL} />
        </mesh>
      ))}
      {SIDE_VENT_Z.flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh key={`side-${side}-${z}`} position={[side * SIDE_X, SERVER_BODY_CENTER_Y, z]}>
            <boxGeometry args={[0.0025, SERVER_BODY_HEIGHT * 0.62, 0.005]} />
            <meshStandardMaterial {...VENT_MATERIAL} />
          </mesh>
        )),
      )}
    </>
  );
}
