import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { ROOM } from "../room";
import { worldStations } from "../stations";
import { LOUNGE_ORIGIN, TV_CONSOLE } from "./lounge";
import {
  RUBBER_POT,
  SNAKE_POT,
  aloeBladeSheets,
  pothosBladeSheets,
  pothosStemSheets,
  rubberBladeSheets,
  rubberStemSheets,
  snakeBladeSheets,
  soilTop,
} from "./plant";
import { BACK_WALL_PLANT } from "./props";
import { createShell, type Sheet } from "./shell";
import { POTHOS_ANCHOR, WALL_SHELF_DEPTH, WALL_SHELVES, shelfTop } from "./shelving";

/**
 * Four plants, and everything that can go wrong with any of them is silent. A blade grows
 * through the shelf plank beside it; a vine falls through the one below; a stem winds inside
 * out and renders as a stem-shaped hole; a rosette on a desk quietly becomes a tree. None of it
 * throws, and in a room this dark none of it is obvious in a screenshot either.
 */

/**
 * A sheet is a continuous surface, so a test may sample it as finely as the question needs —
 * at the rendered resolution for extents, denser for anything measuring a distance to it.
 */
function pointsOf(sheets: readonly Sheet[], density = 1): readonly Vector3[] {
  const points: Vector3[] = [];

  for (const sheet of sheets) {
    const rows = sheet.rows * density;
    const columns = sheet.columns * density;
    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        points.push(sheet.point(row / rows, column / columns));
      }
    }
  }

  return points;
}

/** Every vertex of a plant, moved out of its pot's frame and into the room's. */
function placed(sheets: readonly Sheet[], at: readonly [number, number, number]): Vector3[] {
  const origin = new Vector3(...at);
  return pointsOf(sheets).map((point) => point.add(origin));
}

const RUBBER = [
  ...placed(rubberStemSheets(), BACK_WALL_PLANT),
  ...placed(rubberBladeSheets(), BACK_WALL_PLANT),
];
const LAB_ANCHOR = worldStations.lab.anchor;
const SNAKE_AT = [LAB_ANCHOR[0], 0, LAB_ANCHOR[2]] as const;
const SNAKE = placed(snakeBladeSheets(), SNAKE_AT);
const POTHOS = [
  ...placed(pothosStemSheets(), POTHOS_ANCHOR),
  ...placed(pothosBladeSheets(), POTHOS_ANCHOR),
];
const ALOE = pointsOf(aloeBladeSheets());

const EVERY_PLANT = { RUBBER, SNAKE, POTHOS, ALOE };

