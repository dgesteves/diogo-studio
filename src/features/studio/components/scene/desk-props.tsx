"use client";

import { type ReactElement } from "react";

import { CoffeeMug, Notebook, PlantPot } from "./desk-decor";
import { Keyboard, Mouse } from "./desk-input-devices";

export function DeskProps(): ReactElement {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <CoffeeMug />
      <PlantPot />
      <Notebook />
    </group>
  );
}
