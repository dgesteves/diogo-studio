import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import { createRecordingContext } from "@tests/recording-ctx";

import {
  CHIN,
  DECK_Y,
  CAP_EXTENT,
  DISPLAY,
  drawLegends,
  FOOT_HEIGHT,
  GRILLE_DEPTH,
  GRILLE_WIDTH,
  GRILLE_X,
  KEY_FIELD,
  KEY_GAP,
  KEYCAPS,
  LID_ANGLE,
  MACBOOK_BASE,
  MACBOOK_DISPLAY,
  MACBOOK_LID,
  PORT_Y,
  PORTS,
  TRACKPAD,
  TRACKPAD_Z,
  WELL,
  WELL_Z,
} from "./macbook";
import { createSlabBody } from "./slab";

/**
 * The deck, which is the half of this machine `slab.test.ts` says nothing about. Four things
 * are set into one silver plate and none of them can overlap, run off its edge or sit where
 * another one already is — and every one of those failures renders as a plausible laptop with
 * a slightly wrong deck, which is the kind of thing nobody sees until it is next to the real
 * one. The keyboard is the same case one level down: the rows have to agree on a width they
 * are never told, because a row that comes out 14 units wide is simply a narrower keyboard.
 */

/** A part lying on the deck, as the box it occupies in plan. */
type Footprint = { readonly key: string; width: number; depth: number; x?: number; z: number };

const PARTS: readonly Footprint[] = [
  { key: "key well", width: WELL.width, depth: WELL.depth, z: WELL_Z },
  { key: "trackpad", width: TRACKPAD.width, depth: TRACKPAD.depth, z: TRACKPAD_Z },
  { key: "left grille", width: GRILLE_WIDTH, depth: GRILLE_DEPTH, x: -GRILLE_X, z: WELL_Z },
  { key: "right grille", width: GRILLE_WIDTH, depth: GRILLE_DEPTH, x: GRILLE_X, z: WELL_Z },
];

function plan({ width, depth, x = 0, z }: Footprint): Box3 {
  return new Box3(
    new Vector3(x - width / 2, 0, z - depth / 2),
    new Vector3(x + width / 2, 0, z + depth / 2),
  );
}

describe("the laptop's deck", () => {
  it("stands on its feet rather than on the table", () => {
    const body = createSlabBody(MACBOOK_BASE);
    body.computeBoundingBox();

    expect(FOOT_HEIGHT).toBeGreaterThan(0);
    expect(DECK_Y).toBeCloseTo(FOOT_HEIGHT + MACBOOK_BASE.thickness, 6);
    expect((body.boundingBox?.max.z ?? 0) + MACBOOK_BASE.fillet).toBeCloseTo(
      MACBOOK_BASE.thickness,
      6,
    );
  });

  it("keeps every part it carries on the plate", () => {
    const half = { x: MACBOOK_BASE.width / 2, z: MACBOOK_BASE.length / 2 };

    for (const part of PARTS) {
      const box = plan(part);
      expect.soft(box.min.x, part.key).toBeGreaterThan(-half.x);
      expect.soft(box.max.x, part.key).toBeLessThan(half.x);
      expect.soft(box.min.z, part.key).toBeGreaterThan(-half.z);
      expect.soft(box.max.z, part.key).toBeLessThan(half.z);
    }
  });

  it("never lets two of them share the same square millimeter", () => {
    for (const [index, part] of PARTS.entries()) {
      for (const other of PARTS.slice(index + 1)) {
        expect
          .soft(plan(part).intersectsBox(plan(other)), `${part.key} × ${other.key}`)
          .toBe(false);
      }
    }
  });

  /** Front to back, which is the order a laptop has and the one thing a reader checks. */
  it("puts the trackpad in front of the keys and the keys in front of the hinge", () => {
    expect(TRACKPAD_Z).toBeGreaterThan(WELL_Z);
    expect(WELL_Z).toBeLessThan(0);
  });

  it("sets the grilles either side of the keys, matched", () => {
    expect(GRILLE_WIDTH).toBeGreaterThan(0.015);
    expect(GRILLE_X - GRILLE_WIDTH / 2).toBeGreaterThan(WELL.width / 2);
  });
});

