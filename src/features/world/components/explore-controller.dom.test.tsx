import { afterEach, describe, expect, it } from "vitest";
import { createRef, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { EXPLORE } from "../constants/explore";
import { neutralExploreState, type ExploreInputState } from "../hooks/explore-input-state";
import { ExploreController } from "./explore-controller";

/**
 * Walking the room in first person. `utils/explore.ts` owns the vector math; what this
 * component owes is that the math is wired to the right axis and that a visitor cannot
 * walk out of the room, through the desk, or off the floor — the three ways a free camera
 * ruins the illusion it exists for.
 */

afterEach(unmountScenes);

type Harness = {
  scene: SceneQuery;
  camera: PerspectiveCamera;
  input: RefObject<ExploreInputState>;
};

async function mount(): Promise<Harness> {
  const input = createRef<ExploreInputState>() as RefObject<ExploreInputState>;
  input.current = neutralExploreState();

  const scene = await renderScene(<ExploreController input={input} />);
  const camera = scene.state.camera as PerspectiveCamera;
  camera.position.set(1, 3, 2.5);
  camera.lookAt(0, 1, -1);
  camera.updateMatrixWorld(true);

  return { scene, camera, input };
}

/** One second of walking. */
async function walk(scene: SceneQuery, seconds = 1): Promise<void> {
  await scene.advance(Math.round(seconds * 60), 1 / 60);
}

describe("ExploreController", () => {
  it("drops the camera to eye height as soon as the visitor takes over", async () => {
    const { scene, camera } = await mount();

    await walk(scene);

    expect(camera.position.y).toBeCloseTo(EXPLORE.eyeHeight, 2);
  });

  it("walks forward along the direction the visitor is looking", async () => {
    const { scene, camera, input } = await mount();
    await walk(scene);
    const start = camera.position.clone();

    input.current.forward = 1;
    await walk(scene);

    expect(camera.position.distanceTo(start)).toBeGreaterThan(0.5);
    // Forward is into the room, which is where the camera was already looking.
    expect(camera.position.z).toBeLessThan(start.z);
  });

  it("strafes sideways without changing where the visitor is looking", async () => {
    const { scene, camera, input } = await mount();
    await walk(scene);
    const start = camera.position.clone();
    const facing = camera.rotation.y;

    input.current.strafe = 1;
    await walk(scene);

    expect(camera.position.x).toBeGreaterThan(start.x);
    expect(camera.rotation.y).toBeCloseTo(facing, 5);
  });

  it("holds the visitor inside the room however long they walk at a wall", async () => {
    const { scene, camera, input } = await mount();
    input.current.forward = 1;
    input.current.strafe = 1;

    await walk(scene, 20);

    const { minX, maxX, minZ, maxZ } = EXPLORE.bounds;
    expect(camera.position.x).toBeGreaterThanOrEqual(minX - 0.01);
    expect(camera.position.x).toBeLessThanOrEqual(maxX + 0.01);
    expect(camera.position.z).toBeGreaterThanOrEqual(minZ - 0.01);
    expect(camera.position.z).toBeLessThanOrEqual(maxZ + 0.01);
    expect(camera.position.y).toBeCloseTo(EXPLORE.eyeHeight, 2);
  });

  it("looks around with the pointer, and cannot be tipped past the clamp", async () => {
    const { scene, camera, input } = await mount();
    await walk(scene);
    const facing = camera.rotation.y;

    input.current.yaw = 1;
    input.current.pitch = EXPLORE.pitchMaxRad;
    await scene.advance(1);

    expect(camera.rotation.y).toBeCloseTo(facing + 1, 5);
    expect(camera.rotation.x).toBeLessThanOrEqual(EXPLORE.pitchMaxRad + 0.001);

    input.current.pitch = 99;
    await scene.advance(1);
    expect(camera.rotation.x).toBeLessThanOrEqual(EXPLORE.pitchMaxRad + 0.001);
  });

  it("rotates in an order that keeps the horizon level", async () => {
    // YXZ, so yaw and pitch compose without ever rolling the camera — a rolled horizon in
    // a first-person view reads as motion sickness, not as a camera move.
    const { scene, camera, input } = await mount();
    input.current.yaw = 1.2;
    input.current.pitch = 0.4;

    await scene.advance(1);

    expect(camera.rotation.order).toBe("YXZ");
    expect(camera.rotation.z).toBe(0);
  });

  it("eases into a step rather than teleporting on the frame a key goes down", async () => {
    const { scene, camera, input } = await mount();
    await walk(scene);
    const start = camera.position.clone();

    input.current.forward = 1;
    await scene.advance(1);
    const firstFrame = camera.position.distanceTo(start);

    expect(firstFrame).toBeGreaterThan(0);
    expect(firstFrame).toBeLessThan((EXPLORE.moveSpeed / 60) * 1.01);
  });
});
