import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import {
  createGrilleGeometry,
  createSoundbarGeometry,
  GRILLE_PANEL,
  GRILLE_PANEL_X,
  PERFORATION_SPAN,
  SOUNDBAR,
  soundbarSection,
} from "./soundbar";

/**
 * The bar's own measurements, none of which fails loudly. `ExtrudeGeometry` grows its section
 * outward by the bevel and starts its run at `-bevelThickness`, so a cabinet fed the finished
 * outline comes out oversized and hanging a fillet off one end of the console — which renders
 * as a plausible dark bar and is invisible in every other assertion in the suite.
 *
 * Measured in the geometry's own frame, which is the section's: `x` runs front to back, `y` is
 * the bar's height and the extrusion runs along `z`. The mesh turns it a quarter so `z` becomes
 * the room's `x` — asserting the turned mesh would be asserting R3F rather than the model.
 */
function boundsOf(geometry: { computeBoundingBox: () => void; boundingBox: Box3 | null }): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

describe("the soundbar's cabinet", () => {
  const cabinet = boundsOf(createSoundbarGeometry());

  it("comes out the size of the bar rather than the size of its section", () => {
    const size = cabinet.getSize(new Vector3());

    expect(size.x).toBeCloseTo(SOUNDBAR.depth, 6);
    expect(size.y).toBeCloseTo(SOUNDBAR.height, 6);
    expect(size.z).toBeCloseTo(SOUNDBAR.length, 6);
  });

  /** Stood on the console by its own bottom, and centered on the cabinet it stands on. */
  it("stands on zero and is centered along its length", () => {
    expect(cabinet.min.y).toBeCloseTo(0, 6);
    expect(cabinet.min.z).toBeCloseTo(-SOUNDBAR.length / 2, 6);
    expect(cabinet.max.z).toBeCloseTo(SOUNDBAR.length / 2, 6);
  });

  /**
   * Two groups, in the order the materials are attached to the mesh: the end caps are the
   * shape's own faces and come first, the wrap that carries the perforation is second. Swap
   * them and the flat cap finish is painted over the whole bar and the holes onto the ends.
   */
  it("splits the ends from the wrap so each takes its own material", () => {
    const groups = createSoundbarGeometry().groups;

    expect(groups.map((group) => group.materialIndex)).toEqual([0, 1]);
    expect(groups[1]!.count).toBeGreaterThan(groups[0]!.count);
  });
});

describe("the soundbar's section", () => {
  it("is drawn front to back across the bar's depth and up its height", () => {
    const points = soundbarSection().getPoints(64);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.max(...xs)).toBeCloseTo(SOUNDBAR.depth / 2, 6);
    expect(Math.min(...xs)).toBeCloseTo(-SOUNDBAR.depth / 2, 6);
    expect(Math.max(...ys)).toBeCloseTo(SOUNDBAR.height, 6);
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
  });

  /**
   * The front rolls over and the back stays square: it is the difference between the two pairs
   * of radii that makes this a soundbar rather than a lozenge, and an inset that flattened
   * them all to the same floor would take it back to one.
   */
  it("turns harder at the front than at the back, inset or not", () => {
    for (const inset of [0, SOUNDBAR.endFillet]) {
      const points = soundbarSection(inset).getPoints(96);
      const top = Math.max(...points.map((point) => point.y));
      const front = Math.max(...points.map((point) => point.x));
      const flatTop = points.filter((point) => Math.abs(point.y - top) < 1e-6);
      const flatFront = points.filter((point) => Math.abs(point.x - front) < 1e-6);

      // The top runs back past the middle; the front face barely exists.
      expect.soft(Math.min(...flatTop.map((point) => point.x))).toBeLessThan(0);
      const frontRun =
        Math.max(...flatFront.map((point) => point.y)) -
        Math.min(...flatFront.map((point) => point.y));
      expect.soft(frontRun).toBeLessThan(SOUNDBAR.height / 2);
    }
  });
});

describe("the perforation", () => {
  /**
   * `ExtrudeGeometry` lays the wall UVs out in meters, so the repeat is tiles per meter and a
   * span read as anything else puts holes a centimeter apart or a tenth of a millimeter.
   */
  it("tiles at the pitch of a real grille", () => {
    const pitch = PERFORATION_SPAN / 8;

    expect(pitch).toBeGreaterThan(0.002);
    expect(pitch).toBeLessThan(0.004);
  });
});

describe("the front grille", () => {
  /**
   * Three panels with a rib of body between them, which is what a bar looks like from a sofa
   * and the one feature of this object still legible when the whole of it is 200 px wide.
   */
  it("divides the front into three panels that stay inside the bar", () => {
    const span = GRILLE_PANEL_X.map((x) => [
      x - GRILLE_PANEL.length / 2,
      x + GRILLE_PANEL.length / 2,
    ]);

    expect(span).toHaveLength(3);
    expect(span[0]![0]!).toBeGreaterThan(-SOUNDBAR.length / 2);
    expect(span[2]![1]!).toBeLessThan(SOUNDBAR.length / 2);
    // A rib between each pair, or the three read as one long panel.
    expect(span[1]![0]!).toBeGreaterThan(span[0]![1]!);
    expect(span[2]![0]!).toBeGreaterThan(span[1]![1]!);
  });

  /**
   * The panel is the section's own front arc thickened, so it can only be right if it stands
   * *outside* the wrap it is set into and stops short of the wrap's top and bottom. Sunk
   * inside, it is a black panel nothing ever sees; run to the full height, it stops reading as
   * a panel let into a body and becomes a second bar.
   */
  it("hugs the front of the section rather than standing off it", () => {
    const panel = boundsOf(createGrilleGeometry());
    const bar = boundsOf(createSoundbarGeometry());

    expect(panel.max.x).toBeGreaterThan(bar.max.x);
    expect(panel.max.x - bar.max.x).toBeLessThan(0.002);
    expect(panel.min.y).toBeGreaterThan(bar.min.y);
    expect(panel.max.y).toBeLessThan(bar.max.y);
  });
});
