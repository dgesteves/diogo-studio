import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MeshBasicMaterial } from "three";
import { materialOf, renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { worldColors, worldPalettes } from "@/world/materials";
import { siteConfig } from "@/content/profile";
import { setWorldMode, type WorldMode } from "@/world/store";
import { WorldNeon } from "./neon";

/**
 * The sign on the back wall: a name in neon, two tubes and the light they throw. It is the
 * one place in the scene that paints text as DOM rather than into a canvas texture, through
 * drei's `<Html>`, so it is also the one place where a decorative label could reach a screen
 * reader as a second copy of the site's name.
 */

afterEach(unmountScenes);

async function neon(mode: WorldMode = "night"): Promise<SceneQuery> {
  // Set before mounting: changing it under a live scene notifies subscribers unwrapped.
  await act(async () => setWorldMode(mode));
  return renderScene(<WorldNeon />, {
    // drei's `<Html>` portals into the canvas's parent, and RTTR's canvas is detached — so
    // without this the sign renders nowhere and every DOM assertion below passes vacuously.
    prepare: (state) => document.body.append(state.gl.domElement),
  });
}

function tubeColors(scene: SceneQuery): string[] {
  return scene
    .meshesWith("BoxGeometry")
    .map((mesh) => `#${materialOf<MeshBasicMaterial>(mesh).color.getHexString()}`);
}

describe("WorldNeon", () => {
  it("spells the studio's name in neon", async () => {
    await neon();

    expect(document.body.textContent).toContain(siteConfig.name.toUpperCase());
  });

  /**
   * The sign is scenery. The site's real name and title are in the server-rendered document,
   * so announcing this too would read the name twice — and `<Html>` output is real DOM in the
   * page, which is exactly why this needs asserting rather than assuming.
   */
  it("keeps the sign out of the accessibility tree", async () => {
    await neon();

    const sign = document.querySelector(`[aria-hidden="true"]`);
    expect(sign).not.toBeNull();
    expect(sign!.textContent).toContain(siteConfig.name.toUpperCase());
  });

  it("dims the sign in daylight instead of keeping one fixed glow", async () => {
    const night = await neon("night");
    const nightIntensity = night.lightsOfType("PointLight")[0]!.intensity;

    await unmountScenes();
    const day = await neon("day");

    expect(nightIntensity).toBeCloseTo(1.2 * worldPalettes.night.neonIntensity);
    expect(day.lightsOfType("PointLight")[0]!.intensity).toBeCloseTo(
      1.2 * worldPalettes.day.neonIntensity,
    );
    expect(day.lightsOfType("PointLight")[0]!.intensity).toBeLessThan(nightIntensity);
  });

  it("builds both tubes from the shared accent tokens", async () => {
    const scene = await neon();

    // Two different tokens: the back tube and the side tube are not the same neon.
    expect(tubeColors(scene)).toEqual([worldColors.accent, worldColors.accentSoft]);
  });

  /** Tone mapping would fold a light source back into the room's exposure and it would read as paint. */
  it("keeps the tubes out of the room's tone mapping", async () => {
    const scene = await neon();

    for (const mesh of scene.meshesWith("BoxGeometry")) {
      expect(materialOf<MeshBasicMaterial>(mesh).toneMapped).toBe(false);
    }
  });
});
