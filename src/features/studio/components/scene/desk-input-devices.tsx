"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";
import { MouseGlow } from "./mouse-lighting";
import {
  BODY_DEPTH,
  BODY_HEIGHT,
  BODY_RADIUS,
  BODY_WIDTH,
  INLAY_DEPTH,
  INLAY_WIDTH,
  SIDE_FACE_X,
  TOP_Y,
  WHEEL_RADIUS,
  WHEEL_Z,
} from "./mouse-shell";

const SIDE_BUTTON_Z = [-0.012, 0.004];
const WHEEL_Y = TOP_Y + 0.0005;
const SHELL_MATERIAL = { color: "#10161c", roughness: 0.6, metalness: 0.24 } as const;
const BUTTON_MATERIAL = { color: "#151d24", roughness: 0.66, metalness: 0.18 } as const;

export function Mouse(): ReactElement {
  return (
    <group position={[0.6, DESK_TOP_Y, 0.34]}>
      <RoundedBox
        args={[BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH]}
        radius={BODY_RADIUS}
        smoothness={4}
        position={[0, BODY_HEIGHT / 2, 0]}
      >
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </RoundedBox>
      <mesh position={[0, TOP_Y + 0.0004, -0.002]}>
        <boxGeometry args={[INLAY_WIDTH, 0.001, INLAY_DEPTH]} />
        <meshStandardMaterial color="#080d11" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, TOP_Y - 0.0015, WHEEL_Z]}>
        <boxGeometry args={[0.012, 0.005, 0.017]} />
        <meshStandardMaterial color="#03060a" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0, WHEEL_Y, WHEEL_Z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.0042, 20]} />
        <meshStandardMaterial color="#0a0f13" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, WHEEL_Y, WHEEL_Z]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[WHEEL_RADIUS + 0.0002, 0.0007, 6, 24]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      {SIDE_BUTTON_Z.map((z) => (
        <RoundedBox
          key={z}
          args={[0.004, 0.006, 0.014]}
          radius={0.0012}
          smoothness={2}
          position={[-SIDE_FACE_X - 0.0004, BODY_HEIGHT / 2, z]}
        >
          <meshStandardMaterial {...BUTTON_MATERIAL} />
        </RoundedBox>
      ))}
      <mesh position={[0, TOP_Y + 0.0006, 0.036]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.0042, 0.0058, 28]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <MouseGlow />
    </group>
  );
}
