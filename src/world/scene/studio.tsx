"use client";

import { Suspense, type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { Chair } from "./chair";
import { CityWindow } from "./city";
import { Desk, DeskExtras, DeskProps } from "./desk";
import { DeskRug, GridFloor } from "./floor";
import { CeilingLights, Lighting } from "./lighting";
import { MonitorRig } from "./monitor-rig";
import { Room } from "./room";
import { Speakers } from "./speakers";
import { DeskHardware } from "./workstation";

/**
 * The room, assembled. Every object under `scene/` hangs off this one component, and it stays
 * one component on purpose: `scene.dom.test.tsx` counts its meshes exactly, which is the only
 * thing that catches a mesh vanishing in a large move.
 */

export function StudioScene(): ReactElement {
  return (
    <>
      <Lighting />

      <Suspense fallback={null}>
        <Room />
        <CeilingLights />
        <CityWindow />
        <GridFloor />
        <DeskRug />
        <Desk />
        <Chair />
        <DeskProps />
        <DeskExtras />
        <DeskHardware />
        <Speakers />
        <MonitorRig />
      </Suspense>

      <ContactShadows
        position={[0, 0.015, 0]}
        scale={9}
        resolution={512}
        blur={2.8}
        far={3}
        opacity={0.5}
        color="#02060a"
        frames={1}
      />
    </>
  );
}
