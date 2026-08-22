"use client";

import { type ReactElement, useMemo } from "react";
import {
  Color,
  ExtrudeGeometry,
  Object3D,
  Path,
  Shape,
  ShapeGeometry,
  type BufferGeometry,
  type CanvasTexture,
} from "three";
import { useDisposable } from "../gpu";
import {
  worldColors,
  useWorldPalette,
  anodizedMetalMaterial,
  darkMetalMaterial,
} from "../materials";
import { ROOM } from "../room";
import { createCanvasTexture } from "../screens/texture";

/**
 * Two things that are both "light" and cannot be separated: the rig, which is pure lights
 * swapped by the day/night palette, and the ceiling fixtures, which are meshes that emit and
 * therefore have to agree with it. Change one without the other and the room stops matching
 * its own ceiling.
 */

export function Lighting(): ReactElement {
  const palette = useWorldPalette();

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} />
      <hemisphereLight
        color={palette.hemisphereSky}
        groundColor={palette.hemisphereGround}
        intensity={palette.hemisphereIntensity}
      />
      <directionalLight
        position={[3, 5, 3]}
        intensity={palette.keyLightIntensity}
        color={palette.keyLightColor}
      />
      <pointLight position={[0, 0.6, -1.2]} intensity={0.9} decay={2} color={worldColors.accent} />
      <pointLight
        position={[2.4, 1.6, 0.6]}
        intensity={0.35}
        decay={2}
        color={worldColors.accentSoft}
      />
    </>
  );
}

/**
 * The two ceiling fixtures, built as an architectural luminaire rather than an office troffer.
 *
 * What made the old pair read as a panel out of a suspended ceiling was that all of their light
 * came off one flat plane at one value: a 2 m square of clipped white with a full-strength neon
 * rectangle drawn around it. Both halves of that are what reads as cheap. A uniform emissive
 * plate has no optic — nothing between the lamp and the room — and a bright line tracing the
 * whole perimeter is piping, which is a gaming cue rather than an architectural one.
 *
 * So this is a **darklight** fixture, the shape a high-end luminaire actually takes:
 *
 * - The body is **hung**, not glued on. Four dark posts drop it `drop` off the plaster, so it
 *   reads as a fixture somebody mounted and the ceiling stays a surface behind it rather than
 *   the thing the light is painted onto.
 * - The source is **recessed** behind a chamfered mouth. It sits `LENS_RECESS` up inside the
 *   well, so the well's walls cut it off at a grazing angle and the fixture changes as you
 *   cross the room instead of being one constant white rectangle. The well is near-black on
 *   purpose: an anti-glare optic is dark inside, and that contrast is what makes the light look
 *   bright without the lens having to clip.
 * - The field has **structure** — a run of light blades, hot down each centerline and falling
 *   off across it, running front to back so they converge toward the back wall.
 * - The accent is a **hairline** let into the underside, not a frame around the light. The same
 *   cyan the room is built on, a third the width, and set against the dark body where it has
 *   something to be crisp against.
 * Every edge in the lens is hard, and that is a rule rather than a preference. Bloom already
 * spreads a lit surface a long way, so a gradient laid across a bright band comes back as a
 * blur — the field is one even sheet that stops at its own edge, and the only softening
 * anywhere is the last two percent, which keeps the sheet from reading as a hole cut in the
 * ceiling.
 */

/**
 * The fixture, in meters. `span` is the widest section of the body, which the chamfer is paid
 * out of; `apertureSpan` is the mouth, and the well narrows to `THROAT_SPAN` one chamfer above
 * it. The canopy is narrower than the body on purpose — it is what the shadow gap is a gap in.
 */
export const CEILING_FIXTURE = {
  span: 2,
  bodyDepth: 0.13,
  chamfer: 0.018,
  /** The suspension: how far the posts hold the body clear of the ceiling. */
  drop: 0.14,
  postSection: 0.04,
  apertureSpan: 1.8,
  /** How far the lens sits up inside the well: the cutoff that keeps the source out of view. */
  lensRecess: 0.046,
} as const;

/**
 * Where a post lands. The body's top is an annulus, so a post has one band of material to
 * stand on: outside the well — which the bevel opens back to the mouth at this end — and
 * inside the chamfer. This is the middle of that band.
 */
