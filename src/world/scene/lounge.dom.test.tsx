import { afterEach, describe, expect, it } from "vitest";
import { Box3, Vector3, type MeshBasicMaterial, type MeshStandardMaterial, type Mesh } from "three";
import { materialOf, renderScene, unmountScenes, worldBox } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";
import { worldColors } from "../materials";
import { ROOM } from "../room";
import {
  LOUNGE_ORIGIN,
  Lounge,
  SOFA_Z,
  TABLE_TOP_Y,
  TABLE_Z,
  TV_CENTER_Y,
  TV_CONSOLE,
  TV_WALL_Z,
} from "./lounge";
import { REMOTE } from "./remote";
import { SOFA, SOFA_BLOCKS } from "./sofa";

/**
 * The corner of the room a visitor explores rather than navigates to: a sofa facing a
 * television that plays `lounge-tv-channels`. `lounge-tv.test.ts` already asserts what each
 * frame paints and `lounge-tv-texture.dom.test.ts` the clock that drives it, so what is left
 * to this file is the arrangement — that the furniture stands on the floor, inside the room,
 * facing the screen, and that the screen lights itself from the channel it is showing.
 *
 * Positions are read as world boxes rather than local `position` props, because every piece
 * is nested two or three groups deep: a local number that looks right is still wrong if the
 * group above it moved.
 */

const EPSILON = 0.001;

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

afterEach(async () => {
  await unmountScenes();
  stub?.restore();
  stub = undefined;
});

/**
 * The lounge assembles five groups in one fixed order — rug, sofa, table, television, lamp —
 * and three of the claims below are about how two of them stand relative to a third. Read by
 * position in that order rather than by shape: the sofa and the table are both dark boxes.
 */
const PIECE = { rug: 0, sofa: 1, table: 2 } as const;

/** The lounge's own root, which is the first group below the scene. */
function loungeRoot(objects: readonly { type: string }[]) {
  const group = objects.find((object) => object.type === "Group");
  if (!group) throw new Error("The lounge rendered no group");
  return group as unknown as Mesh;
}

/** A mesh's own size, in its own frame — which is where a device's measurements are written. */
function localSize(mesh: Mesh): Vector3 {
  mesh.geometry.computeBoundingBox();
  return (mesh.geometry.boundingBox ?? new Box3()).getSize(new Vector3());
}

async function lounge() {
  stub = stubCanvasContexts();
  return renderScene(<Lounge />);
}

/** The one lit thing on the coffee table: the band of accent recessed under its edge. */
function litChannel(table: { children: readonly object[] }): Mesh {
  const channel = (table.children as readonly Mesh[]).find(
    (child) =>
      child.geometry !== undefined &&
      `#${materialOf<MeshBasicMaterial>(child).color.getHexString()}` === worldColors.accent,
  );
  if (!channel) throw new Error("The coffee table has no lit channel");
  return channel;
}

/** The slab: the widest thing in the group, because every other piece is inset into it. */
function tableTop(table: { children: readonly object[] }): object {
  const span = (piece: object) => {
    const box = worldBox(piece);
    return box.max.x - box.min.x;
  };
  return (table.children as readonly object[]).reduce((widest, child) =>
    span(child) > span(widest) ? child : widest,
  );
}

/** The television's panel, picked by where it hangs rather than by its size. */
function tvScreen(meshes: readonly Mesh[]): Mesh {
  const screen = meshes.find(
    (mesh) =>
      mesh.geometry.type === "PlaneGeometry" &&
      Math.abs(worldBox(mesh).getCenter(new Vector3()).y - (LOUNGE_ORIGIN[1] + TV_CENTER_Y)) < 0.1,
  );
  if (!screen) throw new Error("The television rendered no screen");
  return screen;
}

