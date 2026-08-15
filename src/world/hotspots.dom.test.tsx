import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, beforeEach, vi } from "vitest";
import { type MeshBasicMaterial, CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import {
  geometryParams,
  materialOf,
  renderScene,
  unmountScenes,
  type SceneQuery,
} from "@tests/r3f";
import { setHoveredStation } from "./store";
import { FOCUS_LIGHT_INTENSITY, furnitureHotspots, WorldPortals } from "./hotspots";
import { getStation } from "./stations";
import { WALL_SCREEN } from "./room";
import { getHotspotObjects } from "./interact";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";
import type * as RadialGlow from "./hotspots";

/**
 * What makes the room clickable. Every furniture station gets an invisible box the
 * raycaster can hit, and a glow plus a label that only exist while something is focused —
 * so the assertions here are about presence, placement and the two ways focus arrives:
 * a pointer, and a deep link.
 */

const FURNITURE = Object.keys(furnitureHotspots) as (keyof typeof furnitureHotspots)[];

afterEach(unmountScenes);

function hitboxes(scene: SceneQuery) {
  return scene.meshesWith("BoxGeometry");
}

function glows(scene: SceneQuery) {
  return scene.meshesWith("PlaneGeometry");
}

/** Runs enough frames for a fade to finish at the configured rate. */
async function settle(scene: SceneQuery): Promise<void> {
  await scene.advance(60, 1 / 60);
}

describe("WorldPortals", () => {
  it("gives every furniture station a hitbox the raycaster can find and nobody can see", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);
    const boxes = hitboxes(scene);

    expect(boxes).toHaveLength(FURNITURE.length);
    expect(boxes.every((mesh) => mesh.visible === false)).toBe(true);
    expect(getHotspotObjects()).toEqual(expect.arrayContaining([...boxes]));

    const slugs = boxes.map((mesh) => mesh.userData.hotspotSlug);
    expect(new Set(slugs)).toEqual(new Set(FURNITURE));
  });

  it("puts each hitbox exactly where its hotspot constant says the furniture is", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);

    for (const mesh of hitboxes(scene)) {
      const slug = mesh.userData.hotspotSlug as keyof typeof furnitureHotspots;
      const hotspot = furnitureHotspots[slug];
      expect(mesh.position.toArray()).toEqual([...hotspot.center]);
      const { width, height, depth } = geometryParams(mesh);
      expect([width, height, depth]).toEqual([...hotspot.size]);
    }
  });

  it("mounts nothing to glow until something is focused", async () => {
    // `lab` is furniture; `home` is the neon sign, which has no hotspot of its own.
    const scene = await renderScene(<WorldPortals active="home" />);

    expect(glows(scene)).toHaveLength(0);
  });

  it("lights the station a deep link arrived at, with no pointer involved", async () => {
    const scene = await renderScene(<WorldPortals active="writing" />);
    await settle(scene);

    const glow = glows(scene.refresh())[0];
    expect(glow).toBeDefined();
    expect(materialOf<MeshBasicMaterial>(glow).opacity).toBeGreaterThan(0);
    expect(materialOf<MeshBasicMaterial>(glow).color.getHexString()).toBe(
      getStation("writing").accent.slice(1),
    );
  });

  it("fades a hovered station in, and takes it away again when the pointer leaves", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);

    await act(async () => setHoveredStation("speaking"));
    await settle(scene);
    const lit = glows(scene.refresh())[0];
    expect(materialOf<MeshBasicMaterial>(lit).opacity).toBeGreaterThan(0);

    await act(async () => setHoveredStation(null));
    await settle(scene);

    // Below the unmount threshold the glow leaves the scene entirely, rather than staying
    // as a fully transparent plane the renderer still sorts and draws every frame.
    expect(glows(scene.refresh())).toHaveLength(0);
  });

  it("lays a floor hotspot's glow flat on the ground and a wall one against the wall", async () => {
    const floor = await renderScene(<WorldPortals active="speaking" />);
    await settle(floor);
    const onFloor = glows(floor.refresh())[0]!;

    expect(onFloor.rotation.x).toBeCloseTo(-Math.PI / 2);
    expect(onFloor.position.y).toBeCloseTo(furnitureHotspots.speaking.groundY);

    await unmountScenes();

    const wall = await renderScene(<WorldPortals active="playground" />);
    await settle(wall);
    const onWall = glows(wall.refresh())[0]!;

    expect(onWall.rotation.y).toBeCloseTo(WALL_SCREEN.rotationY);
    // Lifted off the wall's own plane, or it z-fights with the screen it is behind.
    expect(onWall.position.x).toBeGreaterThan(furnitureHotspots.playground.center[0]);
  });

  /**
   * The reason `HotspotFocusLight` is mounted permanently instead of inside `HotspotFocus`:
   * changing the point-light count rewrites every material's program key and forces three
   * to relink ~47 shaders — on every hover, and again on every un-hover.
   */
  it("never changes how many lights the scene has, however the focus moves", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);
    const count = () => scene.refresh().lightsOfType("PointLight").length;

    expect(count()).toBe(2);

    await act(async () => setHoveredStation("writing"));
    await settle(scene);
    expect(count()).toBe(2);

    await act(async () => setHoveredStation(null));
    await settle(scene);
    expect(count()).toBe(2);
  });

  it("moves the focus light onto the hovered station and dims it back to nothing", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);
    const light = scene.lightsOfType("PointLight")[0]!;
    const station = getStation("contact");

    await settle(scene);
    expect(light.intensity).toBe(0);

    await act(async () => setHoveredStation("contact"));
    await settle(scene);

    expect(light.position.toArray()).toEqual([...station.anchor]);
    expect(light.color.getHexString()).toBe(station.accent.slice(1));
    expect(light.intensity).toBeCloseTo(FOCUS_LIGHT_INTENSITY, 2);

    await act(async () => setHoveredStation(null));
    await settle(scene);

    expect(light.intensity).toBeCloseTo(0, 2);
  });

  it("takes its hitboxes out of the registry when the canvas goes away", async () => {
    const scene = await renderScene(<WorldPortals active="home" />);
    expect(getHotspotObjects()).toHaveLength(FURNITURE.length);

    await scene.unmount();

    expect(getHotspotObjects()).toHaveLength(0);
  });
});

