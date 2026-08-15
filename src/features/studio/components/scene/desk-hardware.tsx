"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";

import { DESK_TOP_Y } from "@/world/room";
import { HARDWARE_CENTER_Z } from "./desk-hardware-layout";
import { DeskHub } from "./desk-hub";
import { MacStudio } from "./mac-studio";
import { ServerNode } from "./server-node";

export function DeskHardware(): ReactElement {
  return (
    <group>
      <ServerNode />
      <MacStudio />
      <DeskHub />
      <ContactShadows
        position={[0, DESK_TOP_Y + 0.0009, HARDWARE_CENTER_Z]}
        scale={0.95}
        resolution={512}
        blur={2}
        far={0.12}
        opacity={0.62}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}
