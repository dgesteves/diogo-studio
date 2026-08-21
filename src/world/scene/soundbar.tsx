"use client";

import { type ReactElement } from "react";
import {
  ExtrudeGeometry,
  RepeatWrapping,
  Shape,
  Vector2,
  type BufferGeometry,
  type CanvasTexture,
} from "three";
import { useDisposable } from "../gpu";
import { worldColors } from "../materials";
import { createCanvasTexture } from "../screens/texture";
import { StatusLed } from "./status-led";

/**
 * The soundbar under the television, modeled from the machine rather than from a box.
 *
 * What makes one recognizable is its **section**, and a `RoundedBox` cannot say it: one radius
 * rounds all twelve edges alike, so the ends come out as soft as the front and the thing reads
 * as a bar of soap laid on the console. A real bar turns hard at the ends and softly along its
 * length — the front rolls over into the top through a radius a third of its own height, the
 * back is nearly square against the wall, and the two end caps are flat with the edge merely
 * broken. So the body is a section extruded along its length, the way `scene/mac-studio.tsx`
 * is a plan extruded up, and the ends are a flat cap material rather than more of the wrap.
 *
 * The other half of it is the grille. A bar's whole front is a field of holes a few
 * millimeters apart, and the flat plane that stood here before was the single thing making the
 * prop read as a placeholder — a black rectangle painted on a black box. It is a perforation
 * texture on the wrap instead: the field is uniform and isotropic, so it needs no registration
 * with the geometry and tiles from one small canvas.
 *
 * On top of that the front carries the thing that actually says "soundbar" from the sofa: three
 * near-black grille panels let into it, left, center and right, with a rib of body between
 * them. That is where the drivers fire, it is how a bar is divided, and it is the one feature
 * of this object still legible when the whole bar is 200 px wide. Each panel is the section's
 * own front arc thickened into a crescent and extruded, so it hugs the curve it is set into
 * rather than standing off it as a flat plate would.
 *
 * Dimensions are a real bar's: 1.20 m long, 11.6 cm deep, 8.7 cm tall, standing on two feet.
 */

/** In meters. `endFillet` is the break at each end — an edge broken, not an end rounded. */
export const SOUNDBAR = {
  length: 1.2,
  depth: 0.116,
  height: 0.087,
  endFillet: 0.004,
  /** The rubber feet, and the dark reveal they leave under the bar. */
  footHeight: 0.004,
} as const;

/**
 * Where the section turns, and by how much. These four numbers are the object: the front pair
 * are generous enough that the front face is mostly curve, the back pair small enough that the
 * bar reads as square where it faces the wall.
 */
const SECTION = {
  frontBottom: 0.026,
  frontTop: 0.034,
  backTop: 0.012,
  backBottom: 0.006,
} as const;

/**
 * The section, drawn in the shape's own plane: `x` runs front-to-back with the front at `+x`,
 * `y` is the bar's height with the bottom at zero, and the extrusion runs up `z`. `inset`
 * shrinks it without changing where it turns, which is how the bevel is paid for below.
 */
export function soundbarSection(inset = 0): Shape {
  const front = SOUNDBAR.depth / 2 - inset;
  const back = -front;
  const top = SOUNDBAR.height - inset;
  const bottom = inset;
  const turn = (radius: number): number => Math.max(0.0008, radius - inset);
  const fb = turn(SECTION.frontBottom);
  const ft = turn(SECTION.frontTop);
  const bt = turn(SECTION.backTop);
  const bb = turn(SECTION.backBottom);
  const shape = new Shape();

  shape.moveTo(back + bb, bottom);
  shape.lineTo(front - fb, bottom);
  shape.absarc(front - fb, bottom + fb, fb, -Math.PI / 2, 0, false);
  shape.lineTo(front, top - ft);
  shape.absarc(front - ft, top - ft, ft, 0, Math.PI / 2, false);
  shape.lineTo(back + bt, top);
  shape.absarc(back + bt, top - bt, bt, Math.PI / 2, Math.PI, false);
  shape.lineTo(back, bottom + bb);
  shape.absarc(back + bb, bottom + bb, bb, Math.PI, Math.PI * 1.5, false);

  return shape;
}

/**
 * The cabinet. `ExtrudeGeometry` grows its section outward by the bevel and starts the run at
 * `-bevelThickness`, so the section is drawn one fillet small and the result is walked back
 * along its own axis to sit centered — `scene/mac-studio.tsx` documents both traps at length.
 * The extrusion is left running up `z`; the mesh turns it a quarter so `z` becomes the room's
 * `x`, which keeps the section readable as a section.
 */
