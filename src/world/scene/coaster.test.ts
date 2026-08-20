import { describe, expect, it } from "vitest";

import { createRecordingContext } from "@tests/recording-ctx";
import { COASTER, COASTER_LABEL, COASTER_PRINT, paintCoasterPrint } from "./coaster";

/**
 * The etched face under the mug. Nothing that can go wrong with it throws: a design laid out
 * past the radius is cropped by the disc, type set wider than the chord at the height it sits
 * runs off the same edge, and everything the mug's own base covers is painted just the same
 * as everything you can see. All three are read off the transcript.
 */

const face = () => {
  const recording = createRecordingContext(COASTER_PRINT);
  paintCoasterPrint(recording.ctx);
  return recording;
};

/** `circleGeometry` maps the disc's radius to half the canvas, so this is the print's edge. */
const RADIUS = COASTER_PRINT.width / 2;
const CENTER = RADIUS;
/** The mug's base against the coaster's: the share of the face the cup stands on. */
const COVERED = 0.044 / COASTER.radius;
/** Where the gauge is struck, as a share of the disc — what separates it from the rings. */
const GAUGE_RADIUS = 0.8;

/** How far from the center a point is, as a fraction of the disc. */
function reach(x: number, y: number): number {
  return Math.hypot(x - CENTER, y - CENTER) / RADIUS;
}

describe("the coaster's face", () => {
  it("keeps every etched point inside the disc", () => {
    const points = face().paths.flatMap((path) => path.points);

    expect(points.length).toBeGreaterThan(0);
    for (const [x, y] of points) expect.soft(reach(x, y)).toBeLessThanOrEqual(1);
  });

  it("etches nothing the mug is standing on", () => {
    const { paths, callsTo } = face();
    // Every ring and every segment of the gauge, by the radius it was struck at.
    const rings = callsTo("arc").map(([, , radius]) => Number(radius) / RADIUS);
    // `arc` records its center, so a tick's two ends are the points worth measuring here.
    const ticks = paths.flatMap((path) => path.points).filter(([x, y]) => reach(x, y) > 0);

    expect(rings.length).toBeGreaterThan(0);
    expect(ticks.length).toBeGreaterThan(0);
    for (const radius of rings) expect.soft(radius).toBeGreaterThan(COVERED);
    for (const [x, y] of ticks) expect.soft(reach(x, y)).toBeGreaterThan(COVERED);
  });

  it("paints one label, clear of the mug's base", () => {
    const [label, ...rest] = face().runs;

    expect(rest).toEqual([]);
    expect(label?.text).toBe(COASTER_LABEL);
    expect(reach(label!.x, label!.y)).toBeGreaterThan(COVERED);
  });

  it("sets the label to clear the ring it is set inside", () => {
    const { runs, callsTo, valuesOf } = face();
    const label = runs[0]!;
    const tracking = Number.parseFloat(String(valuesOf("letterSpacing")[0]));
    const painted = label.width + tracking * (label.text.length - 1);
    const size = Number(/([\d.]+)px/.exec(label.font)?.[1]);
    // The far corner of the type, which on a disc is what reaches the edge first — not the
    // middle of the line, and not its baseline.
    const corner = Math.hypot(painted / 2, label.y - CENTER + size / 2) / RADIUS;
    const bezel = Math.max(...callsTo("arc").map(([, , radius]) => Number(radius) / RADIUS));

    expect(label.align).toBe("center");
    expect(tracking).toBeGreaterThan(0);
    expect(corner).toBeLessThan(bezel);
  });

  it("leaves the label a gap in the tick ring rather than striking through it", () => {
    const { runs, paths, valuesOf } = face();
    const label = runs[0]!;
    const tracking = Number.parseFloat(String(valuesOf("letterSpacing")[0]));
    const painted = label.width + tracking * (label.text.length - 1);
    // The half-angle the type subtends at the radius it is set on, from the disc's center.
    const claimed = Math.atan2(painted / 2, label.y - CENTER);
    const ticks = paths.flatMap((path) => path.points).filter(([x, y]) => reach(x, y) > 0);

    for (const [x, y] of ticks) {
      const fromLabel = Math.abs(Math.atan2(x - CENTER, y - CENTER));
      expect.soft(fromLabel).toBeGreaterThan(claimed);
    }
  });

  it("lights the leading segments of the gauge and leaves the rest spent", () => {
    const { paths, callsTo } = face();
    // An arc records only its center, so the paths holding one line up with the calls.
    const arcs = paths.filter((path) => path.points.every(([x, y]) => reach(x, y) === 0));
    const styles = arcs
      .map((path, index) => ({ path, radius: Number(callsTo("arc")[index]?.[2]) / RADIUS }))
      .filter(({ radius }) => Math.abs(radius - GAUGE_RADIUS) < 0.01)
      .map(({ path }) => path.paints[0]?.style);
    const lit = styles.filter((style) => style === styles[0]);

    expect(styles.length).toBeGreaterThan(2);
    // Lit and spent are two colors of one gauge, and the lit ones come first.
    expect(new Set(styles).size).toBe(2);
    expect(lit.length).toBeGreaterThan(styles.length / 2);
    expect(styles.slice(0, lit.length)).toEqual(lit);
  });
});
