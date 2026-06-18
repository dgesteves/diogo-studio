"use client";

import { type ReactElement } from "react";

import { LOUNGE_ORIGIN, LOUNGE_ROTATION_Y } from "./constants";
import { LoungeCoffeeTable } from "./lounge-coffee-table";
import { LoungeLamp } from "./lounge-lamp";
import { LoungeRug } from "./lounge-rug";
import { LoungeSofa } from "./lounge-sofa";
import { LoungeTv } from "./lounge-tv";

export function Lounge(): ReactElement {
  return (
    <group position={LOUNGE_ORIGIN} rotation={[0, LOUNGE_ROTATION_Y, 0]}>
      <LoungeRug />
      <LoungeSofa />
      <LoungeCoffeeTable />
      <LoungeTv />
      <LoungeLamp />
    </group>
  );
}