describe("the laptop's keyboard", () => {
  const rows = Map.groupBy(KEYCAPS, (cap) => cap.id.split(":")[0]);

  it("gives every row the same width, which is the one number no row is told", () => {
    for (const [name, caps] of rows) {
      const left = Math.min(...caps.map((cap) => cap.x - cap.width / 2));
      const right = Math.max(...caps.map((cap) => cap.x + cap.width / 2));

      expect.soft(right - left, name).toBeCloseTo(CAP_EXTENT.width, 6);
    }
  });

  /**
   * The field is measured in pitch and a cap is a gap narrower than its pitch, so the block
   * the board actually covers is short by the one gap its two end caps give up between them.
   * Cutting the well around the pitch instead is a 2 mm band of black on all four sides that
   * nothing stands in, and it is what makes a keyboard look small in its own well.
   */
  it("cuts the well around the block the caps cover, not the pitch they sit on", () => {
    expect(CAP_EXTENT.width).toBeCloseTo(KEY_FIELD.width - KEY_GAP, 6);
    expect(WELL.width).toBeGreaterThan(CAP_EXTENT.width);
    expect(WELL.width - CAP_EXTENT.width).toBeLessThan(KEY_GAP * 3);
    expect(WELL.depth - CAP_EXTENT.depth).toBeLessThan(KEY_GAP * 3);
  });

  it("fits the whole field inside the well, with a margin on all four sides", () => {
    for (const cap of KEYCAPS) {
      expect.soft(Math.abs(cap.x) + cap.width / 2, cap.id).toBeLessThan(WELL.width / 2);
      // Both are the field's own frame, which the well is placed in: a cap's `z` is measured
      // from the middle of the well rather than the middle of the machine.
      expect.soft(Math.abs(cap.z) + cap.depth / 2, cap.id).toBeLessThan(WELL.depth / 2);
    }
    expect(KEY_FIELD.width).toBeLessThan(WELL.width);
    expect(KEY_FIELD.depth).toBeLessThan(WELL.depth);
  });

  it("leaves a gap between every neighboring pair of caps", () => {
    const byRow = Map.groupBy(KEYCAPS, (cap) => `${cap.z.toFixed(5)}`);

    for (const caps of byRow.values()) {
      const sorted = [...caps].sort((a, b) => a.x - b.x);
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1]!;
        const cap = sorted[index]!;
        expect.soft(cap.x - cap.width / 2, cap.id).toBeGreaterThan(previous.x + previous.width / 2);
      }
    }
  });

  /**
   * The inverted T, and the reason the rows are not just a table of widths: the middle column
   * is one unit carrying two caps of half the depth, which is the block a visitor recognizes
   * the bottom right of a Mac keyboard by. Built as four full keys it is a row of four.
   */
  it("splits the arrow cluster's middle column across the row", () => {
    const arrows = KEYCAPS.filter((cap) => cap.id.includes(":arrow-"));
    const stacked = arrows.filter((cap) => /arrow-(up|down)$/.test(cap.id));
    const full = arrows.filter((cap) => /arrow-(left|right)$/.test(cap.id));

    expect(arrows).toHaveLength(4);
    expect(new Set(stacked.map((cap) => cap.x)).size).toBe(1);
    expect(stacked[0]!.depth).toBeLessThan(full[0]!.depth / 2 + 0.001);
    expect(stacked[0]!.z).not.toBeCloseTo(stacked[1]!.z, 5);
    expect(full[0]!.x).toBeLessThan(stacked[0]!.x);
    expect(full[1]!.x).toBeGreaterThan(stacked[0]!.x);
  });
});

describe("the laptop's lid", () => {
  it("opens past upright, so the panel leans back rather than over the keys", () => {
    expect(LID_ANGLE).toBeGreaterThan(Math.PI / 2);
    expect(LID_ANGLE).toBeLessThan(Math.PI * 0.7);
  });

  it("borders the panel the way the machine does — even sides, a deeper chin", () => {
    const side = (MACBOOK_LID.width - MACBOOK_DISPLAY.width) / 2;
    const top = MACBOOK_LID.length - CHIN - MACBOOK_DISPLAY.length;

    expect(side).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(0);
    expect(CHIN).toBeGreaterThan(top);
    // A chin more than a bezel and a half deep is a laptop from before this one.
    expect(CHIN).toBeLessThan(side * 3);
  });

  /** A canvas of a different ratio than the panel paints the whole desktop stretched. */
  it("paints the desktop on a canvas of the panel's own shape", () => {
    expect(DISPLAY.canvasAspect / DISPLAY.aspect).toBeCloseTo(1, 2);
  });
});

