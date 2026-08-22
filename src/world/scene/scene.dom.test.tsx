import { act } from "@testing-library/react";
import { Color } from "three";
import { afterEach, describe, expect, it } from "vitest";
import {
  geometryParams,
  materialOf,
  renderScene,
  unmountScenes,
  type SceneQuery,
} from "@tests/r3f";
import { setWorldMode, type WorldMode } from "../store";
import { worldColors, worldPalettes } from "../materials";
import { ROOM } from "../room";
import { StudioScene } from "./studio";
import { StatusLed } from "./status-led";

/**
 * An exact count, deliberately. Restructure phases 3-4 move 40 scene files and merge
 * clusters, and their failure mode is a mesh silently disappearing — a lower bound
 * would not catch that. Change it only when you mean to change the scene.
 *
 * The ceiling fixtures were rebuilt without changing it: the flat housing, the diffuser, the
 * core and the four trim bars became one extruded body, a lens, a hairline and the four posts
 * the fixture now hangs from — seven meshes each, the same seven it cost before.
 *
 * The city cost three fewer than the one it replaced, and covers a great deal more: a sky
 * plane, a painted horizon band, a moon, a star and six instanced building groups came to
 * eleven; a backdrop dome, one buffer per finish, three shells of haze and the ground they
 * stand on come to eleven — the two over the original nine being the masonry and ribbon
 * cladding sheets, which is one mesh each for a whole family of buildings.
 */
const SCENE_MESH_COUNT = 195;

afterEach(unmountScenes);

async function studio(mode: WorldMode = "night"): Promise<SceneQuery> {
  // Set before mounting: changing it under a live scene would notify the store's
  // subscribers as an unwrapped act() update.
  await act(async () => setWorldMode(mode));
  return renderScene(<StudioScene />);
}

describe("StudioScene", () => {
  it("mounts the whole scene graph headlessly", async () => {
    const scene = await studio();

    expect(scene.meshes).toHaveLength(SCENE_MESH_COUNT);
    expect(scene.meshes.every((mesh) => mesh.geometry.type.length > 0)).toBe(true);
  });

  it("lights the room from the shared brand tokens", async () => {
    const scene = await studio();

    expect(scene.lightsOfType("AmbientLight")).toHaveLength(1);
    expect(scene.lightsOfType("HemisphereLight")).toHaveLength(1);
    expect(scene.lightsOfType("DirectionalLight")).toHaveLength(1);

    const pointColors = scene.lightsOfType("PointLight").map((light) => light.color.getHexString());
    expect(pointColors).toContain(new Color(worldColors.accent).getHexString());
    expect(pointColors).toContain(new Color(worldColors.accentSoft).getHexString());
  });

  it("swaps the light rig with the world palette instead of remounting the scene", async () => {
    const night = await studio();
    expect(night.lightsOfType("AmbientLight")[0]?.intensity).toBeCloseTo(
      worldPalettes.night.ambientIntensity,
    );

    await unmountScenes();
    const day = await studio("day");

    expect(day.lightsOfType("AmbientLight")[0]?.intensity).toBeCloseTo(
      worldPalettes.day.ambientIntensity,
    );
    expect(day.meshes).toHaveLength(SCENE_MESH_COUNT);
  });

  /**
   * The shell is a closed box, not four oversized planes. It was the latter until the window
   * was cut into it, at which point every wall hung out past a corner and into the city view
   * as a slab suspended over the skyline — so nothing here may be wider than the span it
   * closes, and the floor may not reach past the glass.
   */
  it("sizes the room shell to the room and no further", async () => {
    const scene = await studio();

    const panels = scene.meshesWith("PlaneGeometry").map(geometryParams);
    const sized = (width: number, height: number): boolean =>
      panels.some((panel) => panel.width === width && panel.height === height);

    // The back and front walls span the room's width, the right wall its depth, and each of
    // them stops at the ceiling. The left wall is the four panels the window leaves of it.
    expect(sized(ROOM.width, ROOM.wallHeight)).toBe(true);
    expect(sized(ROOM.depth, ROOM.wallHeight)).toBe(true);
    // Floor and ceiling are the footprint exactly, so neither shows past the glass.
    expect(sized(ROOM.width, ROOM.depth)).toBe(true);
    for (const panel of panels.filter((panel) => panel.height === ROOM.wallHeight)) {
      expect.soft(panel.width).toBeLessThanOrEqual(Math.max(ROOM.width, ROOM.depth));
    }
  });
});

/**
 * The blinking lights on the desk hardware — the only thing in the room
 * that moves on its own when nobody is interacting with it. Each is a core sphere and an
 * additive halo, and the halo has to follow the core: a pulse where only the sphere changes
 * reads as a flicker rather than a light.
 */
describe("StatusLed", () => {
  const SPEED = 2;
  /**
   * The wave is `sin(t · speed + phase)` and `advance` accumulates the clock, so these are the
   * deltas that walk it to its first peak, then from the trough to the peak after it.
   */
  const PEAK = Math.PI / 2 / SPEED;
  const TROUGH = (3 * Math.PI) / 2 / SPEED;
  const TROUGH_TO_PEAK = Math.PI / SPEED;

  async function led(props: Partial<Parameters<typeof StatusLed>[0]> = {}) {
    const scene = await renderScene(
      <StatusLed position={[0, 0, 0]} color={worldColors.statusOk} radius={0.01} {...props} />,
    );
    const opacities = (): { core: number; halo: number } => {
      const [core, halo] = scene.refresh().meshes.map((mesh) => materialOf(mesh).opacity);
      return { core: core!, halo: halo! };
    };
    return { scene, opacities };
  }

  it("pulses between an idle floor and full brightness", async () => {
    const { scene, opacities } = await led({ blinkSpeed: SPEED });

    await scene.advance(1, TROUGH);
    const dim = opacities();

    await scene.advance(1, TROUGH_TO_PEAK);
    const bright = opacities();

    expect(bright.core).toBeCloseTo(1);
    expect(dim.core).toBeGreaterThan(0);
    expect(dim.core).toBeLessThan(bright.core);
    // The halo is a fixed fraction of the core at both ends, which is what keeps it a glow.
    expect(dim.halo / dim.core).toBeCloseTo(bright.halo / bright.core);
  });

  it("holds still when it is given no blink speed", async () => {
    const { scene, opacities } = await led();
    const resting = opacities();

    await scene.advance(4, PEAK);

    expect(opacities()).toEqual(resting);
  });

  /** Without the phase offset every LED on a box blinks in unison, which reads as one lamp. */
  it("offsets the blink by its phase", async () => {
    const { scene, opacities } = await led({ blinkSpeed: SPEED });
    await scene.advance(1, PEAK);
    const unshifted = opacities().core;

    await unmountScenes();
    const shifted = await led({ blinkSpeed: SPEED, phase: Math.PI / 2 });
    await shifted.scene.advance(1, PEAK);

    expect(shifted.opacities().core).not.toBeCloseTo(unshifted);
  });
});
