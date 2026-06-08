"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

export function Lighting(): ReactElement {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#1c2d39", "#06090c", 0.55]} />
      <directionalLight position={[3, 5, 3]} intensity={1.15} color="#f6efe1" />
      <pointLight position={[0, 0.6, -1.2]} intensity={0.9} decay={2} color={brandColors.accent} />
      <pointLight
        position={[2.4, 1.6, 0.6]}
        intensity={0.35}
        decay={2}
        color={brandColors.accentSoft}
      />
      <pointLight position={[0, 0.5, 0.65]} intensity={0.3} decay={2} color={brandColors.accent} />
    </>
  );
}