describe("the laptop's ports", () => {
  const wall = MACBOOK_BASE.width / 2;
  const straight = wall - MACBOOK_BASE.cornerRadius;
  const flat = {
    low: FOOT_HEIGHT + MACBOOK_BASE.fillet,
    high: FOOT_HEIGHT + MACBOOK_BASE.thickness - MACBOOK_BASE.fillet,
  };

  it("keeps every one on the flat of its wall, clear of both chamfers", () => {
    for (const port of PORTS) {
      expect.soft(PORT_Y - port.height / 2, port.key).toBeGreaterThan(flat.low);
      expect.soft(PORT_Y + port.height / 2, port.key).toBeLessThan(flat.high);
    }
  });

  /** Past the corner the wall has begun turning away, and a slot cut there reads as a scratch. */
  it("keeps every one clear of the corner radius", () => {
    for (const port of PORTS) {
      expect.soft(Math.abs(port.z) + port.length / 2, port.key).toBeLessThan(straight);
    }
  });

  it("hangs them off both walls rather than crowding one", () => {
    const sides = new Set(PORTS.map((port) => port.side));

    expect(sides).toEqual(new Set([-1, 1]));
  });

  it("never overlaps two slots in the same wall", () => {
    for (const side of [-1, 1] as const) {
      const wallPorts = [...PORTS.filter((port) => port.side === side)].sort((a, b) => a.z - b.z);
      for (let index = 1; index < wallPorts.length; index += 1) {
        const previous = wallPorts[index - 1]!;
        const port = wallPorts[index]!;
        expect
          .soft(port.z - port.length / 2, port.key)
          .toBeGreaterThan(previous.z + previous.length / 2);
      }
    }
  });
});

/**
 * The legends. They are printed by walking the same array the caps are instanced from, so the
 * failure this guards is not a missing label but a **misplaced** one: a legend is laid over
 * the caps as one texture, and an off-by-one in the walk prints the whole board a key to the
 * left with every other assertion here still passing.
 */
describe("the laptop's backlight", () => {
  const printed = (): ReturnType<typeof createRecordingContext> => {
    const recording = createRecordingContext({ width: 830, height: 323 });
    drawLegends(recording.ctx);
    return recording;
  };

  const marked = KEYCAPS.filter((cap) => cap.label);

  it("prints exactly the keys that carry a legend, and nothing else", () => {
    // Twice each: the glow and then the glyph on top of it.
    expect(printed().runs.map((run) => run.text)).toEqual(
      marked.flatMap((cap) => [cap.label, cap.label]),
    );
  });

  it("prints each one over the key it belongs to", () => {
    const { runs } = printed();

    runs.forEach((run, index) => {
      const cap = marked[Math.floor(index / 2)]!;
      const x = ((cap.x + KEY_FIELD.width / 2) / KEY_FIELD.width) * 830;
      const y = ((cap.z + KEY_FIELD.depth / 2) / KEY_FIELD.depth) * 323;

      expect.soft(run.x / x, cap.id).toBeCloseTo(1, 1);
      expect.soft(run.y / y, cap.id).toBeCloseTo(1, 1);
      expect.soft(run.align, cap.id).toBe("center");
    });
  });

  /**
   * Two sizes, and both come off the key rather than off a stylesheet: the function row is
   * half the depth of the rows below it, and a word needs less of a cap than a single glyph
   * does or it runs off the one it is printed on.
   */
  it("sizes each legend from the key it is printed on", () => {
    const { runs } = printed();
    const size = (text: string): number =>
      Number.parseFloat(runs.find((run) => run.text === text)?.font ?? "0");

    expect(size("F5")).toBeLessThan(size("G"));
    expect(size("fn")).toBeLessThan(size("Z"));
  });

  /**
   * The glow is a *faint* pass under a sharp one, and both halves of that matter. The room
   * blooms the whole frame and bloom works on area, so 76 glyphs each wearing a full-strength
   * halo blooms as one lit rectangle rather than 76 lit keys — which is how the board first
   * arrived in the lounge, reading as a light gray plate brighter than the palm rest.
   */
  it("lays a faint glow under each glyph rather than around it", () => {
    const { valuesOf } = printed();
    const blurs = valuesOf("shadowBlur").map(Number);
    const alphas = valuesOf("globalAlpha").map(Number);

    expect(valuesOf("shadowColor")[0]).toBe(valuesOf("fillStyle")[0]);
    // Set in pairs, glow then glyph: the blur is dropped for the second and the alpha raised.
    expect(blurs.filter((blur) => blur > 0)).toHaveLength(blurs.length / 2);
    expect(Math.min(...alphas)).toBeLessThan(0.5);
    expect(Math.max(...alphas)).toBe(1);
  });
});