export const POST_REACH =
  (CEILING_FIXTURE.span - CEILING_FIXTURE.chamfer * 2 + CEILING_FIXTURE.apertureSpan) / 4;

export const THROAT_SPAN = CEILING_FIXTURE.apertureSpan - CEILING_FIXTURE.chamfer * 2;

const HAIRLINE_INSET = 0.022;
const HAIRLINE_WIDTH = 0.026;

const BODY_TOP_Y = ROOM.ceilingY - CEILING_FIXTURE.drop;
const BODY_BOTTOM_Y = BODY_TOP_Y - CEILING_FIXTURE.bodyDepth;
const POST_Y = BODY_TOP_Y + CEILING_FIXTURE.drop / 2;
const POST_XZ: readonly [number, number][] = [
  [-POST_REACH, -POST_REACH],
  [-POST_REACH, POST_REACH],
  [POST_REACH, -POST_REACH],
  [POST_REACH, POST_REACH],
];
const LENS_SPAN = THROAT_SPAN - 0.008;
const LENS_Y = BODY_BOTTOM_Y + CEILING_FIXTURE.lensRecess;
/** A hair *below* the bottom face: at it, the line is buried in the material it is let into. */
const HAIRLINE_Y = BODY_BOTTOM_Y - 0.0012;
const HAIRLINE_OUTER = CEILING_FIXTURE.span - CEILING_FIXTURE.chamfer * 2 - HAIRLINE_INSET * 2;

const LIGHT_Y = BODY_BOTTOM_Y - 0.05;
const LIGHT_INTENSITY = 7;
const LIGHT_DISTANCE = 9;
const LIGHT_ANGLE = 0.75;

const FIXTURE_POSITIONS: readonly [number, number][] = [
  [-0.15, 0.3],
  [2.55, 0.3],
];

/**
 * A square annulus in the extruder's own plane, centered on the origin: `outer` of material
 * with `inner` cut out of it. One shape describes both the body and the hairline, which is what
 * keeps the light line concentric with the thing it is let into.
 */
export function annulus(outer: number, inner: number): Shape {
  const shape = new Shape();
  traceSquare(shape, outer);
  const hole = new Path();
  traceSquare(hole, inner);
  shape.holes.push(hole);
  return shape;
}

function traceSquare(path: Shape | Path, span: number): void {
  const half = span / 2;
  path.moveTo(-half, -half);
  path.lineTo(half, -half);
  path.lineTo(half, half);
  path.lineTo(-half, half);
  path.closePath();
}

/**
 * The body: one extrusion carrying the outer chamfer, the well and the chamfered mouth.
 *
 * Both offsets are paid for in the drawn profile and they run opposite ways. The bevel grows
 * the outer contour, so the profile is drawn two chamfers small for the widest section to come
 * out at `PANEL_SPAN`; it grows *into* a hole for the same reason, so the drawn hole is the
 * mouth and the throat above it is two chamfers narrower. Extruding also adds a chamfer at each
 * end, which `BODY_DEPTH` already accounts for — see `scene/mac-studio.tsx`, where taking the
 * extruder at face value once cost a machine its whole port panel.
 */
export function createBodyGeometry(): BufferGeometry {
  const { span, apertureSpan, bodyDepth, chamfer } = CEILING_FIXTURE;

  return new ExtrudeGeometry(annulus(span - chamfer * 2, apertureSpan), {
    depth: bodyDepth - chamfer * 2,
    bevelEnabled: true,
    bevelSize: chamfer,
    bevelThickness: chamfer,
    bevelSegments: 2,
  });
}

export function createHairlineGeometry(): BufferGeometry {
  return new ShapeGeometry(annulus(HAIRLINE_OUTER, HAIRLINE_OUTER - HAIRLINE_WIDTH * 2));
}

/**
 * What the lens is painted with. A pigment rather than a surface token — it never reaches a
 * material, it reaches a canvas — so it lives with the routine that uses it, the way
 * `LIT_WINDOW_COLORS` lives with the city.
 *
 * It is the cool white and deliberately not the core white beside it. Painted at the core the
 * sheet clips, and a clipped sheet blooms hard enough to eat the chamfer, the light line and
 * the fixture's own edges — the lamp stops being an object and becomes a hole in the ceiling.
 * One notch down it still reads as the brightest surface in the room and keeps every edge.
 * `scene/mac-studio.tsx` steps its aluminum down against the same bloom threshold.
 */
