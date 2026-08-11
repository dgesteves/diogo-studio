import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MeshBasicMaterial, MeshStandardMaterial } from "three";
import {
  geometryParams,
  materialOf,
  renderScene,
  unmountScenes,
  type SceneQuery,
} from "@tests/r3f";
import { setAiCoreHovered } from "@/stores/world-store";
import {
  AI_CORE_ACCENT,
  AI_CORE_HITBOX_RADIUS,
  AI_CORE_POSITION,
  AI_CORE_RADIUS,
} from "../constants/ai-core";
import { getHotspotObjects } from "../utils/hotspot-registry";
import { AiCore } from "./ai-core";

/**
 * The one object in the world that opens the ⌘K agent instead of navigating. What it owes
 * a visitor is that it is *there* — pickable and lit — and that pointing at it responds,
 * which is the whole affordance telling them it can be clicked.
 *
 * Its `NeonLabel` is deliberately not asserted here: drei's `<Html>` portals into
 * `gl.domElement.parentNode`, which RTTR has no equivalent of, so the label produces no
 * DOM at all headlessly. What the label *does* — fade and settle with the hover — is
 * asserted in `utils/ai-core-animation.dom.test.ts`, which drives a real span; its text is
 * `aria-hidden` decoration and belongs to the browser suite.
 */

afterEach(unmountScenes);

function orb(scene: SceneQuery) {
  return {
    core: scene.meshesWith("IcosahedronGeometry")[0],
    shell: scene.meshesWith("IcosahedronGeometry")[1],
    rings: scene.meshesWith("TorusGeometry"),
    hitbox: scene.meshesWith("SphereGeometry")[0],
    glow: scene.meshesWith("PlaneGeometry")[0],
    light: scene.lightsOfType("PointLight")[0],
  };
}

describe("AiCore", () => {
  it("assembles the orb where the room's constants put it", async () => {
    const scene = await renderScene(<AiCore />);
    const { core, shell, rings, hitbox, glow, light } = orb(scene);

    expect(core?.parent?.parent?.position.toArray()).toEqual([...AI_CORE_POSITION]);
    expect(geometryParams(core).radius).toBeCloseTo(AI_CORE_RADIUS);
    expect(geometryParams(shell).radius).toBeGreaterThan(AI_CORE_RADIUS);
    expect(rings).toHaveLength(2);
    expect(geometryParams(hitbox).radius).toBeCloseTo(AI_CORE_HITBOX_RADIUS);
    expect(glow).toBeDefined();
    expect(light?.color.getHexString()).toBe(AI_CORE_ACCENT.slice(1));
  });

  it("registers a hitbox that is generous to aim at but never drawn", async () => {
    const scene = await renderScene(<AiCore />);
    const { core, hitbox } = orb(scene);

    // Bigger than the orb it stands for, so the pointer does not have to find a 16 cm ball.
    expect(geometryParams(hitbox).radius).toBeGreaterThan((geometryParams(core).radius ?? 0) * 2);
    expect(hitbox?.visible).toBe(false);
    expect(getHotspotObjects()).toContain(hitbox);
    expect(hitbox?.userData.aiCore).toBe(true);

    await scene.unmount();
    expect(getHotspotObjects()).not.toContain(hitbox);
  });

  it("keeps drifting on its own, so the orb never reads as a static prop", async () => {
    const scene = await renderScene(<AiCore />);
    const { core } = orb(scene);
    const bob = core!.parent!;

    await scene.advance(1, 0.5);
    const first = { spin: core!.rotation.y, height: bob.position.y };
    await scene.advance(1, 0.5);

    expect(core!.rotation.y).toBeGreaterThan(first.spin);
    expect(bob.position.y).not.toBe(first.height);
  });

  it("lights up as the pointer settles on it, and fades back when it leaves", async () => {
    const scene = await renderScene(<AiCore />);
    const { core, glow, light } = orb(scene);
    const emissive = () => materialOf<MeshStandardMaterial>(core).emissiveIntensity;
    const glowOpacity = () => materialOf<MeshBasicMaterial>(glow).opacity;

    await scene.advance(1, 0.1);
    const idle = { emissive: emissive(), light: light!.intensity, glow: glowOpacity() };

    await act(async () => setAiCoreHovered(true));
    await scene.advance(30, 1 / 60);

    expect(emissive()).toBeGreaterThan(idle.emissive);
    expect(light!.intensity).toBeGreaterThan(idle.light);
    expect(glowOpacity()).toBeGreaterThan(idle.glow);

    await act(async () => setAiCoreHovered(false));
    await scene.advance(30, 1 / 60);

    // The glow's opacity is the one reading with no idle pulse in it, so it is the only
    // one that can be compared against a measurement taken at a different moment.
    expect(glowOpacity()).toBeCloseTo(idle.glow, 2);
  });

  it("eases the hover in rather than snapping, over a frame a visitor can see", async () => {
    const scene = await renderScene(<AiCore />);
    const { light } = orb(scene);

    await scene.advance(1, 1 / 60);
    const idle = light!.intensity;

    await act(async () => setAiCoreHovered(true));
    await scene.advance(1, 1 / 60);
    const oneFrame = light!.intensity;
    await scene.advance(40, 1 / 60);

    expect(oneFrame).toBeGreaterThan(idle);
    expect(oneFrame).toBeLessThan(light!.intensity);
  });
});
