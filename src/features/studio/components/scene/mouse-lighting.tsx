"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

import {
  BUTTON_EDGE_Z,
  INLAY_WIDTH,
  SEAM_DEPTH,
  SEAM_Z,
  SIDE_FACE_X,
  SIDE_STRIP_DEPTH,
  SIDE_STRIP_Y,
  SIDE_STRIP_Z,
  TOP_Y,
} from "./mouse-shell";

const SIDE_SIGNS = [-1, 1] as const;
const LINE_THICKNESS = 0.0013;
const LINE_LIFT = 0.0011;

export function MouseGlow(): ReactElement {
  return (
    <>
      <mesh position={[0, TOP_Y + LINE_LIFT, SEAM_Z]}>
        <boxGeometry args={[LINE_THICKNESS, 0.0006, SEAM_DEPTH]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, TOP_Y + LINE_LIFT, BUTTON_EDGE_Z]}>
        <boxGeometry args={[INLAY_WIDTH, 0.0006, LINE_THICKNESS]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      {SIDE_SIGNS.map((sign) => (
        <mesh key={sign} position={[sign * (SIDE_FACE_X - 0.0002), SIDE_STRIP_Y, SIDE_STRIP_Z]}>
          <boxGeometry args={[LINE_THICKNESS, 0.0016, SIDE_STRIP_DEPTH]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      ))}
      <pointLight
        position={[0, 0.008, 0]}
        intensity={0.12}
        distance={0.22}
        decay={2}
        color={brandColors.accent}
      />
    </>
  );
}
