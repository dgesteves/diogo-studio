import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import {
  CITY_TOWERS,
  createCityGeometry,
  FLOOR_HEIGHT,
  IN_FRAME_RISE,
  IN_FRAME_SPREAD,
  STREET_Y,
  type TowerSpec,
} from "./city";
import { CITY_WINDOW, ROOM } from "../room";

/**
 * The skyline, read back out of the buffers rather than off a render.
 *
 * Two kinds of mistake are worth this file, and neither shows up as an error at runtime.
 *
 * **Winding.** Every face in the city is emitted from one footprint ring, so reversing that
 * ring turns all of them at once: the towers render as their own interiors and the roofs face
 * the pavement. Both still fill their silhouette and still catch the light, so the city looks
 * built and reads subtly wrong — which is exactly how it shipped the first time. What catches
 * it is the extremes: the face at the greatest x has to point along +x, and the highest cap
 * along +y.
 *
 * **Framing.** The composition is authored against two ratios, and a tower that breaks them is
 * either invisible from every camera the room allows or crops the reveal it was meant to stand
 * inside. Those are decisions in a table of thirty-two rows, so they are checked here instead
 * of re-derived by hand.
 */

const geometry = createCityGeometry();

/** The three cladding buffers. Which one a tower lands in is `TowerSpec.clad`. */
const WALLS = ["facades", "masonry", "ribbons"] as const;

type Triangle = { normal: Vector3; centroid: Vector3 };

function trianglesOf(name: keyof ReturnType<typeof createCityGeometry>): Triangle[] {
  const source = geometry[name];
  const position = source.getAttribute("position");
  const index = source.getIndex();
  if (!index) throw new Error(`${name} is not indexed`);

  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const triangles: Triangle[] = [];
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(position, index.getX(i));
    b.fromBufferAttribute(position, index.getX(i + 1));
    c.fromBufferAttribute(position, index.getX(i + 2));
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
    const centroid = new Vector3().add(a).add(b).add(c).divideScalar(3);
    triangles.push({ normal, centroid });
  }
  return triangles;
}

/** The triangle whose centroid sits furthest along an axis — the outermost face on that side. */
function extreme(triangles: readonly Triangle[], axis: "x" | "y" | "z", sign: 1 | -1): Triangle {
  return triangles.reduce((best, triangle) =>
    triangle.centroid[axis] * sign > best.centroid[axis] * sign ? triangle : best,
  );
}

function topOf(spec: TowerSpec): number {
  return STREET_Y + spec.floors * FLOOR_HEIGHT;
}

describe("the city's geometry", () => {
  it("builds three walls, a roof, a crown and a beacon buffer, all indexed", () => {
    for (const name of [...WALLS, "roofs", "crowns", "beacons"] as const) {
      expect.soft(geometry[name].getIndex()?.count ?? 0).toBeGreaterThan(0);
      expect.soft(geometry[name].getAttribute("color").count).toBeGreaterThan(0);
    }
    // Only the walls are textured; the rest carry their finish in the vertex color.
    for (const name of WALLS) expect.soft(geometry[name].getAttribute("uv")).toBeDefined();
    expect(geometry.roofs.getAttribute("uv")).toBeUndefined();
  });

  /**
   * The winding check has to read all three walls at once rather than one of them. Every tower
   * is emitted through the same code either way, but which buffer a face lands in is decided
   * by its cladding — so checking `facades` alone leaves the extreme face unread whenever the
   * outermost tower on a side happens to wear stone or concrete.
   */
  it("turns every outermost facade outward", () => {
    const triangles = WALLS.flatMap((name) => trianglesOf(name));

    expect(extreme(triangles, "x", 1).normal.x).toBeGreaterThan(0.5);
    expect(extreme(triangles, "x", -1).normal.x).toBeLessThan(-0.5);
    expect(extreme(triangles, "z", 1).normal.z).toBeGreaterThan(0.5);
    expect(extreme(triangles, "z", -1).normal.z).toBeLessThan(-0.5);
  });

  it("stands the facades up and lays the roofs flat", () => {
    for (const { normal } of WALLS.flatMap((name) => trianglesOf(name))) {
      // A taper leans a wall, but never off the vertical by more than a wall's worth.
      expect.soft(Math.abs(normal.y)).toBeLessThan(0.5);
    }
    // The topmost roof triangle is a mast wall, not a cap, so the caps are picked out by
    // being horizontal at all — and every one of them has to face the sky.
    const caps = trianglesOf("roofs").filter(({ normal }) => Math.abs(normal.y) > 0.9);
    expect(caps.length).toBeGreaterThan(CITY_TOWERS.length);
    for (const cap of caps) expect.soft(cap.normal.y).toBeGreaterThan(0.9);
  });

  it("keeps the whole city outside the window wall and above the street", () => {
    const bounds = geometry.facades.boundingSphere;
    expect(bounds).not.toBeNull();

    for (const { centroid } of WALLS.flatMap((name) => trianglesOf(name))) {
      expect.soft(centroid.x).toBeLessThan(ROOM.minX);
      expect.soft(centroid.y).toBeGreaterThanOrEqual(STREET_Y);
    }
  });

  it("paints the same city on every load", () => {
    const again = createCityGeometry();

    expect(Array.from(again.facades.getAttribute("position").array)).toEqual(
      Array.from(geometry.facades.getAttribute("position").array),
    );
    expect(Array.from(again.facades.getAttribute("uv").array)).toEqual(
      Array.from(geometry.facades.getAttribute("uv").array),
    );
  });
});

