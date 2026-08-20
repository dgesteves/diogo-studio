import { Color } from "three";
import { describe, expect, it } from "vitest";

import { worldColors } from "../materials";
import {
  MOUSE,
  WHEEL,
  WING,
  bodyTopAt,
  createShell,
  gripSheets,
  halfWidthAt,
  paintSeam,
  sampleCurve,
  seamSheets,
  shellSheets,
  shellTopAt,
  shoulderAt,
  wingSheets,
} from "./mouse";

/**
 * The mouse is molded rather than lofted: separate shells that meet at real gaps. Nothing
 * about that shows up as a thrown error — a wing that drifts across the centerline, a body
 * that stops being cut away under one, a wheel with nothing under it — so what is checked
 * here is the handful of relations that make the parts read as parts, plus the two ways a
 * parametric surface fails silently: a NaN normal at a degenerate end, and a shell that
 * sinks through the desk it is standing on.
 */

/** Enough stations to catch a local dip; the shape's features are all wider than this. */
const STATIONS = 240;

function along(): readonly number[] {
  return Array.from({ length: STATIONS + 1 }, (_, step) => step / STATIONS);
}

function positionsOf(geometry: ReturnType<typeof createShell>): readonly number[] {
  return Array.from(geometry.getAttribute("position").array);
}

describe("the measured curves the shell is read off", () => {
  const knots = [
    [0, 0.2],
    [0.4, 0.9],
    [0.7, 0.9],
    [1, 0.1],
  ] as const;

  it("passes through every measurement it was given", () => {
    for (const [at, value] of knots) expect(sampleCurve(knots, at)).toBeCloseTo(value, 10);
  });

  it("holds the ends flat instead of extrapolating past them", () => {
    expect(sampleCurve(knots, -1)).toBe(0.2);
    expect(sampleCurve(knots, 2)).toBe(0.1);
  });

  // Several tables hold a deliberate step, and an interpolant that overshoots one puts a
  // bulge on either side of it — a lip around the wheel slot, a waist at the nose.
  it("never overshoots a segment, so a step stays a step", () => {
    for (let step = 0; step <= 200; step += 1) {
      const at = step / 200;
      expect.soft(sampleCurve(knots, at)).toBeLessThanOrEqual(0.9 + 1e-12);
      expect.soft(sampleCurve(knots, at)).toBeGreaterThanOrEqual(0.1 - 1e-12);
    }
  });
});

describe("the mouse's proportions", () => {
  it("is widest under the heel of the hand, not at its middle", () => {
    const widest = along().reduce((best, t) => (halfWidthAt(t) > halfWidthAt(best) ? t : best), 0);

    expect(widest).toBeGreaterThan(0.6);
    expect(widest).toBeLessThan(0.85);
  });

  it("crests behind the middle and falls away over the tail", () => {
    const crest = along().reduce((best, t) => (shoulderAt(t) > shoulderAt(best) ? t : best), 0);

    expect(crest).toBeGreaterThan(0.55);
    expect(crest).toBeLessThan(0.8);
    expect(shoulderAt(0)).toBeLessThan(shoulderAt(crest));
    expect(shoulderAt(1)).toBeLessThan(shoulderAt(crest) / 2);
  });

  it("stays inside the shell it is dimensioned as", () => {
    for (const t of along()) {
      expect.soft(halfWidthAt(t)).toBeLessThanOrEqual(MOUSE.width / 2 + 1e-12);
      expect.soft(shellTopAt(t, 0)).toBeLessThanOrEqual(MOUSE.height + 1e-12);
    }
  });
});

