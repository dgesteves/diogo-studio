import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef, type ReactElement, type RefObject } from "react";
import { BoxGeometry, Mesh } from "three";
import type { PerspectiveCamera } from "three";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { getWorldSnapshot } from "./store";
import { neutralOrbitState, type OrbitInputState } from "./input";
import { registerHotspot, unregisterHotspot } from "./interact";
import { WorldInteract } from "./interact";

/**
 * The step between "the pointer is at these screen coordinates" and "the visitor meant
 * that station". It reads the ref `useOrbitInput` writes and raycasts against the hotspot
 * registry, so the honest setup is a real camera, real boxes at known places, and real
 * screen coordinates — not a mocked raycaster.
 *
 * The camera is placed by hand rather than borrowed from `WorldCamera`: what is under
 * test is the projection from pixels to objects, and pinning the camera is what makes the
 * expected pixel for a given box something the spec can state.
 */

const VIEWPORT = { width: 800, height: 600 };

/** A box the raycaster can hit, centred on the camera's forward axis at `x`. */
function hotspotAt(x: number, userData: Record<string, unknown>): Mesh {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1));
  mesh.position.set(x, 0, 0);
  mesh.updateMatrixWorld(true);
  Object.assign(mesh.userData, userData);
  return mesh;
}

const registered: Mesh[] = [];

function register(...meshes: Mesh[]): void {
  for (const mesh of meshes) {
    registered.push(mesh);
    registerHotspot(mesh);
  }
}

afterEach(async () => {
  await unmountScenes();
  for (const mesh of registered.splice(0)) {
    unregisterHotspot(mesh);
    mesh.geometry.dispose();
  }
});

type Harness = {
  scene: SceneQuery;
  input: RefObject<OrbitInputState>;
  onSelect: ReturnType<typeof vi.fn>;
  onAskAi: ReturnType<typeof vi.fn>;
  /** Screen coordinates that land on the given world x, on the camera's axis. */
  pixelFor: (worldX: number) => { clientX: number; clientY: number };
};

async function mount(): Promise<Harness> {
  const input = createRef<OrbitInputState>() as RefObject<OrbitInputState>;
  input.current = neutralOrbitState();
  const onSelect = vi.fn();
  const onAskAi = vi.fn();

  const element: ReactElement = (
    <WorldInteract input={input} onSelect={onSelect} onAskAi={onAskAi} />
  );
  const scene = await renderScene(element);

  const camera = scene.state.camera as PerspectiveCamera;
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);
  camera.aspect = VIEWPORT.width / VIEWPORT.height;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  scene.state.size.width = VIEWPORT.width;
  scene.state.size.height = VIEWPORT.height;
  scene.state.size.left = 0;
  scene.state.size.top = 0;

  return {
    scene,
    input,
    onSelect,
    onAskAi,
    pixelFor: (worldX) => {
      const ndc = worldX / (Math.tan((camera.fov * Math.PI) / 360) * 6 * camera.aspect);
      return {
        clientX: ((ndc + 1) / 2) * VIEWPORT.width,
        clientY: VIEWPORT.height / 2,
      };
    },
  };
}

function pointAt(
  input: RefObject<OrbitInputState>,
  at: { clientX: number; clientY: number },
): void {
  input.current.clientX = at.clientX;
  input.current.clientY = at.clientY;
  input.current.overWorld = true;
}

function clickAt(
  input: RefObject<OrbitInputState>,
  at: { clientX: number; clientY: number },
): void {
  input.current.clickX = at.clientX;
  input.current.clickY = at.clientY;
  input.current.clickSeq += 1;
}

describe("WorldInteract", () => {
  it("publishes the station under the pointer, and clears it when the pointer moves off", async () => {
    const { scene, input, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    pointAt(input, pixelFor(0));
    await scene.advance(1);
    expect(getWorldSnapshot().hovered).toBe("writing");

    pointAt(input, pixelFor(4));
    await scene.advance(1);
    expect(getWorldSnapshot().hovered).toBeNull();
  });

  it("shows a pointer cursor only over something that can be clicked", async () => {
    const { scene, input, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    pointAt(input, pixelFor(0));
    await scene.advance(1);
    expect(document.body.style.cursor).toBe("pointer");

    pointAt(input, pixelFor(4));
    await scene.advance(1);
    expect(document.body.style.cursor).toBe("");
  });

  it("forgets the hover the moment the pointer leaves the world for the HUD", async () => {
    const { scene, input, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    pointAt(input, pixelFor(0));
    await scene.advance(1);
    expect(getWorldSnapshot().hovered).toBe("writing");

    // Same coordinates, but the pointer is now over the command deck: a station left
    // glowing under a panel the visitor is reading is the defect this prevents.
    input.current.overWorld = false;
    await scene.advance(1);

    expect(getWorldSnapshot().hovered).toBeNull();
    expect(document.body.style.cursor).toBe("");
  });

  it("navigates to the station that was clicked", async () => {
    const { scene, input, onSelect, onAskAi, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "openSource" }));

    clickAt(input, pixelFor(0));
    await scene.advance(1);

    expect(onSelect).toHaveBeenCalledWith("openSource");
    expect(onAskAi).not.toHaveBeenCalled();
  });

  it("opens the agent instead of navigating when the AI core is clicked", async () => {
    const { scene, input, onSelect, onAskAi, pixelFor } = await mount();
    register(hotspotAt(0, { aiCore: true }));

    clickAt(input, pixelFor(0));
    await scene.advance(1);

    expect(onAskAi).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does nothing at all when the click landed on empty room", async () => {
    const { scene, input, onSelect, onAskAi, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    clickAt(input, pixelFor(4));
    await scene.advance(1);

    expect(onSelect).not.toHaveBeenCalled();
    expect(onAskAi).not.toHaveBeenCalled();
  });

  it("acts once per click rather than on every frame that follows it", async () => {
    const { scene, input, onSelect, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    clickAt(input, pixelFor(0));
    await scene.advance(10);

    expect(onSelect).toHaveBeenCalledTimes(1);

    clickAt(input, pixelFor(0));
    await scene.advance(1);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("gives the AI core priority when it overlaps a station's hitbox", async () => {
    const { scene, input, onSelect, onAskAi, pixelFor } = await mount();
    // The core floats in front of the desk, so its box and the desk's do overlap.
    const behind = hotspotAt(0, { hotspotSlug: "about" });
    behind.position.set(0, 0, -2);
    behind.updateMatrixWorld(true);
    register(hotspotAt(0, { aiCore: true }), behind);

    clickAt(input, pixelFor(0));
    await scene.advance(1);

    expect(onAskAi).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("leaves the cursor alone once the canvas is gone", async () => {
    const { scene, input, pixelFor } = await mount();
    register(hotspotAt(0, { hotspotSlug: "writing" }));

    pointAt(input, pixelFor(0));
    await scene.advance(1);
    expect(document.body.style.cursor).toBe("pointer");

    await scene.unmount();

    // Otherwise every element on the page keeps a pointer cursor after a route change.
    expect(document.body.style.cursor).toBe("");
  });
});
