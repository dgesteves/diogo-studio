"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "@/world/materials";

const BAR_W = 1.2;
const BAR_H = 0.08;
const BAR_D = 0.1;
const BAR_Z = 0.06;
const BODY = { color: "#0e1419", roughness: 0.5, metalness: 0.4 } as const;
const GRILLE = { color: "#080c10", roughness: 0.85, metalness: 0.1 } as const;

type LoungeSoundbarProps = {
  topY: number;
};

export function LoungeSoundbar({ topY }: LoungeSoundbarProps): ReactElement {
  const centerY = topY + BAR_H / 2;

  return (
    <group position={[0, centerY, BAR_Z]}>
      <RoundedBox args={[BAR_W, BAR_H, BAR_D]} radius={0.03} smoothness={3} castShadow>
        <meshStandardMaterial {...BODY} />
      </RoundedBox>
      <mesh position={[0, 0, BAR_D / 2 + 0.001]}>
        <planeGeometry args={[BAR_W - 0.14, BAR_H - 0.036]} />
        <meshStandardMaterial {...GRILLE} />
      </mesh>
      <mesh position={[BAR_W / 2 - 0.06, 0, BAR_D / 2 + 0.002]}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
    </group>
  );
}