describe("every plant", () => {
  it("puts a finite vertex everywhere it puts a vertex", () => {
    for (const [name, points] of Object.entries(EVERY_PLANT)) {
      const finite = points.every(
        (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
      );
      expect(finite, name).toBe(true);
    }
  });

  /**
   * A tube wound the wrong way round does not throw; it renders as a stem-shaped hole, which is
   * how the chair's panels shipped inside out once. The outermost vertex of a stem has to face
   * away from that stem's own axis. Blades are drawn `DoubleSide` and have no winding to get
   * wrong, which is why only the stems are here.
   */
  it("winds every stem outward", () => {
    for (const stem of [...rubberStemSheets(), ...pothosStemSheets()]) {
      const geometry = createShell([stem]);
      const position = geometry.getAttribute("position");
      const normal = geometry.getAttribute("normal");

      let outermost = 0;
      for (let index = 1; index < position.count; index += 1) {
        if (position.getX(index) > position.getX(outermost)) outermost = index;
      }

      expect.soft(normal.getX(outermost)).toBeGreaterThan(0);
      geometry.dispose();
    }
  });

  it("keeps every plant out of the wall behind it", () => {
    for (const point of [...RUBBER, ...SNAKE, ...POTHOS]) {
      expect.soft(point.z).toBeGreaterThan(ROOM.minZ);
      expect.soft(point.x).toBeGreaterThan(ROOM.minX);
    }
  });
});

describe("the rubber plant, on the back wall", () => {
  it("centers itself in what the shelves and the console leave of that wall", () => {
    const shelvesEnd = Math.max(...WALL_SHELVES.map((shelf) => shelf.centerX + shelf.width / 2));
    const consoleStart = LOUNGE_ORIGIN[0] - TV_CONSOLE.width / 2;

    expect(BACK_WALL_PLANT[0]).toBeGreaterThan(shelvesEnd);
    expect(BACK_WALL_PLANT[0]).toBeLessThan(consoleStart);
    // Close to the wall is the brief, so the pot's back has to be within a hand of it.
    expect(BACK_WALL_PLANT[2] - RUBBER_POT.radius - ROOM.minZ).toBeLessThan(0.2);
  });

  /**
   * The shelves are the near neighbor and their planks run the full depth into the wall, so
   * what protects the plant is not its distance in x — the crown is wider than the gap — but
   * that its leaves hang in front of a plank rather than beside one.
   */
  it("grows in front of the wall shelves rather than through them", () => {
    for (const point of RUBBER) {
      if (point.z > ROOM.minZ + WALL_SHELF_DEPTH) continue;
      for (const shelf of WALL_SHELVES) {
        expect.soft(Math.abs(point.x - shelf.centerX)).toBeGreaterThan(shelf.width / 2);
      }
    }
  });

  it("clears the television's console", () => {
    const start = LOUNGE_ORIGIN[0] - TV_CONSOLE.width / 2;
    const end = LOUNGE_ORIGIN[0] + TV_CONSOLE.width / 2;
    const front = LOUNGE_ORIGIN[2] + TV_CONSOLE.centerZ + TV_CONSOLE.depth / 2;

    for (const point of RUBBER) {
      if (point.y > TV_CONSOLE.height || point.z > front) continue;
      expect.soft(point.x > start && point.x < end).toBe(false);
    }
  });

  /**
   * The brief was a big plant, and it earns that against the room rather than against a number:
   * a crown near the height of the screens it stands between, and a spread wide enough that the
   * wall behind it stops reading as empty.
   */
  it("stands as tall as the fixtures either side of it", () => {
    const top = Math.max(...RUBBER.map((point) => point.y));
    const spread = Math.max(...RUBBER.map((point) => Math.abs(point.x - BACK_WALL_PLANT[0])));

    expect(top).toBeGreaterThan(1.6);
    expect(spread).toBeGreaterThan(0.35);
  });

  it("roots every cane under the soil", () => {
    for (const stem of rubberStemSheets()) {
      const lowest = Math.min(...pointsOf([stem]).map((point) => point.y));
      expect.soft(lowest).toBeLessThan(soilTop(RUBBER_POT));
    }
  });
});

describe("the snake plant, beside the door", () => {
  /**
   * The LAB station has no fixture of its own: its camera is aimed at this plant, and a hotspot
   * pointed at thin air above a pot is the failure. The anchor has to land in the foliage.
   */
  it("grows around the anchor the LAB station points at", () => {
    const anchor = new Vector3(...LAB_ANCHOR);
    const nearest = Math.min(...SNAKE.map((point) => point.distanceTo(anchor)));

    expect(nearest).toBeLessThan(0.25);
    expect(Math.max(...SNAKE.map((point) => point.y))).toBeGreaterThan(LAB_ANCHOR[1]);
  });

  it("stands its blades up out of one pot rather than splaying them across the floor", () => {
    const tips = snakeBladeSheets().map((blade) => blade.point(1, 0.5));
    const bases = snakeBladeSheets().map((blade) => blade.point(0, 0.5));

    for (const base of bases) {
      expect.soft(Math.hypot(base.x, base.z)).toBeLessThan(SNAKE_POT.radius);
    }
    for (const tip of tips) {
      // A blade that has fallen past horizontal reads as a broken one.
      expect.soft(tip.y).toBeGreaterThan(0.5);
    }
  });
});

describe("the pothos, on the middle shelf", () => {
  /**
   * A trailing plant is only trailing if something hangs below the shelf it is on, and the
   * plank underneath is the thing it would hang through. Both have to hold at once.
   */
  it("hangs below its own shelf and through none of the ones under it", () => {
    const lowest = Math.min(...POTHOS.map((point) => point.y));
    expect(lowest).toBeLessThan(POTHOS_ANCHOR[1] - 0.08);

    for (const point of POTHOS) {
      for (const shelf of WALL_SHELVES) {
        if (shelfTop(shelf) >= POTHOS_ANCHOR[1]) continue;
        if (point.y > shelfTop(shelf)) continue;
        if (point.z > ROOM.minZ + WALL_SHELF_DEPTH) continue;
        expect.soft(Math.abs(point.x - shelf.centerX)).toBeGreaterThan(shelf.width / 2);
      }
    }
  });
});

describe("the aloe, on the desk", () => {
  /**
   * Measured in its pot's own frame: a desk plant is only right at one size. Too tall and it
   * reads as a tree on a desk, too wide and it is in the way of the keyboard beside it.
   */
  it("stays the size of a thing that sits on a desk", () => {
    const top = Math.max(...ALOE.map((point) => point.y));
    const reach = Math.max(...ALOE.map((point) => Math.hypot(point.x, point.z)));

    expect(top).toBeLessThan(0.28);
    expect(top).toBeGreaterThan(0.18);
    expect(reach).toBeLessThan(0.14);
  });

  it("radiates its blades instead of pointing them all one way", () => {
    const bearings = aloeBladeSheets().map((blade) => {
      const tip = blade.point(1, 0.5);
      return Math.atan2(tip.z, tip.x);
    });
    const quadrants = new Set(bearings.map((bearing) => Math.round((bearing / Math.PI) * 2)));

    expect(quadrants.size).toBeGreaterThanOrEqual(4);
  });
});
