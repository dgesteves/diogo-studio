import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  geometryParams,
  materialOf,
  renderScene,
  unmountScenes,
  type SceneQuery,
} from "@tests/r3f";
import { setAiCoreHovered } from "../store";
import {
  AI_CORE_ACCENT,
  AI_CORE_HITBOX_RADIUS,
  AI_CORE_POSITION,
  AI_CORE_RADIUS,
  AiCore,
  animateAiCore,
  type AiCoreParts,
} from "./ai-core";
import { getHotspotObjects } from "../interact";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from "three";

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

/**
 * The AI core is the one object in the world that answers to being pointed at: `a` is how
 * far its hover has eased in, and every part of the orb reads it. What matters is not the
 * particular numbers but that the whole assembly responds together, monotonically, and
 * stays where a visitor can see it — so the assertions here are shape, not formula.
 */

function makeParts(): AiCoreParts {
  const orb = (material: MeshStandardMaterial | MeshBasicMaterial): Mesh =>
    new Mesh(new SphereGeometry(1, 4, 4), material);

  return {
    bob: new Group(),
    core: orb(new MeshStandardMaterial()),
    shell: orb(new MeshStandardMaterial()),
    ringA: orb(new MeshBasicMaterial()),
    ringB: orb(new MeshBasicMaterial()),
    glow: orb(new MeshBasicMaterial()),
    light: new PointLight(),
    label: document.createElement("span"),
  };
}

function readState(parts: AiCoreParts) {
  return {
    bobY: parts.bob!.position.y,
    coreSpin: parts.core!.rotation.y,
    emissive: (parts.core!.material as MeshStandardMaterial).emissiveIntensity,
    shellSpin: parts.shell!.rotation.y,
    ringA: parts.ringA!.rotation.z,
    ringB: parts.ringB!.rotation.z,
    light: parts.light!.intensity,
    glowOpacity: (parts.glow!.material as MeshBasicMaterial).opacity,
    glowScale: parts.glow!.scale.x,
    labelOpacity: Number(parts.label!.style.opacity),
    labelShift: parts.label!.style.transform,
  };
}

function sample(t: number, a: number) {
  const parts = makeParts();
  animateAiCore(parts, t, a);
  return readState(parts);
}

describe("animateAiCore", () => {
  it("keeps the orb bobbing on the spot rather than drifting away from it", () => {
    const heights = Array.from({ length: 240 }, (_, i) => sample(i * 0.05, 0).bobY);

    expect(Math.max(...heights)).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeLessThan(0);
    expect(Math.max(...heights.map(Math.abs))).toBeLessThan(0.1);
  });

  it("turns the core and counter-rotates its two rings, so the orb never looks frozen", () => {
    const early = sample(1, 0);
    const late = sample(2, 0);

    expect(late.coreSpin).toBeGreaterThan(early.coreSpin);
    expect(late.shellSpin).toBeLessThan(early.shellSpin);
    expect(late.ringA).toBeGreaterThan(0);
    expect(late.ringB).toBeLessThan(0);
  });

  it("brightens the whole assembly as the hover eases in", () => {
    const idle = sample(1, 0);
    const hovered = sample(1, 1);

    expect(hovered.emissive).toBeGreaterThan(idle.emissive);
    expect(hovered.light).toBeGreaterThan(idle.light);
    expect(hovered.glowOpacity).toBeGreaterThan(idle.glowOpacity);
    expect(hovered.glowScale).toBeGreaterThan(idle.glowScale);
  });

  it("scales the glow evenly, so the halo stays a circle", () => {
    const parts = makeParts();
    animateAiCore(parts, 1, 1);

    const { x, y, z } = parts.glow!.scale;
    expect(y).toBe(x);
    expect(z).toBe(x);
  });

  it("keeps the label legible at rest and settles it into place on hover", () => {
    const idle = sample(1, 0);
    const hovered = sample(1, 1);

    expect(idle.labelOpacity).toBeGreaterThan(0);
    expect(idle.labelOpacity).toBeLessThan(1);
    expect(hovered.labelOpacity).toBe(1);

    expect(idle.labelShift).toBe("translateY(6px)");
    expect(hovered.labelShift).toBe("translateY(0px)");
  });

  it("does nothing on the frames before the orb's refs are attached", () => {
    const empty: AiCoreParts = {
      bob: null,
      core: null,
      shell: null,
      ringA: null,
      ringB: null,
      glow: null,
      light: null,
      label: null,
    };

    expect(() => animateAiCore(empty, 1, 1)).not.toThrow();
  });
});
