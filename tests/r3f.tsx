import ReactThreeTestRenderer from "@react-three/test-renderer";
import { act } from "@testing-library/react";
import { useStore, type RootState, type RootStore } from "@react-three/fiber";
import { useLayoutEffect, type ReactElement, type ReactNode } from "react";
import { Box3 } from "three";
import type { Light, Material, Mesh, Object3D } from "three";

/**
 * The query layer for scene-graph tests. `@react-three/test-renderer` hands back a real
 * three.js scene with no GPU, so everything a spec wants to know — how many meshes, which
 * material, where a light ended up — is a traversal rather than a pixel.
 *
 * It owns three things every scene spec would otherwise get wrong.
 *
 * The renderer must be unmounted before the global store reset notifies a live subscriber
 * outside `act()`, which `unmountScenes()` in a spec's own `afterEach` does.
 *
 * **RTTR's `advanceFrames` does not move the clock**: it calls each `useFrame` subscriber
 * directly with the delta it was given and never touches `state.clock`, so every animation
 * written against `clock.elapsedTime` — the AI core's spin, the hotspot pulse, the camera's
 * idle drift, the television — sits frozen at t=0 unless the test advances it.
 *
 * And it calls those subscribers outside React, so a component that sets state from
 * `useFrame` updates outside `act()`. `advance()` handles all three, which together are
 * what fiber's own loop does.
 */

const live: { unmount: () => Promise<void> }[] = [];

export type SceneQuery = {
  /** Every object in the scene, in traversal order. */
  readonly objects: readonly Object3D[];
  readonly meshes: readonly Mesh[];
  readonly lights: readonly Light[];
  lightsOfType: (type: string) => readonly Light[];
  /** Meshes whose geometry is of one type — `"PlaneGeometry"`, `"TorusGeometry"`, … */
  meshesWith: (geometry: string) => readonly Mesh[];
  /** The R3F root as it is now: camera, renderer, raycaster, size, clock. */
  readonly state: RootState;
  /** Runs the frame loop by hand, clock included. */
  advance: (frames: number, delta?: number) => Promise<void>;
  /** Re-reads the scene after something has changed it. */
  refresh: () => SceneQuery;
  update: (element: ReactElement) => Promise<SceneQuery>;
  unmount: () => Promise<void>;
};

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function isLight(object: Object3D): object is Light {
  return (object as Light).isLight === true;
}

/** The single material of a mesh, narrowed past three's `Material | Material[]`. */
export function materialOf<T extends Material>(mesh: Mesh | undefined): T {
  const material = mesh?.material;
  if (!material || Array.isArray(material)) {
    throw new Error(`Expected a single material, got ${String(material)}`);
  }
  return material as T;
}

/** An object's extents in world space — where a piece of furniture stands, not how big it is. */
export function worldBox(object: object): Box3 {
  return new Box3().setFromObject(object as Mesh);
}

/** The geometry parameters three records when it builds a primitive from JSX args. */
export function geometryParams(mesh: Mesh | undefined): Record<string, number> {
  const params: unknown = (mesh?.geometry as { parameters?: unknown } | undefined)?.parameters;
  return typeof params === "object" && params !== null ? (params as Record<string, number>) : {};
}

/**
 * Reports the root *store*, not a snapshot of it. R3F replaces the state object on every
 * `set()`, and `<PerspectiveCamera makeDefault>` is a `set()` — so a captured `RootState`
 * still holds the renderer's default 75° camera while the scene is driving another one.
 */
function StateProbe({ onStore }: { onStore: (store: RootStore) => void }): null {
  const store = useStore();
  useLayoutEffect(() => {
    onStore(store);
  }, [onStore, store]);
  return null;
}

export type RenderSceneOptions = {
  /**
   * Runs against the live root before `children` mount, which is the only place a method
   * on the mock renderer can be stubbed: three defines `compileAsync` as an own property
   * of each `WebGLRenderer`, so there is no prototype to spy on, and the components that
   * call it do so from a mount-time effect. Given this, the scene is built in two passes.
   */
  prepare?: (state: RootState) => void;
};

export async function renderScene(
  children: ReactNode,
  { prepare }: RenderSceneOptions = {},
): Promise<SceneQuery> {
  let root: RootStore | undefined;
  const probe = <StateProbe onStore={(store) => (root = store)} />;
  const renderer = await ReactThreeTestRenderer.create(
    prepare ? (
      probe
    ) : (
      <>
        {children}
        {probe}
      </>
    ),
  );
  live.push(renderer);

  if (!root) throw new Error("The R3F root never reported its store");
  const store = root;

  if (prepare) {
    prepare(store.getState());
    await renderer.update(
      <>
        {children}
        {probe}
      </>,
    );
  }

  function read(): SceneQuery {
    // Without this every world-space read is silently one transform short.
    // `Box3.setFromObject` and `getWorldPosition` both call
    // `updateWorldMatrix(false, true)` — descendants but *not* ancestors — so a mesh three
    // groups deep reports its position as if every group above it sat at the origin, and
    // the assertion that catches a misplaced object passes on the number it expected.
    renderer.scene.instance.updateMatrixWorld(true);

    const objects: Object3D[] = [];
    renderer.scene.instance.traverse((object) => objects.push(object));
    const meshes = objects.filter(isMesh);
    const lights = objects.filter(isLight);

    return {
      objects,
      meshes,
      lights,
      get state() {
        return store.getState();
      },
      lightsOfType: (type) => lights.filter((light) => light.type === type),
      meshesWith: (geometry) => meshes.filter((mesh) => mesh.geometry.type === geometry),
      advance: async (frames, delta = 1 / 60) => {
        // `advanceFrames` invokes the subscribers directly, outside React, so a component
        // that sets state from `useFrame` — `HotspotFocus` mounting its own glow — updates
        // outside act() and the render never flushes before the next assertion.
        await act(async () => {
          for (let frame = 0; frame < frames; frame += 1) {
            store.getState().clock.elapsedTime += delta;
            await renderer.advanceFrames(1, delta);
          }
        });
      },
      refresh: read,
      update: async (next) => {
        await renderer.update(
          <>
            {next}
            {probe}
          </>,
        );
        return read();
      },
      unmount: async () => {
        await renderer.unmount();
      },
    };
  }

  return read();
}

/**
 * Unmounts every scene this file rendered. Call it from a spec's own `afterEach`:
 * `sequence.hooks: "stack"` runs that before `vitest.setup.ts` resets the stores, which is
 * what keeps a store notification from reaching a still-subscribed scene outside `act()`.
 */
export async function unmountScenes(): Promise<void> {
  await Promise.all(live.splice(0).map((renderer) => renderer.unmount()));
}
