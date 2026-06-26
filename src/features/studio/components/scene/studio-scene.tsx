"use client";

import { Suspense, type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";

import { Chair } from "./chair";
import { CityWindow } from "./city-window";
import { Desk } from "./desk";
import { DeskExtras } from "./desk-extras";
import { DeskProps } from "./desk-props";
import { DustMotes } from "./dust-motes";
import { GridFloor } from "./grid-floor";
import { Lighting } from "./lighting";
import { MonitorRig } from "./monitor-rig";
import { Room } from "./room";
import { Speakers } from "./speakers";

export function StudioScene(): ReactElement {
  return (
    <>
      <Lighting />

      <Suspense fallback={null}>
        <Room />
        <CityWindow />
        <GridFloor />
        <Desk />
        <Chair />
        <DeskProps />
        <DeskExtras />
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
      <DustMotes />
    </>
  );
}
