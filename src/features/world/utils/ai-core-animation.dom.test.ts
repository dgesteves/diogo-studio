import { describe, expect, it } from "vitest";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from "three";
import { animateAiCore, type AiCoreParts } from "./ai-core-animation";

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