export function createSoundbarGeometry(): BufferGeometry {
  const fillet = SOUNDBAR.endFillet;
  const geometry = new ExtrudeGeometry(soundbarSection(fillet), {
    depth: SOUNDBAR.length - fillet * 2,
    bevelEnabled: true,
    bevelSize: fillet,
    bevelThickness: fillet,
    bevelSegments: 3,
    curveSegments: 14,
  });
  geometry.translate(0, 0, fillet - SOUNDBAR.length / 2);

  return geometry;
}

/**
 * The perforation, as one tile of a staggered field. It is painted as a mask rather than as a
 * color — white where the panel is solid, dark where a hole is — so the material's own color
 * is what the bar is made of and this only says where the holes are. The same canvas is the
 * bump map, because a hole is both darker and lower and one texture can say both.
 *
 * Staggered rows rather than true hexagonal packing: a hex field's row pitch is irrational
 * against its column pitch and will not tile a square canvas, and at a 3 mm pitch seen from
 * across the room the difference is nothing.
 */
const PERFORATION = { tile: 128, holes: 8, radius: 0.24 } as const;
/** What one tile measures on the bar. 8 holes across 24 mm is the 3 mm pitch of a real one. */
export const PERFORATION_SPAN = 0.024;

const PERFORATION_INK = { panel: "#e6eaee", hole: "#161a1e" } as const;

function paintHole(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const hole = ctx.createRadialGradient(x, y, radius * 0.55, x, y, radius);
  hole.addColorStop(0, PERFORATION_INK.hole);
  hole.addColorStop(1, PERFORATION_INK.panel);
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function paintPerforation(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  const pitch = size / PERFORATION.holes;
  const radius = pitch * PERFORATION.radius;

  ctx.fillStyle = PERFORATION_INK.panel;
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < PERFORATION.holes; row += 1) {
    const y = (row + 0.5) * pitch;
    const stagger = row % 2 === 0 ? 0 : pitch / 2;
    for (let column = 0; column < PERFORATION.holes; column += 1) {
      const x = (column * pitch + stagger + pitch / 2) % size;
      paintHole(ctx, x, y, radius);
      // A hole the stagger pushes onto the tile's edge is only half inside it, and the tile
      // beside it is a copy of this one rather than its continuation — so the other half has
      // to be painted here too, or the bar wears a column of half-holes every 24 mm.
      if (x < radius) paintHole(ctx, x + size, y, radius);
      if (x > size - radius) paintHole(ctx, x - size, y, radius);
    }
  }
}

