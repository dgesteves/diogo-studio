"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { FRAME, SURFACE, TABLE_Z } from "./constants";
import { LoungeTableItems } from "./lounge-table-items";

const TOP_Y = 0.34;
const LEG_X = 0.5;
const LEG_Z = 0.28;

export function LoungeCoffeeTable(): ReactElement {
  return (
    <group position={[0, 0, TABLE_Z]}>
      <RoundedBox
        args={[1.3, 0.06, 0.7]}
        radius={0.02}
        smoothness={3}
        position={[0, TOP_Y, 0]}
        castShadow
      >
        <meshStandardMaterial {...SURFACE} />
      </RoundedBox>

      <mesh position={[0, TOP_Y + 0.032, 0]}>
        <boxGeometry args={[1.0, 0.004, 0.5]} />
        <meshStandardMaterial color="#0a1218" roughness={0.15} metalness={0.6} />
      </mesh>

      <mesh position={[0, TOP_Y + 0.026, 0.352]}>
        <boxGeometry args={[1.2, 0.005, 0.005]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>

      {[-LEG_X, LEG_X].map((x) =>
        [-LEG_Z, LEG_Z].map((z) => (
          <mesh key={`${x},${z}`} position={[x, TOP_Y / 2 - 0.02, z]}>
            <cylinderGeometry args={[0.022, 0.022, TOP_Y - 0.06, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}

      <LoungeTableItems topY={TOP_Y + 0.034} />
    </group>
  );
}