/**
 * The soft disc under every hotspot. It is one texture for the whole world by design —
 * 17 stations plus the AI core would otherwise each hold a 256² canvas that nothing
 * disposes — so the module caches, and every test here needs its own copy of the module.
 */

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

async function loadFresh(): Promise<typeof RadialGlow> {
  vi.resetModules();
  return import("./hotspots");
}

beforeEach(() => {
  stub = undefined;
});

afterEach(() => {
  stub?.restore();
});

describe("createRadialGlowTexture", () => {
  it("fades from opaque at the center to nothing at the rim", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    const texture = createRadialGlowTexture();
    const recording = stub.contexts[0];
    const size = (texture.image as HTMLCanvasElement).width;

    expect(recording).toBeDefined();
    const [x0, y0, r0, x1, y1, r1] = recording!.callsTo("createRadialGradient")[0]!.map(Number);
    expect([x0, y0, x1, y1]).toEqual([size / 2, size / 2, size / 2, size / 2]);
    expect(r0).toBe(0);
    expect(r1).toBe(size / 2);

    const stops = recording!.callsTo("gradient#1.addColorStop").map(([at, color]) => [at, color]);
    expect(stops.map(([at]) => at)).toEqual([0, 0.45, 1]);
    expect(stops.at(0)?.[1]).toBe("rgba(255,255,255,1)");
    expect(stops.at(-1)?.[1]).toBe("rgba(255,255,255,0)");

    // The whole square is painted, so the quad has no visible edge where the disc ends.
    expect(recording!.callsTo("fillRect")[0]?.map(Number)).toEqual([0, 0, size, size]);
  });

  it("hands every hotspot the same texture instead of one canvas each", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    expect(createRadialGlowTexture()).toBe(createRadialGlowTexture());
    expect(stub.contexts).toHaveLength(1);
  });

  it("configures the texture as a sprite rather than a surface map", async () => {
    stub = stubCanvasContexts();
    const { createRadialGlowTexture } = await loadFresh();

    const texture = createRadialGlowTexture();

    expect(texture).toBeInstanceOf(CanvasTexture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.minFilter).toBe(LinearFilter);
    expect(texture.magFilter).toBe(LinearFilter);
    // A 256² glow with mipmaps costs a third more memory for a disc that is never minified.
    expect(texture.generateMipmaps).toBe(false);
  });

  it("still returns a texture when the browser refuses a 2D context", async () => {
    // jsdom's own answer, and a real browser's once too many contexts are live: an
    // unpainted glow is invisible, where a throw here takes the whole scene down.
    const { createRadialGlowTexture } = await loadFresh();

    expect(() => createRadialGlowTexture()).not.toThrow();
    expect(createRadialGlowTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });
});
