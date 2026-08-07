"use client";

import { type ReactElement } from "react";

import { CoffeeMug, PlantPot } from "./desk-decor";
import { Mouse } from "./desk-input-devices";
import { GraphicsTablet } from "./graphics-tablet";
import { Keyboard } from "./keyboard";

export function DeskProps(): ReactElement {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <CoffeeMug />
      <PlantPot />
      <GraphicsTablet />
    </group>
  );
}