describe("Lounge", () => {
  /**
   * The whole lounge is placed by one origin and one rotation, so both are asserted the only
   * way that can fail: against the room rather than against themselves. It occupies the back
   * corner — the rug reaches the side wall exactly and the television hangs 0.05 from the back
   * one — so a moved origin either pushes furniture through a wall or leaves the television
   * standing in the middle of the room, and a rotated one swaps the extents and overruns the
   * back wall by 0.4.
   */
  it("stands in the room's back corner, against both walls and through neither", async () => {
    const scene = await lounge();
    const box = worldBox(loungeRoot(scene.objects));

    expect(box.max.x).toBeCloseTo(ROOM.maxX, 1);
    expect(box.min.z).toBeCloseTo(ROOM.minZ, 1);

    expect(box.min.x).toBeGreaterThanOrEqual(ROOM.minX - EPSILON);
    expect(box.max.x).toBeLessThanOrEqual(ROOM.maxX + EPSILON);
    expect(box.min.z).toBeGreaterThanOrEqual(ROOM.minZ - EPSILON);
    expect(box.max.z).toBeLessThanOrEqual(ROOM.maxZ + EPSILON);
    expect(box.max.y).toBeLessThanOrEqual(ROOM.ceilingY);
  });

  it("rests every piece on the floor rather than sinking it into one", async () => {
    const scene = await lounge();

    for (const mesh of scene.meshes) {
      expect(worldBox(mesh).min.y).toBeGreaterThanOrEqual(-EPSILON);
    }
  });

  /**
   * The one thing the arrangement has to get right. Both are placed from `constants.ts`, so
   * a sign flip on either would seat the visitor behind the television with every other
   * assertion in this file still passing.
   */
  it("seats the sofa in front of the television, on the rug", async () => {
    const scene = await lounge();

    const rug = scene.meshesWith("PlaneGeometry")[0];
    const rugBox = worldBox(rug!);
    const seating = worldBox(loungeRoot(scene.objects).children[PIECE.sofa]!);

    expect(SOFA_Z).toBeGreaterThan(TV_WALL_Z);
    expect(TABLE_Z).toBeGreaterThan(TV_WALL_Z);
    expect(TABLE_Z).toBeLessThan(SOFA_Z);

    expect(seating.min.x).toBeGreaterThanOrEqual(rugBox.min.x - EPSILON);
    expect(seating.max.x).toBeLessThanOrEqual(rugBox.max.x + EPSILON);
    expect(seating.min.z).toBeGreaterThanOrEqual(rugBox.min.z - EPSILON);
    expect(seating.max.z).toBeLessThanOrEqual(rugBox.max.z + EPSILON);
  });

  /**
   * `SOFA_X` derives the piece's place from the wall rather than typing it, which is what
   * makes it survive a re-proportioned sectional — so the claim is that the outer arm stands
   * against the wall and not through it. The rug reaches the wall exactly, so no assertion
   * about the lounge as a whole can see this: only the sofa's own box can.
   */
  it("pushes the sofa's outer arm against the right wall, clear of it by a reveal", async () => {
    const scene = await lounge();
    const seating = worldBox(loungeRoot(scene.objects).children[PIECE.sofa]!);

    expect(ROOM.maxX - seating.max.x).toBeGreaterThan(0);
    expect(ROOM.maxX - seating.max.x).toBeLessThan(0.05);
  });

  /**
   * The sectional is an L, and the sofa's own world box is the box of the L's bounds — most of
   * which is the empty floor the coffee table stands in. So "the table is not inside the sofa"
   * cannot be asked of that box: it overlaps by design. It has to be asked of the chaise, the
   * arm that turns the corner, which is why the chaise is picked back out of the blocks here
   * rather than assumed to be some width typed into this file.
   *
   * Two numbers pay for the clearance and neither is obviously about the table: the sofa's own
   * place against the wall, which carries the chaise `+x` past the table's reach, and `SOFA_Z`,
   * which carries its front behind the table's. Move either back and the table stands inside
   * the chaise, which renders as a plausible lounge until you look at where the legs go.
   */
  it("keeps the coffee table clear of the chaise it now shares the rug with", async () => {
    const scene = await lounge();
    const pieces = loungeRoot(scene.objects).children;
    const seating = worldBox(pieces[PIECE.sofa]!);
    const table = worldBox(pieces[PIECE.table]!);

    // The sofa is centered on its own `x` and placed by its back face, so those two edges of
    // its world box are where its local origin is — which is what turns a block into a room.
    const origin = new Vector3(seating.max.x - SOFA.width / 2, 0, seating.max.z);
    const overhang = SOFA_BLOCKS.filter(
      (block) => block.center[2] - block.size[2] / 2 < -SOFA.runDepth,
    );
    const chaise = new Box3();
    for (const block of overhang) {
      const half = new Vector3(...block.size).multiplyScalar(0.5);
      const center = origin.clone().add(new Vector3(...block.center));
      chaise.expandByPoint(center.clone().sub(half));
      chaise.expandByPoint(center.clone().add(half));
    }

    expect(SOFA.depth).toBeGreaterThan(SOFA.runDepth + 0.4);
    expect(overhang.length).toBeGreaterThan(0);
    expect(chaise.intersectsBox(table)).toBe(false);
  });

  /**
   * The sofa is as far back as the lounge band allows, and "as far back as it goes" is only
   * true while both walkways survive: the console's front face, a gap, the table, a gap, the
   * seats. Pushing the sofa back again without moving the table takes it out of the second
   * one, which renders as a coffee table wedged against a shin.
   */
  it("leaves a walkway on both sides of the coffee table", async () => {
    const scene = await lounge();
    const pieces = loungeRoot(scene.objects).children;
    const table = worldBox(pieces[PIECE.table]!);
    const consoleFront = LOUNGE_ORIGIN[2] + TV_CONSOLE.centerZ + TV_CONSOLE.depth / 2;
    const runFront = LOUNGE_ORIGIN[2] + SOFA_Z - SOFA.runDepth;

    expect(table.min.z - consoleFront).toBeGreaterThan(0.2);
    expect(runFront - table.max.z).toBeGreaterThan(0.2);
  });

  it("lights the screen from the channel it is showing", async () => {
    const scene = await lounge();

    const screen = tvScreen(scene.meshes);
    const material = materialOf<MeshStandardMaterial>(screen);

    expect(material.map).not.toBeNull();
    // One texture, two slots: a screen that is only `map` stays as dark as the room.
    expect(material.emissiveMap).toBe(material.map);
    expect(material.emissiveIntensity).toBe(1);
    expect(material.toneMapped).toBe(false);
    expect(worldBox(screen).getCenter(new Vector3()).z).toBeCloseTo(
      LOUNGE_ORIGIN[2] + TV_WALL_Z,
      1,
    );
  });

  it("spills the television's light into the room in the accent color", async () => {
    const scene = await lounge();
    const screenZ = worldBox(tvScreen(scene.meshes)).getCenter(new Vector3()).z;

    // Picked by height: the coffee table's underglow is the other accent light in the corner.
    const accent = scene
      .lightsOfType("PointLight")
      .filter(
        (light) =>
          `#${light.color.getHexString()}` === worldColors.accent &&
          light.getWorldPosition(new Vector3()).y > 1,
      );

    expect(accent).toHaveLength(1);
    // In front of the screen, or the glow lands behind the wall.
    expect(accent[0]!.getWorldPosition(new Vector3()).z).toBeGreaterThan(screenZ);
  });

  it("lights the lamp with the shared cool-light token, not a literal", async () => {
    const scene = await lounge();

    const cool = scene
      .lightsOfType("PointLight")
      .filter((light) => `#${light.color.getHexString()}` === worldColors.coolLight);

    expect(cool).toHaveLength(2);
    expect(cool.map((light) => light.intensity).sort()).toEqual([0.5, 1.1]);
  });

  /** The blade is lit on both faces; one strip means a lamp that is dark from the sofa. */
  it("faces the lamp's light strips both ways across the blade", async () => {
    const scene = await lounge();

    const strips = scene.meshes.filter(
      (mesh) =>
        mesh.geometry.type === "BoxGeometry" &&
        `#${materialOf<MeshBasicMaterial>(mesh).color.getHexString()}` === worldColors.coolLight,
    );

    expect(strips).toHaveLength(2);
    const [front, back] = strips.map((strip) => strip.position.z);
    expect(front).toBeCloseTo(-back!);
  });

  it("rides the soundbar on top of the console instead of inside it", async () => {
    const scene = await lounge();

    // The bar is the one mesh in the room wearing two materials — flat ends and a perforated
    // wrap — which picks it out of a corner that is otherwise all dark boxes without asking
    // where it is. Picking on size alone found the laptop's lid the day that was built.
    const wrap = scene.meshes.find((mesh) => Array.isArray(mesh.material));
    // The soundbar is handed a `topY` and places itself; the console it belongs to is the
    // sibling of its own group, which is what makes this a claim about that number.
    const soundbar = wrap!.parent!;
    const cabinet = soundbar.parent!.children.find(
      (child): child is Mesh => (child as Mesh).geometry?.type === "ExtrudeGeometry",
    );

    expect(worldBox(soundbar).min.y).toBeGreaterThanOrEqual(worldBox(cabinet!).max.y - EPSILON);
  });

  /**
   * The light is under the table, and both halves of that are the claim. It traces the
   * outline all the way around — it was a straight bar of accent laid across the front, which
   * is what a strip somebody stuck on looks like, and a straight bar is exactly what this
   * passes on one axis and fails on the other. And it hangs below the underside, set back
   * from the edge, so what reaches a visitor is the wash on the rug rather than the emitter:
   * lift it onto the top face and every other assertion here still passes.
   */
  it("runs the lit channel around the underside of the top, set back under its edge", async () => {
    const scene = await lounge();
    const table = loungeRoot(scene.objects).children[PIECE.table]!;

    const band = worldBox(litChannel(table));
    const top = worldBox(tableTop(table));
    const inset = { x: band.min.x - top.min.x, z: band.min.z - top.min.z };

    // Inside the edge on every side, by the same setback — a band that reaches an edge is a
    // rope stuck on the rim, and one that reaches only two is the strip this replaced.
    expect(inset.x).toBeGreaterThan(0.005);
    expect(top.max.x - band.max.x).toBeCloseTo(inset.x, 3);
    expect(inset.z).toBeGreaterThan(0.005);
    expect(top.max.z - band.max.z).toBeCloseTo(inset.z, 3);

    expect(band.max.y).toBeLessThanOrEqual(top.min.y);
    expect(top.min.y - band.min.y).toBeLessThan(0.02);
  });

  /**
   * Emissive geometry lights nothing in three.js, so without a lamp of its own the channel is
   * a bright line on a table standing in its own shadow — a decal. The pool it throws on the
   * rug is what makes the glow read as a source, and it belongs under the top: put it above
   * and it washes the glass the table is trying to keep dark.
   */
  it("casts the underglow from beneath the top, in the accent color", async () => {
    const scene = await lounge();
    const table = loungeRoot(scene.objects).children[PIECE.table]!;
    const underside = worldBox(tableTop(table)).min.y;

    const glow = scene
      .lightsOfType("PointLight")
      .filter((light) => `#${light.color.getHexString()}` === worldColors.accent)
      .map((light) => light.getWorldPosition(new Vector3()))
      .filter((position) => position.y < underside);

    expect(glow).toHaveLength(1);
    expect(glow[0]!.y).toBeGreaterThan(LOUNGE_ORIGIN[1]);
  });

  /**
   * The glass is a field inset into the frame, not a sheet over the whole top: the border
   * around it is what makes the table a tray with a panel in it rather than one dark box.
   * Sized to the top, it would swallow the border and the chamfer both, and nothing else in
   * this file would notice.
   */
  it("insets the glass into the frame, leaving a border all around", async () => {
    const scene = await lounge();
    const table = loungeRoot(scene.objects).children[PIECE.table]!;

    const panel = table.children.find(
      (child): child is Mesh => (child as Mesh).geometry?.type === "ShapeGeometry",
    );
    if (!panel) throw new Error("The coffee table has no glass");

    const glass = worldBox(panel);
    const top = worldBox(tableTop(table));
    const border = glass.min.x - top.min.x;

    expect(border).toBeGreaterThan(0.01);
    expect(top.max.x - glass.max.x).toBeCloseTo(border, 3);
    expect(glass.min.z - top.min.z).toBeCloseTo(border, 3);
    expect(top.max.z - glass.max.z).toBeCloseTo(border, 3);
    // On top of the frame, and under whatever the table carries.
    expect(glass.min.y).toBeCloseTo(LOUNGE_ORIGIN[1] + TABLE_TOP_Y, 3);
  });

  /**
   * Two bars, crossed. Each half is a claim the room can lose on its own.
   *
   * *One bar* is asserted by geometry identity — `sled.ts` builds the profile and
   * `sled.test.ts` holds its shape, so what is left to this file is that the table places one
   * geometry twice; a second geometry here means someone rebuilt the bar per side and the two
   * will drift apart. *Crossed* is asserted by the footprint: a bar laid diagonally reaches
   * across both axes and covers the table's center, and the desk's parallel pair — the
   * arrangement this one exists not to repeat — fails both on the axis it is thin across.
   */
  it("crosses two loops of one bent bar into an X under the middle of the top", async () => {
    const scene = await lounge();
    const table = loungeRoot(scene.objects).children[PIECE.table]!;

    const byGeometry = new Map<string, Mesh[]>();
    for (const child of table.children) {
      const mesh = child as Mesh;
      if (!mesh.geometry) continue;
      byGeometry.set(mesh.geometry.uuid, [...(byGeometry.get(mesh.geometry.uuid) ?? []), mesh]);
    }
    const bars = [...byGeometry.values()].filter((meshes) => meshes.length > 1).flat();
    expect(bars).toHaveLength(2);

    const center = worldBox(tableTop(table)).getCenter(new Vector3());
    const spans = bars.map((bar) => {
      const box = worldBox(bar);
      expect(box.min.y).toBeCloseTo(LOUNGE_ORIGIN[1], 3);
      expect(box.min.x).toBeLessThan(center.x);
      expect(box.max.x).toBeGreaterThan(center.x);
      expect(box.min.z).toBeLessThan(center.z);
      expect(box.max.z).toBeGreaterThan(center.z);
      return box.getSize(new Vector3());
    });

    // Reaching well across both axes is what a diagonal is; a parallel pair is a bar's width
    // across one of them.
    for (const span of spans) {
      expect(span.x).toBeGreaterThan(0.5);
      expect(span.z).toBeGreaterThan(0.3);
    }
    // The same bar, turned the other way: mirrored, so the two footprints match.
    expect(spans[0]!.x).toBeCloseTo(spans[1]!.x, 5);
    expect(spans[0]!.z).toBeCloseTo(spans[1]!.z, 5);
  });

  /**
   * What the sled buys, and the two ways it is thrown away. The loops stand inboard of the
   * top on both axes, so the rug runs unbroken under the table and the top reads as floating
   * — push them out to the corners and it is four legs again with extra steps. And they have
   * to reach the underside: a bar stopping short leaves the top hovering on nothing, which no
   * other assertion in this file can see because everything else is measured from the floor.
   */
  it("cantilevers the top past the bars and carries it on their full height", async () => {
    const scene = await lounge();
    const table = loungeRoot(scene.objects).children[PIECE.table]!;
    const top = tableTop(table);

    const surface = worldBox(top);
    const base = new Box3();
    for (const child of table.children) {
      if (child === top) continue;
      const box = worldBox(child);
      if (box.min.y - LOUNGE_ORIGIN[1] < 0.01) base.union(box);
    }

    expect(base.min.x - surface.min.x).toBeGreaterThan(0.1);
    expect(surface.max.x - base.max.x).toBeGreaterThan(0.1);
    expect(base.min.z - surface.min.z).toBeGreaterThan(0.02);
    expect(surface.max.z - base.max.z).toBeGreaterThan(0.02);
    // Into the underside, not short of it and not through the top.
    expect(base.max.y).toBeGreaterThanOrEqual(surface.min.y);
    expect(base.max.y).toBeLessThan(surface.getCenter(new Vector3()).y);
  });

  /**
   * The remote's shape comes from `slab.ts`, whose extrusion starts at `-bevelThickness` — so
   * a body set down at the surface it is meant to lie on sinks a chamfer into it, and one
   * lifted by any other number floats. The one it replaced floated 8 mm. Read against the
   * table rather than against its own `position`, because the offset that would be wrong is
   * two groups above it.
   */
  it("lays the remote on the table rather than in it or above it", async () => {
    const scene = await lounge();

    const remote = scene.meshes.find((mesh) => {
      const size = localSize(mesh);
      return (
        Math.abs(size.x - REMOTE.width) < EPSILON && Math.abs(size.y - REMOTE.length) < EPSILON
      );
    });
    if (!remote) throw new Error("The lounge table carries no remote");

    const restsOn = worldBox(remote).min.y - (LOUNGE_ORIGIN[1] + TABLE_TOP_Y);
    expect(restsOn).toBeGreaterThanOrEqual(-EPSILON);
    expect(restsOn).toBeLessThan(0.003);
  });

  /**
   * Three identical books read as one block; the offsets are what make it a stack. They are
   * bound in `books.tsx` like the shelves', which merges all three into one geometry — so the
   * claim is read back out of the vertices, 24 to a book, rather than off three meshes.
   */
  it("stacks the table's books at rising heights, each set down differently", async () => {
    const scene = await lounge();
    const CORNERS_PER_BOOK = 24;

    const stack = scene.meshes.find(
      (mesh) => (mesh.geometry.getAttribute("position")?.count ?? 0) === CORNERS_PER_BOOK * 3,
    );
    const corners = stack?.geometry.getAttribute("position");
    if (!corners) throw new Error("The coffee table carries no books");

    const books = Array.from({ length: 3 }, (_, index) => {
      const xs: number[] = [];
      const ys: number[] = [];
      const zs: number[] = [];
      for (let corner = 0; corner < CORNERS_PER_BOOK; corner += 1) {
        const vertex = index * CORNERS_PER_BOOK + corner;
        xs.push(Number(corners.getX(vertex).toFixed(6)));
        ys.push(corners.getY(vertex));
        zs.push(corners.getZ(vertex));
      }
      return {
        bottom: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        depth: Math.max(...zs) - Math.min(...zs),
        // A box square to the table has two x values; one set down turned has four.
        turned: new Set(xs).size,
      };
    });

    expect(books.map((book) => book.bottom)).toEqual(
      [...books.map((book) => book.bottom)].sort((a, b) => a - b),
    );
    for (const book of books) expect.soft(book.turned).toBe(4);
    expect(new Set(books.map((book) => `${book.width}x${book.depth}`)).size).toBe(3);
  });
});
