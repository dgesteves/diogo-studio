"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/**
 * Restrained postprocessing — bloom on emissive nodes/edges + a soft vignette.
 *
 * Anti-pattern guardrails (blueprint §2.3):
 * - No chromatic aberration drift (smudgy AwwwardsTM aesthetic).
 * - No film grain, no scanlines.
 * - Bloom is mipmap-blurred and luminance-thresholded so only the lit nodes
 *   and edge tracers bloom — the body of the page stays clean.
 */
export function Postprocessing() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.55} luminanceThreshold={0.35} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette offset={0.32} darkness={0.55} eskil={false} />
    </EffectComposer>
  );
}
