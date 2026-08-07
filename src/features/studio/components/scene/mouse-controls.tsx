"use client";

import { useMemo, type ReactElement } from "react";
import { DoubleSide } from "three";

import { mouseNormal, mousePoint } from "./mouse-shell";
import { createMouseSeamGeometry, type MouseSeam } from "./mouse-trim-geometry";

const RIDGE_V = 0.5;
const DIVIDE_T = 0.5;
const SEAM_LIFT = 0.0002;
const WHEEL_T = 0.24;
const WHEEL_RADIUS = 0.0055;
const WHEEL_WIDTH = 0.0032;
const WHEEL_SINK = 0.0032;
const WHEEL_SLOT_SPAN = 0.075;

const SEAM_MATERIAL = { color: "#05090d", roughness: 0.9, metalness: 0.1 } as const;

const CHANNEL = {
  axis: "length",
  fixed: RIDGE_V,
  from: 0.02,
  to: DIVIDE_T,
  halfWidth: 0.0019,
  lift: SEAM_LIFT,
} as const satisfies MouseSeam;

const DIVIDE = {
  axis: "section",
  fixed: DIVIDE_T,
  from: 0.1,
  to: 0.9,
  halfWidth: 0.0009,
  lift: SEAM_LIFT,
} as const satisfies MouseSeam;

const WHEEL_SLOT = {
  axis: "length",
  fixed: RIDGE_V,
  from: WHEEL_T - WHEEL_SLOT_SPAN,
  to: WHEEL_T + WHEEL_SLOT_SPAN,
  halfWidth: 0.0027,
  lift: 0.00015,
} as const satisfies MouseSeam;

export function MouseControls(): ReactElement {
  const parts = useMemo(
    () => ({
      channel: createMouseSeamGeometry(CHANNEL),
      divide: createMouseSeamGeometry(DIVIDE),
      slot: createMouseSeamGeometry(WHEEL_SLOT),
      wheel: mousePoint(WHEEL_T, RIDGE_V).addScaledVector(
        mouseNormal(WHEEL_T, RIDGE_V),
        -WHEEL_SINK,
      ),
    }),
    [],
  );

  return (
    <>
      <mesh geometry={parts.slot}>
        <meshStandardMaterial color="#02050a" roughness={0.95} metalness={0.05} side={DoubleSide} />
      </mesh>
      <mesh geometry={parts.channel}>
        <meshStandardMaterial {...SEAM_MATERIAL} side={DoubleSide} />
      </mesh>
      <mesh geometry={parts.divide}>
        <meshStandardMaterial {...SEAM_MATERIAL} side={DoubleSide} />
      </mesh>
      <mesh position={parts.wheel} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 24]} />
        <meshStandardMaterial color="#0b1116" roughness={0.85} metalness={0.15} />
      </mesh>
    </>
  );
}