export function createPerforationTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(PERFORATION.tile, PERFORATION.tile, {
    // Painted once and read minified from meters away and at a glancing angle: without the
    // chain the hole field crawls into moiré on every camera move.
    mipmapped: true,
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // `ExtrudeGeometry` lays the wall UVs out in meters, so the repeat is tiles per meter and
  // needs no agreement with the section — which is the whole reason the field is isotropic.
  texture.repeat.set(1 / PERFORATION_SPAN, 1 / PERFORATION_SPAN);

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintPerforation(ctx);
  texture.needsUpdate = true;
  return texture;
}

/**
 * The front arc, thickened into a crescent — the section of one grille panel.
 *
 * The run is picked by height rather than by depth: everything the section puts between the
 * two lips is the face that points at the room, and the lips themselves stay body-colored so
 * the panel reads as let into the bar rather than wrapped around it. Offsetting radially from
 * the section's own middle is enough for a front this convex, and it keeps the crescent's two
 * edges square to the surface they meet.
 */
const GRILLE = {
  /** The lips of body the panel stops short of, top and bottom. */
  bottomLip: 0.011,
  topLip: 0.016,
  /** How far the panel stands proud of the wrap, and how far it sinks behind it. */
  relief: 0.0007,
  depth: 0.0007,
  /** The body left showing at each end of the bar, and between one panel and the next. */
  endInset: 0.05,
  rib: 0.02,
  panels: 3,
} as const;

function grilleSection(): Shape {
  const middle = new Vector2(0, SOUNDBAR.height / 2);
  const front = soundbarSection()
    .getPoints(200)
    .filter(
      (point) =>
        point.x > 0 && point.y >= GRILLE.bottomLip && point.y <= SOUNDBAR.height - GRILLE.topLip,
    );
  const push = (point: Vector2, by: number): Vector2 =>
    point.clone().addScaledVector(point.clone().sub(middle).normalize(), by);

  return new Shape().setFromPoints([
    ...front.map((point) => push(point, GRILLE.relief)),
    ...front.map((point) => push(point, -GRILLE.depth)).reverse(),
  ]);
}

/** One panel's length, and where the three of them sit along the bar. */
export const GRILLE_PANEL = {
  length:
    (SOUNDBAR.length - GRILLE.endInset * 2 - GRILLE.rib * (GRILLE.panels - 1)) / GRILLE.panels,
} as const;

export const GRILLE_PANEL_X: readonly number[] = Array.from(
  { length: GRILLE.panels },
  (_, index) =>
    GRILLE.endInset +
    index * (GRILLE_PANEL.length + GRILLE.rib) +
    GRILLE_PANEL.length / 2 -
    SOUNDBAR.length / 2,
);

export function createGrilleGeometry(): BufferGeometry {
  const geometry = new ExtrudeGeometry(grilleSection(), {
    depth: GRILLE_PANEL.length,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -GRILLE_PANEL.length / 2);

  return geometry;
}

/**
 * The wrap is a light charcoal rather than the near-black it looks in a product photograph:
 * the perforation multiplies it down by a third wherever a hole falls, and a bar that starts
 * black ends as a silhouette with no section left to read. The grille panels are the black —
 * they are meant to be the one part of the front that reads as an opening, so the contrast
 * between the two is the whole point and neither may drift toward the other.
 */
const WRAP = { color: "#2c333a", roughness: 0.74, metalness: 0.14 } as const;
const GRILLE_CLOTH = { color: "#141a20", roughness: 0.92, metalness: 0.06 } as const;
const END_CAP = { color: "#151a1f", roughness: 0.82, metalness: 0.12 } as const;
/**
 * The capacitive panel on top: unmarked, and told from the wrap by its finish alone. Its color
 * is the wrap's *after* the perforation has multiplied it down, which is the whole point — a
 * panel any darker than that reads from across the room as a rectangular hole in the bar,
 * which is what the first one did.
 */
const TOUCH_PANEL = { color: "#242a30", roughness: 0.34, metalness: 0.3 } as const;
const FOOT = { color: "#07090c", roughness: 0.95, metalness: 0 } as const;

const TOUCH = { width: 0.082, depth: 0.042, centerZ: -0.012 } as const;
const FOOT_SIZE = [0.1, SOUNDBAR.footHeight, 0.07] as const;
const FOOT_X = [-0.42, 0.42] as const;
/** How high up the front curve the indicator sits, and how far the curve stands out there. */
const LED = { y: 0.058, z: 0.0584, radius: 0.0013 } as const;

const BODY_Y = SOUNDBAR.footHeight;
const TOP_Y = BODY_Y + SOUNDBAR.height;

type SoundbarProps = {
  /** The surface it stands on. The bar owns the reveal its feet leave above that. */
  topY: number;
  /** Where on that surface, front to back. The bar places itself from the two together. */
  centerZ: number;
};

export function Soundbar({ topY, centerZ }: SoundbarProps): ReactElement {
  const parts = useDisposable(() => ({
    cabinet: createSoundbarGeometry(),
    grille: createGrilleGeometry(),
    perforation: createPerforationTexture(),
  }));

  return (
    <group position={[0, topY, centerZ]}>
      <mesh
        geometry={parts.cabinet}
        position={[0, BODY_Y, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
      >
        {/* Two groups come off the extrusion — the end caps first, then the wrap — so the
            materials are an array in that order rather than one finish over the whole bar. */}
        <meshStandardMaterial attach="material-0" {...END_CAP} />
        <meshStandardMaterial
          attach="material-1"
          {...WRAP}
          map={parts.perforation}
          bumpMap={parts.perforation}
          bumpScale={0.0016}
        />
      </mesh>

      {GRILLE_PANEL_X.map((x) => (
        <mesh
          key={x}
          geometry={parts.grille}
          position={[x, BODY_Y, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial
            {...GRILLE_CLOTH}
            map={parts.perforation}
            bumpMap={parts.perforation}
            bumpScale={0.0016}
          />
        </mesh>
      ))}

      <mesh position={[0, TOP_Y + 0.0003, TOUCH.centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TOUCH.width, TOUCH.depth]} />
        <meshStandardMaterial {...TOUCH_PANEL} />
      </mesh>

      {FOOT_X.map((x) => (
        <mesh key={x} position={[x, SOUNDBAR.footHeight / 2, 0]}>
          <boxGeometry args={[...FOOT_SIZE]} />
          <meshStandardMaterial {...FOOT} />
        </mesh>
      ))}

      <StatusLed
        position={[0, BODY_Y + LED.y, LED.z]}
        color={worldColors.accent}
        radius={LED.radius}
      />
    </group>
  );
}
