"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { useDisposable } from "@/hooks/use-disposable";

import { DESK_TOP_Y } from "./constants";
import { MouseControls } from "./mouse-controls";
import { createMouseShellGeometry } from "./mouse-geometry";
import { MouseGlow } from "./mouse-lighting";

const MOUSE_SCALE = 1.05;

const SHELL_MATERIAL = { color: "#141a21", roughness: 0.62, metalness: 0.3 } as const;

export function Mouse(): ReactElement {
  const shell = useDisposable(() => createMouseShellGeometry());

  return (
    <group position={[0.45, DESK_TOP_Y, 0.34]} rotation={[0, -0.09, 0]} scale={MOUSE_SCALE}>
      <mesh geometry={shell}>
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      <MouseControls />
      <MouseGlow />
      <ContactShadows
        position={[0, 0.0008, 0]}
        scale={0.26}
        resolution={256}
        blur={1.8}
        far={0.06}
        opacity={0.6}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}
