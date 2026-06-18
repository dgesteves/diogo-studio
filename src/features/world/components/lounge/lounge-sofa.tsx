"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";

import { FRAME, SOFA_Z, UPHOLSTERY } from "./constants";

const WIDTH = 2.2;
const DEPTH = 0.95;
const SEAT_TOP = 0.42;
const SEAT_X = [-0.7, 0, 0.7] as const;
const FOOT_X = [-0.95, 0.95] as const;
const FOOT_Z = [-0.36, 0.36] as const;

export function LoungeSofa(): ReactElement {
  return (
    <group position={[0, 0, SOFA_Z]}>
      <RoundedBox
        args={[WIDTH, 0.34, DEPTH]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.27, 0]}
        castShadow
      >
        <meshStandardMaterial {...UPHOLSTERY} />
      </RoundedBox>

      {SEAT_X.map((x) => (
        <RoundedBox
          key={x}
          args={[0.66, 0.16, 0.78]}
          radius={0.06}
          smoothness={3}
          position={[x, SEAT_TOP, 0]}
          castShadow
        >
          <meshStandardMaterial {...UPHOLSTERY} />
        </RoundedBox>
      ))}

      <RoundedBox
        args={[WIDTH, 0.6, 0.2]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.62, 0.4]}
        castShadow
      >
        <meshStandardMaterial {...UPHOLSTERY} />
      </RoundedBox>

      {SEAT_X.map((x) => (
        <RoundedBox
          key={x}
          args={[0.62, 0.42, 0.14]}
          radius={0.07}
          smoothness={3}
          position={[x, 0.62, 0.28]}
          rotation={[0.12, 0, 0]}
        >
          <meshStandardMaterial color="#1c2a36" roughness={0.85} metalness={0.05} />
        </RoundedBox>
      ))}

      {[-WIDTH / 2 + 0.12, WIDTH / 2 - 0.12].map((x) => (
        <RoundedBox
          key={x}
          args={[0.22, 0.5, DEPTH]}
          radius={0.07}
          smoothness={3}
          position={[x, 0.46, 0]}
          castShadow
        >
          <meshStandardMaterial {...UPHOLSTERY} />
        </RoundedBox>
      ))}

      {FOOT_X.map((x) =>
        FOOT_Z.map((z) => (
          <mesh key={`${x},${z}`} position={[x, 0.05, z]}>
            <cylinderGeometry args={[0.03, 0.025, 0.1, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}
    </group>
  );
}
