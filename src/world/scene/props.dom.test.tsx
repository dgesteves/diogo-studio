import { afterEach, describe, expect, it, vi } from "vitest";
import type { InstancedMesh, MeshStandardMaterial } from "three";
import { geometryParams, materialOf, renderScene, unmountScenes } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";
import { WALL_SCREEN, WALL_SCREEN_Z } from "../room";
import { PUZZLE_STICKERS, SHELF_BOOKS, WALL_SHELF_BOOKS } from "./shelving";
import { WorldProps } from "./props";

/**
 * The furniture that carries five of the seventeen stations. `screen-draw.test.ts` already
 * asserts what each routine paints; what is left to this file is the wiring around them —
 * that the panels hang where the layout says, that each one is given its *own* routine,
 * and that the books cost one draw call per shelving unit rather than one per spine.
 */

/** `props.tsx` paints each wall panel at this width; the book atlases are other sizes. */
const WALL_SCREEN_TEXTURE_WIDTH = 600;

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

afterEach(async () => {
  await unmountScenes();
  stub?.restore();
  stub = undefined;
});

describe("WorldProps", () => {
  it("hangs one screen per wall station, in the order the layout gives them", async () => {
    const scene = await renderScene(<WorldProps />);
    const slugs = Object.keys(WALL_SCREEN_Z) as (keyof typeof WALL_SCREEN_Z)[];

    const panels = scene
      .meshesWith("PlaneGeometry")
      .filter((mesh) => geometryParams(mesh).width === WALL_SCREEN.width);

    expect(panels).toHaveLength(slugs.length);

    for (const panel of panels) {
      const group = panel.parent!;
      expect(group.position.x).toBeCloseTo(WALL_SCREEN.x);
      expect(group.position.y).toBeCloseTo(WALL_SCREEN.y);
      expect(group.rotation.y).toBeCloseTo(WALL_SCREEN.rotationY);
    }

    const zs = panels.map((panel) => panel.parent!.position.z);
    expect(new Set(zs.map((z) => z.toFixed(3)))).toEqual(
      new Set(slugs.map((slug) => WALL_SCREEN_Z[slug].toFixed(3))),
    );
  });

  /**
   * A copy-paste in the slug → routine map would put the résumé on the timeline panel, and
   * every other assertion in the suite would still pass: same geometry, same material,
   * same position. Five distinct transcripts is the only thing that catches it.
   */
  it("gives each wall screen its own drawing, not a neighbor's", async () => {
    stub = stubCanvasContexts();
    await renderScene(<WorldProps />);

    // The shelving paints its book atlases onto canvases too; a panel is 600 wide.
    const transcripts = stub.contexts
      .filter((context) => context.ctx.canvas.width === WALL_SCREEN_TEXTURE_WIDTH)
      .map((context) => context.transcript.join("\n"));

    expect(transcripts).toHaveLength(Object.keys(WALL_SCREEN_Z).length);
    expect(new Set(transcripts).size).toBe(transcripts.length);
    expect(transcripts.every((transcript) => transcript.length > 0)).toBe(true);
  });

  it("lights the panels from their own image, so they read as screens in a dark room", async () => {
    stub = stubCanvasContexts();
    const scene = await renderScene(<WorldProps />);

    const panel = scene
      .meshesWith("PlaneGeometry")
      .find((mesh) => geometryParams(mesh).width === WALL_SCREEN.width);
    const material = materialOf<MeshStandardMaterial>(panel);

    expect(material.map).not.toBeNull();
    expect(material.emissiveMap).toBe(material.map);
    // Tone mapping would crush a self-lit panel back into the room's exposure.
    expect(material.toneMapped).toBe(false);
  });

  /**
   * One canvas texture per wall station, none of which R3F reconciled — they are handed to a
   * material as `map`, so nothing else will ever free them. The canvas unmounts whenever a
   * visitor turns motion off mid-session, and five 600×800 textures per toggle is the leak
   * `useDisposable` exists to close.
   */
  it("releases every wall screen's texture when the world unmounts", async () => {
    stub = stubCanvasContexts();
    const scene = await renderScene(<WorldProps />);

    const screens = scene
      .meshesWith("PlaneGeometry")
      .filter((mesh) => geometryParams(mesh).width === WALL_SCREEN.width);
    const disposals = screens.map((screen) =>
      vi.spyOn(materialOf<MeshStandardMaterial>(screen).map!, "dispose"),
    );

    await scene.unmount();

    expect(disposals).toHaveLength(Object.keys(WALL_SCREEN_Z).length);
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
  });

  /**
   * A hundred and twenty-one spines and fifty-four stickers, at four draw calls between them.
   * The books cannot be instanced — every spine reads its own cell of an atlas, and instances
   * share one geometry — so they are merged instead, one mesh per shelving unit.
   */
  it("draws every book merged and every sticker instanced, not one mesh each", async () => {
    const scene = await renderScene(<WorldProps />);
    // drei fills the instance buffer on the first frame, not at mount.
    await scene.advance(1);
    const refreshed = scene.refresh();

    const instanced = refreshed.objects.filter(
      (object): object is InstancedMesh => (object as InstancedMesh).isInstancedMesh === true,
    );
    // Only the puzzle cube's stickers, which are 54 copies of one tile.
    expect(instanced).toHaveLength(1);
    expect(instanced[0]!.count).toBeGreaterThanOrEqual(PUZZLE_STICKERS.length);
    // Culled on its base tile's bounds rather than its instances', so a camera angle that
    // leaves that one tile off-screen would otherwise blank all 54.
    expect(instanced[0]!.frustumCulled).toBe(false);

    const spines = SHELF_BOOKS.length + WALL_SHELF_BOOKS.length;
    const merged = refreshed.meshes.filter(
      (mesh) =>
        (mesh.geometry.getAttribute("position")?.count ?? 0) % 24 === 0 &&
        mesh.geometry.getIndex() !== null,
    );
    const shelved = merged.filter((mesh) =>
      [SHELF_BOOKS.length, WALL_SHELF_BOOKS.length].includes(
        mesh.geometry.getAttribute("position")!.count / 24,
      ),
    );
    expect(shelved).toHaveLength(2);
    // A box per spine, and nowhere near a mesh per spine.
    expect(refreshed.meshes.length).toBeLessThan(spines);
  });

  /**
   * Neither the atlas nor the merged geometry is reconciled by R3F — both are built by hand
   * and handed in as props, so nothing else will ever free them. The canvas really does
   * unmount, every time a visitor turns motion off mid-session.
   */
  it("releases each shelving unit's atlas and geometry when the world unmounts", async () => {
    stub = stubCanvasContexts();
    const scene = await renderScene(<WorldProps />);

    const shelved = scene.meshes.filter((mesh) =>
      [SHELF_BOOKS.length, WALL_SHELF_BOOKS.length].includes(
        (mesh.geometry.getAttribute("position")?.count ?? 0) / 24,
      ),
    );
    expect(shelved).toHaveLength(2);
    const disposals = shelved.flatMap((mesh) => [
      vi.spyOn(materialOf<MeshStandardMaterial>(mesh).map!, "dispose"),
      vi.spyOn(mesh.geometry, "dispose"),
    ]);

    await scene.unmount();

    expect(disposals).toHaveLength(4);
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
  });

  it("aims the shelf light at a target that is actually in the scene", async () => {
    const scene = await renderScene(<WorldProps />);
    const spot = scene.lightsOfType("SpotLight")[0];

    expect(spot).toBeDefined();
    // A `SpotLight` whose target was never added to the graph keeps the target's default
    // world matrix and lights the origin — the shelf would sit dark with no error anywhere.
    expect(scene.objects).toContain((spot as unknown as { target: object }).target);
  });
});
