"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";
import { useTabletScreenTexture } from "../screens/tablet-screen";

/**
 * The drawing tablet and the stylus lying on it. One file because the stylus has no meaning
 * anywhere else in the room and is positioned against the tablet's own surface.
 */

const BARREL_LENGTH = 0.126;
const BARREL_HALF = BARREL_LENGTH / 2;
const BARREL_TAIL_RADIUS = 0.0055;
const BARREL_TIP_RADIUS = 0.0042;
const GRIP_LENGTH = 0.036;
const TIP_LENGTH = 0.02;

const STYLUS_RADIUS = 0.0062;

type StylusProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

function Stylus({ position, rotation }: StylusProps): ReactElement {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[BARREL_TAIL_RADIUS, BARREL_TIP_RADIUS, BARREL_LENGTH, 14]} />
        <meshStandardMaterial color="#161c22" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[0, -BARREL_HALF + GRIP_LENGTH / 2, 0]}>
        <cylinderGeometry args={[STYLUS_RADIUS, 0.0052, GRIP_LENGTH, 14]} />
        <meshStandardMaterial color="#0b1015" roughness={0.88} metalness={0.12} />
      </mesh>
      <mesh position={[0, -BARREL_HALF - TIP_LENGTH / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[BARREL_TIP_RADIUS, TIP_LENGTH, 14]} />
        <meshStandardMaterial color="#0d1216" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, BARREL_HALF, 0]}>
        <sphereGeometry args={[BARREL_TAIL_RADIUS, 14, 10]} />
        <meshStandardMaterial color="#1a2530" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, -BARREL_HALF + GRIP_LENGTH + 0.003, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0055, 0.0011, 8, 20]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.0048, 0.014, 0]}>
        <capsuleGeometry args={[0.0015, 0.013, 4, 10]} />
        <meshStandardMaterial color="#22303a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

const SLAB_WIDTH = 0.2;
const SLAB_DEPTH = 0.3;
const SLAB_HEIGHT = 0.012;
const SLAB_TOP = SLAB_HEIGHT / 2;
const ACTIVE_AREA_Z = 0.012;
const ACTIVE_AREA_WIDTH = 0.176;
const ACTIVE_AREA_DEPTH = 0.252;
const FRAME_INSET = 0.0035;
const BEZEL_GROOVE_Z = -SLAB_DEPTH / 2 + 0.018;
const SLAB_LIFT = 0.008;
const STYLUS_X = -0.142;

export function GraphicsTablet(): ReactElement {
  const screenTexture = useTabletScreenTexture();

  return (
    <group position={[-0.62, DESK_TOP_Y + SLAB_LIFT, -0.04]} rotation={[0, 0.12, 0]}>
      <RoundedBox args={[SLAB_WIDTH, SLAB_HEIGHT, SLAB_DEPTH]} radius={0.006} smoothness={2}>
        <meshStandardMaterial color="#13181d" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, SLAB_TOP - 0.0004, ACTIVE_AREA_Z]}>
        <boxGeometry
          args={[ACTIVE_AREA_WIDTH + FRAME_INSET * 2, 0.0012, ACTIVE_AREA_DEPTH + FRAME_INSET * 2]}
        />
        <meshStandardMaterial color="#05080b" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, SLAB_TOP + 0.0004, ACTIVE_AREA_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ACTIVE_AREA_WIDTH, ACTIVE_AREA_DEPTH]} />
        <meshStandardMaterial
          map={screenTexture}
          emissive="#ffffff"
          emissiveMap={screenTexture}
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.012, SLAB_TOP - 0.0007, BEZEL_GROOVE_Z]}>
        <boxGeometry args={[0.11, 0.0014, 0.005]} />
        <meshStandardMaterial color="#05080b" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.062, SLAB_TOP - 0.0006, BEZEL_GROOVE_Z]}>
        <sphereGeometry args={[0.0026, 8, 8]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <Stylus
        position={[STYLUS_X, STYLUS_RADIUS - SLAB_LIFT, 0.02]}
        rotation={[Math.PI / 2, 0, 0.12]}
      />
      <pointLight
        position={[0, 0.05, ACTIVE_AREA_Z]}
        intensity={0.09}
        distance={0.38}
        decay={2}
        color={worldColors.accent}
      />
    </group>
  );
}
