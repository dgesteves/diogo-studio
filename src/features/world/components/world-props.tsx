"use client";

import { type ReactElement } from "react";

import { Bookshelf } from "./props/bookshelf";
import { ContactDoor } from "./props/contact-door";
import { WallScreens } from "./props/wall-screens";

export function WorldProps(): ReactElement {
  return (
    <group>
      <Bookshelf />

      <group position={[-1.8, 0, 1.4]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.36, 16]} />
          <meshStandardMaterial color="#11181f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial color="#1f3a2c" roughness={0.9} flatShading />
        </mesh>
      </group>

      <ContactDoor />

      <WallScreens />
    </group>
  );
}
