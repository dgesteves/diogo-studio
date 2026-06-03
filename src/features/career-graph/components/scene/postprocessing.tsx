"use client";

import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Vector2 } from "three";

/**
 * Postprocessing stack for the career-graph hero canvas.
 *
 * Each pass operates on the previous pass's output. After perf testing
 * at the full-bleed hero size we kept only the passes that pay for
 * themselves visually:
 *
 *   1. **Bloom** — mipmap-blurred glow on emissive pixels. The single
 *      most expensive pass (mipmap chain), so we set a high luminance
 *      threshold and modest intensity to keep the bright mask small.
 *   2. **Chromatic aberration** — a very slight per-channel RGB offset
 *      with radial modulation. Sells the "lens" feel essentially for
 *      free.
 *   3. **Vignette** — pulls the corners into the page background so the
 *      atmosphere blends cleanly into the page surround.
 *
 * Dropped from the stack:
 *   - **Noise (film grain)** — added a full-screen blit (~0.3ms) for a
 *     barely-perceptible texture. Not worth the cost at this canvas size.
 */
export function Postprocessing() {
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={0.55}
        // Higher threshold = fewer pixels enter the mipmap chain, which
        // is what dominates bloom's runtime.
        luminanceThreshold={0.42}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.0006, 0.0009)}
        radialModulation
        modulationOffset={0.2}
      />
      <Vignette offset={0.28} darkness={0.55} eskil={false} />
    </EffectComposer>
  );
}