describe("the skyline's composition", () => {
  it("names every tower once", () => {
    const keys = CITY_TOWERS.map((tower) => tower.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  /**
   * Every sheet has to be worn by enough towers to be seen, and no sheet by so many that it is
   * the city's one look — which is the failure the second and third sheets were added to fix.
   * The reveal only ever shows a handful of buildings at once, so a cladding on three of fifty
   * is a cladding most cameras never find.
   */
  it("spreads the three claddings across the skyline", () => {
    const worn = CITY_TOWERS.map((tower) => tower.clad ?? "glass");

    for (const clad of ["glass", "stone", "ribbon"] as const) {
      const share = worn.filter((candidate) => candidate === clad).length / worn.length;
      expect.soft(`${clad}: ${share > 0.15 && share < 0.55}`).toBe(`${clad}: true`);
    }
  });

  it("keeps the composed skyline inside the reveal", () => {
    for (const tower of CITY_TOWERS.filter((candidate) => !candidate.flank)) {
      const reach = Math.abs(tower.side) - tower.width / 2;
      expect
        .soft(`${tower.key}: ${reach.toFixed(0)}m`)
        .toBe(`${tower.key}: ${Math.min(reach, IN_FRAME_SPREAD * tower.out).toFixed(0)}m`);
    }
  });

  /**
   * The property the composed skyline cannot express: that the city does not run out.
   *
   * Free-look puts a visitor against the glass, and a window seen from 30 cm away is not a
   * frame but a fan — the sightline through its far edge leaves at better than 80° off the
   * normal, and turning your head sweeps the whole of it. Every one of those angles has to
   * land on a building. It used to stop at 47°, so walking to the window and looking along it
   * ran the city out into bare sky, and no station camera could ever see that.
   *
   * So this measures coverage rather than placement: each tower's angular span from the
   * window, unioned per side, checked for holes. A tower moved or resized closes or opens a
   * gap that nothing else here would notice.
   */
  const REACH_DEG = { back: 84, front: 74 } as const;
  const MAX_GAP_DEG = 2;

  function spansToward(sign: -1 | 1): { lo: number; hi: number }[] {
    return CITY_TOWERS.flatMap((tower) => {
      const near = Math.abs(tower.side) - tower.width / 2;
      // A tower straddling the centerline covers the first degrees of both sides.
      if (tower.side * sign < 0 && near > 0) return [];
      const angle = (lateral: number): number =>
        (Math.atan(Math.max(lateral, 0) / tower.out) * 180) / Math.PI;
      return [{ lo: angle(near), hi: angle(Math.abs(tower.side) + tower.width / 2) }];
    }).sort((a, b) => a.lo - b.lo);
  }

  function firstGap(sign: -1 | 1, reach: number): string {
    let covered = 0;
    for (const span of spansToward(sign)) {
      if (span.lo > covered + MAX_GAP_DEG) break;
      covered = Math.max(covered, span.hi);
    }
    return covered >= reach ? "none" : `sky from ${covered.toFixed(0)}° to ${reach}°`;
  }

  it("leaves no wedge of sky between the towers, either way along the glass", () => {
    expect(firstGap(-1, REACH_DEG.back)).toBe("none");
    expect(firstGap(1, REACH_DEG.front)).toBe("none");
  });

  /**
   * A neighbor shorter than this floor is one the room looks over, so it fills nothing. The
   * oblique families are read almost horizontally and have to clear the window outright.
   */
  it("builds the oblique towers tall enough to reach the window", () => {
    const grazing = CITY_TOWERS.filter(
      (tower) => tower.flank && Math.abs(tower.side) / tower.out > 1,
    );

    expect(grazing.length).toBeGreaterThan(4);
    for (const tower of grazing) {
      expect
        .soft(`${tower.key} tops out at ${topOf(tower) > CITY_WINDOW.centerY}`)
        .toBe(`${tower.key} tops out at true`);
    }
  });

  /**
   * The pair that crop the opening are the view's only parallax, so they are deliberately over
   * the line. Everything behind them is under it — that is what leaves sky above the skyline,
   * and it is the property the first pass of this view did not have.
   */
  it("crops the reveal with the near pair and nothing else", () => {
    const cropping = CITY_TOWERS.filter(
      (tower) => !tower.flank && topOf(tower) > ROOM.wallCenterY + IN_FRAME_RISE * tower.out,
    ).map((tower) => tower.key);

    expect(cropping).toEqual(["spire", "ledge"]);
  });

  it("leaves the shorter buildings' roofs in shot below the horizon", () => {
    const lookedDownOn = CITY_TOWERS.filter((tower) => topOf(tower) < 0);

    expect(lookedDownOn.length).toBeGreaterThan(2);
    // A roof only reads as a roof if it is dressed as one.
    expect(lookedDownOn.filter((tower) => tower.mech).length).toBeGreaterThan(1);
  });
});
