"use client";

import type { ReactElement } from "react";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Vector2 } from "three";

export function Postprocessing(): ReactElement {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.55} luminanceThreshold={0.42} luminanceSmoothing={0.2} mipmapBlur />
      <ChromaticAberration
        offset={new Vector2(0.0006, 0.0009)}
        radialModulation
        modulationOffset={0.2}
      />
      <Vignette offset={0.28} darkness={0.55} eskil={false} />
    </EffectComposer>
  );
}
