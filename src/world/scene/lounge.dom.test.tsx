import { afterEach, describe, expect, it } from "vitest";
import { Box3, Vector3, type MeshBasicMaterial, type MeshStandardMaterial, type Mesh } from "three";
import { geometryParams, materialOf, renderScene, unmountScenes } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";
import { worldColors } from "../materials";
import { ROOM } from "../room";
import { LOUNGE_ORIGIN, Lounge, SOFA_Z, TABLE_Z, TV_CENTER_Y, TV_WALL_Z } from "./lounge";

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

/** The lounge's own root, which is the first group below the scene. */
function loungeRoot(objects: readonly { type: string }[]) {
  const group = objects.find((object) => object.type === "Group");
  if (!group) throw new Error("The lounge rendered no group");
  return group as unknown as Mesh;
}

function worldBox(object: object): Box3 {
  return new Box3().setFromObject(object as Mesh);
}

async function lounge() {
  stub = stubCanvasContexts();
  return renderScene(<Lounge />);
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
    const seating = worldBox(loungeRoot(scene.objects).children[1]!);

    expect(SOFA_Z).toBeGreaterThan(TV_WALL_Z);
    expect(TABLE_Z).toBeGreaterThan(TV_WALL_Z);
    expect(TABLE_Z).toBeLessThan(SOFA_Z);

    expect(seating.min.x).toBeGreaterThanOrEqual(rugBox.min.x - EPSILON);
    expect(seating.max.x).toBeLessThanOrEqual(rugBox.max.x + EPSILON);
    expect(seating.min.z).toBeGreaterThanOrEqual(rugBox.min.z - EPSILON);
    expect(seating.max.z).toBeLessThanOrEqual(rugBox.max.z + EPSILON);
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

    const accent = scene
      .lightsOfType("PointLight")
      .filter((light) => `#${light.color.getHexString()}` === worldColors.accent);

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

    // Wide and shallow, which is the soundbar's grille and nothing else on this side of the
    // room: the mark on the laptop's lid is the other small plane down here, and picking on
    // height alone found that instead the day the laptop was built.
    const grille = scene.meshesWith("PlaneGeometry").find((mesh) => {
      const { width = 0, height = 1 } = geometryParams(mesh);
      return height < 0.1 && width > 0.5;
    });
    // The soundbar is handed a `topY` and places itself; the console it belongs to is the
    // sibling of its own group, which is what makes this a claim about that number.
    const soundbar = grille!.parent!;
    const cabinet = soundbar.parent!.children.find(
      (child): child is Mesh => (child as Mesh).geometry?.type === "ExtrudeGeometry",
    );

    expect(worldBox(soundbar).min.y).toBeGreaterThanOrEqual(worldBox(cabinet!).max.y - EPSILON);
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
