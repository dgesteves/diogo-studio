"use client";

import { type ReactElement } from "react";
import { worldColors, useWorldPalette } from "@/world/materials";

export function Lighting(): ReactElement {
  const palette = useWorldPalette();

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} />
      <hemisphereLight
        color={palette.hemisphereSky}
        groundColor={palette.hemisphereGround}
        intensity={palette.hemisphereIntensity}
      />
      <directionalLight
        position={[3, 5, 3]}
        intensity={palette.keyLightIntensity}
        color={palette.keyLightColor}
      />
      <pointLight position={[0, 0.6, -1.2]} intensity={0.9} decay={2} color={worldColors.accent} />
      <pointLight
        position={[2.4, 1.6, 0.6]}
        intensity={0.35}
        decay={2}
        color={worldColors.accentSoft}
      />
    </>
  );
}