describe("the wings, and the air around them", () => {
  /** Where a wing is: back from its swept front edge, forward of its swept rear one. */
  const UNDER_WING = along().filter((t) => t > WING.frontInner && t < WING.backInner);

  it("cuts the body away under a wing by at least the wing's own thickness", () => {
    for (const t of UNDER_WING) {
      const cut = shellTopAt(t, 0.5) - bodyTopAt(t, 0.5);
      expect.soft(cut).toBeGreaterThanOrEqual(WING.recess - 1e-9);
    }
  });

  it("leaves the deck ahead of them standing, so the nose is not a notch", () => {
    // Between the swept front corners the body is only dropped by the deck, not the recess:
    // that ridge is the wheel housing, and without it the front of the mouse opens up.
    const cut = shellTopAt(0.01, 0) - bodyTopAt(0.01, 0);

    expect(cut).toBeCloseTo(WING.deck, 6);
  });

  it("keeps each wing on its own side of the channel", () => {
    for (const side of [1, -1]) {
      const across = wingSheets(side)
        .flatMap((sheet) => positionsOf(createShell([sheet])).filter((_, index) => index % 3 === 0))
        .map((x) => x * side);

      expect(across.length).toBeGreaterThan(0);
      // A hairline, but never zero: the two click panels are separate moldings, and the
      // seam between them has to be air rather than two surfaces touching.
      for (const x of across) expect.soft(x).toBeGreaterThan(0.0009);
    }
  });
});

describe("the wheel in its well", () => {
  it("stands proud of the shell and still has the well floor under it", () => {
    const center = shellTopAt(WHEEL.t, 0) + WHEEL.rise - WHEEL.radius;

    expect(center + WHEEL.radius).toBeCloseTo(shellTopAt(WHEEL.t, 0) + WHEEL.rise, 12);
    expect(center - WHEEL.radius).toBeLessThan(bodyTopAt(WHEEL.t, 0));
  });

  it("is lit by a core narrower than the tire and wider than it is thick", () => {
    // What shows above the slot is a dark tire with a green rim on each side of it.
    expect(WHEEL.glowRadius).toBeLessThan(WHEEL.radius);
    expect(WHEEL.glowWidth).toBeGreaterThan(WHEEL.width);
  });
});

describe("the built geometry", () => {
  const geometries = [
    createShell(shellSheets()),
    createShell(gripSheets()),
    createShell(seamSheets(0, 1)),
  ];

  it("has a finite normal everywhere, including both ends", () => {
    for (const geometry of geometries) {
      const normals = Array.from(geometry.getAttribute("normal").array);
      expect(normals.length).toBeGreaterThan(0);
      expect(normals.every(Number.isFinite)).toBe(true);
    }
  });

  it("stands on the desk rather than through it", () => {
    for (const geometry of geometries) {
      const heights = positionsOf(geometry).filter((_, index) => index % 3 === 1);
      for (const y of heights) expect.soft(y).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});

describe("the lit seam", () => {
  const seam = paintSeam(createShell(seamSheets(0, 1)));
  const color = seam.getAttribute("color");
  const brightness = Array.from({ length: color.count }, (_, index) =>
    Math.max(color.getX(index), color.getY(index), color.getZ(index)),
  );

  it("burns the room's accent, not a palette of its own", () => {
    // The keyboard and the headphones are lit with this exact color; the mouse is a desk of
    // matching parts, so the strip is not the place to introduce a second neon.
    const peak = brightness.indexOf(Math.max(...brightness));
    const accent = new Color(worldColors.accent);

    expect(color.getX(peak)).toBeCloseTo(accent.r, 5);
    expect(color.getY(peak)).toBeCloseTo(accent.g, 5);
    expect(color.getZ(peak)).toBeCloseTo(accent.b, 5);
  });

  it("fades out before the flanks meet at either end", () => {
    // Both sides converge on the centerline at the nose and the tail, so a strip carried all
    // the way there stacks into a bright bead on an object with no light source at either end.
    const position = seam.getAttribute("position");
    const ends = brightness.filter((_, index) => {
      const at = position.getZ(index) / MOUSE.length + 0.5;
      return at < 0.015 || at > 0.997;
    });

    expect(ends.length).toBeGreaterThan(0);
    for (const value of ends) expect.soft(value).toBeLessThan(0.02);
  });
});
