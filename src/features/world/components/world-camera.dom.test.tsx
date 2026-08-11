import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRef, type RefObject } from "react";
import { Vector3, type PerspectiveCamera } from "three";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { setExplore } from "@/stores/explore-store";
import { ROOM } from "@/constants/room";
import type { RouteKey } from "@/constants/routes";
import { ORBIT } from "../constants/orbit";
import { getStation } from "../constants/stations";
import { neutralOrbitState, type OrbitInputState } from "../hooks/orbit-input-state";
import { WorldCamera } from "./world-camera";

/**
 * Where the camera ends up, which is the entire navigation model: a route is a station and
 * a station is a camera position. The failure modes worth catching are all things a
 * visitor sees on arrival — landing somewhere other than the station they deep-linked to,
 * the world cropping on a narrow screen, or the camera drifting through a wall.
 *
 * Nothing here compares two positions captured at different moments. The authored framing
 * is never still: `ORBIT.idleAzimuthRad` keeps a slow sine drift on the target the whole
 * time, so an absolute position is only meaningful against the station it belongs to.
 */

const WIDE = { width: 1920, height: 1080 };
const NARROW = { width: 390, height: 844 };

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(async () => {
  await unmountScenes();
  window.sessionStorage.clear();
});

type Harness = {
  scene: SceneQuery;
  camera: PerspectiveCamera;
  input: RefObject<OrbitInputState>;
};

function neutralInput(): RefObject<OrbitInputState> {
  const input = createRef<OrbitInputState>() as RefObject<OrbitInputState>;
  input.current = neutralOrbitState();
  return input;
}

async function mount(
  active: RouteKey = "about",
  viewport: { width: number; height: number } = WIDE,
): Promise<Harness> {
  const input = neutralInput();
  const scene = await renderScene(<WorldCamera active={active} input={input} />);
  Object.assign(scene.state.size, { ...viewport, left: 0, top: 0 });

  return { scene, camera: scene.state.camera as PerspectiveCamera, input };
}

/** Enough frames for the exponential settle to arrive. */
async function settle(scene: SceneQuery, frames = 600): Promise<void> {
  await scene.advance(frames, 1 / 60);
}

function stationPosition(slug: RouteKey): Vector3 {
  return new Vector3(...getStation(slug).position);
}

function distanceToTarget(camera: PerspectiveCamera, slug: RouteKey): number {
  return camera.position.distanceTo(new Vector3(...getStation(slug).target));
}

describe("WorldCamera", () => {
  it("opens a deep link already framed on its station, with no fly-in", async () => {
    const { scene, camera } = await mount("about");

    await scene.advance(1);

    expect(camera.position.distanceTo(stationPosition("about"))).toBeLessThan(0.2);
  });

  it("settles onto the station a route change moved to", async () => {
    const { scene, camera, input } = await mount("about");
    await settle(scene);

    const moved = await scene.update(<WorldCamera active="contact" input={input} />);
    await settle(moved);

    expect(camera.position.distanceTo(stationPosition("contact"))).toBeLessThan(0.3);
  });

  it("flies the world in once per session, and only from the world root", async () => {
    const { scene, camera } = await mount("home");

    await scene.advance(1);
    // The intro starts high and wide, a long way from where it is heading.
    expect(camera.position.distanceTo(stationPosition("home"))).toBeGreaterThan(2);

    await settle(scene, 1200);
    expect(camera.position.distanceTo(stationPosition("home"))).toBeLessThan(0.4);

    await unmountScenes();
    const second = await mount("home");
    await second.scene.advance(1);

    // The session's one intro is spent: a visitor returning to `/` is put straight there.
    expect(second.camera.position.distanceTo(stationPosition("home"))).toBeLessThan(0.2);
  });

  it("pulls back on a narrow viewport so the world never crops", async () => {
    const wide = await mount("about", WIDE);
    await settle(wide.scene);
    const wideDistance = distanceToTarget(wide.camera, "about");

    await unmountScenes();

    const narrow = await mount("about", NARROW);
    await settle(narrow.scene);

    expect(distanceToTarget(narrow.camera, "about")).toBeGreaterThan(wideDistance);
  });

  it("keeps the camera between the two walls that carry content", async () => {
    // `home` frames from x = 4.4, and a phone-shaped viewport pulls it further out still.
    const { scene, camera } = await mount("home", NARROW);
    await settle(scene);

    expect(camera.position.x).toBeLessThanOrEqual(ROOM.maxX);
    expect(camera.position.x).toBeGreaterThanOrEqual(ROOM.minX);
  });

  it("swings around the station while it is being dragged, without pushing away from it", async () => {
    const { scene, camera, input } = await mount("about");
    await settle(scene);
    const resting = camera.position.clone();
    const restingDistance = distanceToTarget(camera, "about");

    drag(input, ORBIT.azimuthLimitRad);
    await scene.advance(60, 1 / 60);

    expect(camera.position.distanceTo(resting)).toBeGreaterThan(1);
    expect(distanceToTarget(camera, "about")).toBeCloseTo(restingDistance, 1);
  });

  it("returns to the authored framing once the visitor stops touching it", async () => {
    const { scene, camera, input } = await mount("about");
    await settle(scene);
    const resting = camera.position.clone();

    drag(input, ORBIT.azimuthLimitRad);
    await scene.advance(60, 1 / 60);
    const swung = camera.position.distanceTo(resting);

    // The drag ends and the return delay elapses.
    input.current.dragging = false;
    input.current.lastInput = performance.now() - ORBIT.returnDelayMs - 1;
    await settle(scene);

    expect(camera.position.distanceTo(resting)).toBeLessThan(swung / 5);
  });

  it("hands the camera over to explore mode instead of dragging it back", async () => {
    const { scene, camera } = await mount("about");
    await settle(scene);

    setExplore(true);
    camera.position.set(1, 1.6, 3);
    await scene.advance(30, 1 / 60);

    expect(camera.position.toArray()).toEqual([1, 1.6, 3]);

    setExplore(false);
  });
});

function drag(input: RefObject<OrbitInputState>, azimuth: number): void {
  input.current.azimuth = azimuth;
  input.current.dragging = true;
  input.current.lastInput = performance.now();
}
