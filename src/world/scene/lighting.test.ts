import { type BufferGeometry } from "three";
import { describe, expect, it } from "vitest";

import { createRecordingContext } from "@tests/recording-ctx";
import { worldColors } from "../materials";
import {
  CEILING_FIXTURE,
  THROAT_SPAN,
  annulus,
  createBodyGeometry,
  createHairlineGeometry,
  POST_REACH,
  paintLens,
} from "./lighting";

/**
 * The ceiling fixture is a body with a hole in it and a light line let into its underside, and
 * everything that can go wrong with either is silent. An extruder takes its bevel out of the
 * profile rather than adding it, so a body can come out the wrong size and still render; a
 * hairline drawn a few millimeters wide lands on the well or off the edge without ever
 * throwing; and a lens whose blades do not meet at their own valleys seams once per blade at
 * a distance no unit test can see.
 */

const { span, apertureSpan, bodyDepth, chamfer } = CEILING_FIXTURE;

/** How far the farthest vertex reaches along one axis. */
function reach(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function axes(geometry: BufferGeometry): { x: number[]; y: number[]; z: number[] } {
  const position = Array.from(geometry.getAttribute("position").array);
  return {
    x: position.filter((_, i) => i % 3 === 0),
    y: position.filter((_, i) => i % 3 === 1),
    z: position.filter((_, i) => i % 3 === 2),
  };
}

describe("the ceiling fixture's body", () => {
  it("cuts the mouth out of the profile", () => {
    const shape = annulus(span, apertureSpan);

    expect(shape.holes).toHaveLength(1);
    expect(reach(shape.getPoints().map((point) => point.x))).toBeCloseTo(span / 2);
    expect(reach(shape.holes[0]?.getPoints().map((point) => point.x) ?? [])).toBeCloseTo(
      apertureSpan / 2,
    );
  });

  it("comes out the size it is measured at, bevel and all", () => {
    const { x, y, z } = axes(createBodyGeometry());

    // The bevel grows the profile, so the widest section is the drawn shape plus a chamfer.
    expect(reach(x)).toBeCloseTo(span / 2);
    expect(reach(y)).toBeCloseTo(span / 2);
    // It grows the run too: one chamfer past each end of the depth it was asked for.
    expect(Math.max(...z) - Math.min(...z)).toBeCloseTo(bodyDepth);
  });

  it("leaves the well open down to the throat", () => {
    const { x, y } = axes(createBodyGeometry());
    const inside = x.filter((_, i) => Math.max(Math.abs(x[i] ?? 0), Math.abs(y[i] ?? 0)) < 0.001);

    expect(inside).toHaveLength(0);
    expect(THROAT_SPAN).toBeLessThan(apertureSpan);
  });

  it("lets the hairline into the underside rather than over the well or off the edge", () => {
    const { x, y, z } = axes(createHairlineGeometry());
    const corners = x.map((value, i) => Math.max(Math.abs(value), Math.abs(y[i] ?? 0)));

    expect(reach(z)).toBe(0);
    expect(Math.max(...corners)).toBeLessThan(span / 2 - chamfer);
    expect(Math.min(...corners)).toBeGreaterThan(apertureSpan / 2);
  });
});

const lens = () => {
  const recording = createRecordingContext({ width: 1024, height: 512 });
  paintLens(recording.ctx);
  return recording;
};

describe("the lens", () => {
  it("is one even sheet at full value", () => {
    const recording = lens();
    const sheet = recording.callsTo("fillRect").map((args) => args.map(Number));

    expect(sheet.at(0)).toStrictEqual([0, 0, 1024, 512]);
    // One notch below the core white: painted at the core the sheet clips and blooms flat.
    expect(recording.valuesOf("fillStyle").at(0)).toBe(worldColors.coolLight);
  });

  it("softens nothing but the outermost band", () => {
    const recording = lens();
    const stops = recording
      .callsTo("gradient#1.addColorStop")
      .map(([offset, color]) => [Number(offset), String(color)] as const);
    const lit = stops.filter(([, color]) => color === "#ffffff").map(([offset]) => offset);

    // A shoulder any wider than this is the blur that reads as a soft, cheap panel.
    expect(Math.min(...lit)).toBeLessThanOrEqual(0.03);
    expect(Math.max(...lit)).toBeGreaterThanOrEqual(0.97);
  });

  it("hands the context back the way it found it", () => {
    const modes = lens().valuesOf("globalCompositeOperation");

    expect(modes.filter((mode) => mode === "multiply")).toHaveLength(1);
    expect(modes.at(-1)).toBe("source-over");
  });
});

describe("the suspension", () => {
  it("stands each post on the band of body it has to land on", () => {
    const half = CEILING_FIXTURE.postSection / 2;

    // Inside the chamfer at the top of the body, and outside the well it would fall through.
    expect(POST_REACH + half).toBeLessThan(span / 2 - chamfer);
    expect(POST_REACH - half).toBeGreaterThan(apertureSpan / 2);
  });
});
