"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

const LAPTOP_BODY = { color: "#0e1419", roughness: 0.45, metalness: 0.5 } as const;
const REMOTE_BODY = { color: "#0b1014", roughness: 0.6, metalness: 0.25 } as const;

const BOOK_STACK = [
  { size: [0.24, 0.028, 0.32], yOffset: 0.014, rotationY: 0.08, color: "#2b3a46" },
  { size: [0.22, 0.024, 0.3], yOffset: 0.04, rotationY: -0.14, color: "#8f652f" },
  { size: [0.2, 0.022, 0.28], yOffset: 0.063, rotationY: 0.24, color: "#31424c" },
] as const;

type LoungeTableItemsProps = {
  topY: number;
};

export function LoungeTableItems({ topY }: LoungeTableItemsProps): ReactElement {
  return (
    <group>
      <group position={[0.32, topY, 0]} rotation={[0, -0.35, 0]}>
        <RoundedBox
          args={[0.3, 0.016, 0.22]}
          radius={0.006}
          smoothness={2}
          position={[0, 0.008, 0]}
        >
          <meshStandardMaterial {...LAPTOP_BODY} />
        </RoundedBox>
        <RoundedBox
          args={[0.3, 0.012, 0.22]}
          radius={0.006}
          smoothness={2}
          position={[0, 0.022, 0]}
        >
          <meshStandardMaterial {...LAPTOP_BODY} />
        </RoundedBox>
        <mesh position={[0.12, 0.016, 0.111]}>
          <circleGeometry args={[0.004, 10]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      </group>

      <group position={[-0.36, topY, 0.04]}>
        {BOOK_STACK.map((book) => (
          <mesh key={book.color} position={[0, book.yOffset, 0]} rotation={[0, book.rotationY, 0]}>
            <boxGeometry args={[...book.size]} />
            <meshStandardMaterial color={book.color} roughness={0.9} metalness={0} />
          </mesh>
        ))}
      </group>

      <group position={[0, topY + 0.008, 0.2]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[0.05, 0.016, 0.16]} radius={0.006} smoothness={2}>
          <meshStandardMaterial {...REMOTE_BODY} />
        </RoundedBox>
        <mesh position={[0, 0.009, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.005, 10]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
