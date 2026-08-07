"use client";

import { type ReactElement } from "react";
import { DoubleSide } from "three";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y, METAL } from "./constants";
import { ServerNode } from "./desk-fixtures";
import { Headphones } from "./headphones";

export function DeskExtras(): ReactElement {
  return (
    <group>
      <DeskLamp />
      <Headphones />
      <ServerNode />
    </group>
  );
}

function DeskLamp(): ReactElement {
  return (
    <group position={[-1.36, DESK_TOP_Y, 0.3]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.016, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.54, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.48, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group position={[0, 0.625, 0.415]} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, 0.062, 0]}>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.034, 0.078, 0.12, 24, 1, true]} />
          <meshStandardMaterial {...METAL} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.034, 24]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh position={[0, -0.056, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.076, 24]} />
          <meshBasicMaterial color={brandColors.coolLight} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.026, 0]}>
          <sphereGeometry args={[0.019, 12, 12]} />
          <meshBasicMaterial color={brandColors.coolLightCore} toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, -0.1, 0]}
          intensity={0.9}
          distance={1.8}
          decay={2}
          color={brandColors.coolLight}
        />
      </group>
    </group>
  );
}