const LENS_INK = { core: worldColors.coolLight } as const;

const LENS_PIXELS = { across: 1024, along: 512 } as const;

/** Only the outermost band, so the sheet stops rather than being cropped by its own frame. */
const LENS_EDGE_FADE = 0.022;

export function paintLens(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = LENS_INK.core;
  ctx.fillRect(0, 0, width, height);

  fadeToEdge(ctx, width, height);
}

function fadeToEdge(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.globalCompositeOperation = "multiply";

  for (const [x0, y0, x1, y1] of [
    [0, 0, 0, height],
    [0, 0, width, 0],
  ] as const) {
    const fade = ctx.createLinearGradient(x0, y0, x1, y1);
    fade.addColorStop(0, "#000000");
    fade.addColorStop(LENS_EDGE_FADE, "#ffffff");
    fade.addColorStop(1 - LENS_EDGE_FADE, "#ffffff");
    fade.addColorStop(1, "#000000");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalCompositeOperation = "source-over";
}

function createPaintedTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(width, height, {
    // Painted once and then read minified from meters away: the same case as a book's cloth.
    mipmapped: true,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paint(ctx);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Day dims the lens instead of switching it off. A fixture still at full value with the city
 * pouring through the window reads as a light nobody bothered to turn down; one that goes dark
 * reads as broken. The floor is what a lens still shows with daylight on it.
 */
const LENS_DIM_FLOOR = 0.6;

export function CeilingLights(): ReactElement {
  const palette = useWorldPalette();
  const { body, hairline, lens } = useDisposable(() => ({
    body: createBodyGeometry(),
    hairline: createHairlineGeometry(),
    lens: createPaintedTexture(LENS_PIXELS.across, LENS_PIXELS.along, paintLens),
  }));

  const intensity = palette.ceilingLightIntensity;
  const dim = useMemo(
    () => new Color().setScalar(LENS_DIM_FLOOR + (1 - LENS_DIM_FLOOR) * intensity),
    [intensity],
  );

  return (
    <group>
      {FIXTURE_POSITIONS.map(([x, z]) => (
        <CeilingPanel
          key={`${x},${z}`}
          x={x}
          z={z}
          intensity={intensity}
          dim={dim}
          body={body}
          hairline={hairline}
          lens={lens}
        />
      ))}
    </group>
  );
}

type CeilingPanelProps = {
  x: number;
  z: number;
  intensity: number;
  dim: Color;
  body: BufferGeometry;
  hairline: BufferGeometry;
  lens: CanvasTexture;
};

function CeilingPanel({
  x,
  z,
  intensity,
  dim,
  body,
  hairline,
  lens,
}: CeilingPanelProps): ReactElement {
  const target = useMemo(() => new Object3D(), []);

  return (
    <group position={[x, 0, z]}>
      {POST_XZ.map(([px, pz]) => (
        <mesh key={`${px},${pz}`} position={[px, POST_Y, pz]}>
          <boxGeometry
            args={[CEILING_FIXTURE.postSection, CEILING_FIXTURE.drop, CEILING_FIXTURE.postSection]}
          />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
      ))}

      <mesh
        geometry={body}
        position={[0, BODY_BOTTOM_Y + CEILING_FIXTURE.chamfer, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...anodizedMetalMaterial} />
      </mesh>

      <mesh position={[0, LENS_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LENS_SPAN, LENS_SPAN]} />
        <meshBasicMaterial map={lens} color={dim} toneMapped={false} />
      </mesh>

      <mesh geometry={hairline} position={[0, HAIRLINE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>

      <primitive object={target} />
      <spotLight
        position={[0, LIGHT_Y, 0]}
        target={target}
        color={worldColors.coolLight}
        intensity={LIGHT_INTENSITY * intensity}
        angle={LIGHT_ANGLE}
        penumbra={1}
        distance={LIGHT_DISTANCE}
        decay={2}
      />
    </group>
  );
}
