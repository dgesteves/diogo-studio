"use client";

import { type ReactElement } from "react";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useWorldPalette } from "@/world/materials";
import { BLOOM_LEVELS } from "../constants/render";

export function WorldPostprocessing(): ReactElement {
  const palette = useWorldPalette();

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={palette.bloomIntensity}
        luminanceThreshold={palette.bloomLuminanceThreshold}
        luminanceSmoothing={palette.bloomLuminanceSmoothing}
        levels={BLOOM_LEVELS}
        mipmapBlur
      />
      <Vignette offset={palette.vignetteOffset} darkness={palette.vignetteDarkness} eskil={false} />
    </EffectComposer>
  );
}
