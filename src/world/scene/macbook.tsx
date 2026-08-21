"use client";

import { type ReactElement } from "react";
import { Instance, Instances } from "@react-three/drei";
import { stationIndex } from "@/content/pages";
import { type CanvasTexture } from "three";
import { useDisposable } from "../gpu";
import { darkMetalMaterial, portMaterial, worldColors } from "../materials";
import { type HomeApp } from "../screens/home";
import { MONO } from "../screens/kit";
import { MACBOOK_SCREEN, useMacbookScreenTexture } from "../screens/macbook";
import { createCanvasTexture } from "../screens/texture";
import { getStation } from "../stations";
import { createMarkTexture } from "./mark";
import { createSlabBody, createSlabFace, SLAB_GLASS, type SlabSpec } from "./slab";

/**
 * The MacBook Pro 16 standing open on the lounge table, in silver.
 *
 * It is two slabs and a hinge, so the shape comes from `slab.ts` — the same squircle profile
 * the iPhone and the iPad on the desk are cut from, at a third size. What a laptop adds is
 * the part a phone has no equivalent of: a **deck**. Silver aluminum is nearly the whole of
 * what a closed one shows, and the open one is read by the four things set into that silver —
 * the black key well, the speaker grille either side of it, the trackpad in front, and the
 * dark ridge of the hinge across the back. Those four, in those proportions, are what says
 * MacBook rather than laptop; the keys themselves are a texture at this distance.
 *
 * The measurements are the machine's, in meters: 35.57 × 24.81 cm, 16.8 mm closed, a 16.2"
 * panel of 34.56 × 22.34 cm, a 16 × 9.96 cm trackpad, and a 19.05 mm key pitch.
 *
 * The panel throws no light of its own, which is the one deliberate omission and a measured
 * one: a point light in front of the glass is 15 cm from a deck lying flat, so under
 * inverse-square falloff anything strong enough to see washed the keyboard and the palm rest
 * out to white, and anything weak enough not to changed no pixel in the room. The television
 * across the corner is a 1.7 m panel a meter from its wall, which is why the same trick works
 * there and not here. What the keys are lit by instead is their own backlight, which is a
 * texture — see `drawLegends` below.
 */

/** The two slabs. `fillet` breaks the top and bottom edge of a wall that is otherwise flat. */
export const MACBOOK_BASE: SlabSpec = {
  width: 0.3557,
  length: 0.2481,
  thickness: 0.0111,
  cornerRadius: 0.01,
  fillet: 0.0006,
};

export const MACBOOK_LID: SlabSpec = {
  width: 0.3557,
  length: 0.2415,
  thickness: 0.0057,
  cornerRadius: 0.01,
  fillet: 0.0005,
};

/**
 * The panel, as its own outline rather than the lid's stepped inward: the border is 5.1 mm at
 * the sides and 13 mm at the chin, so there is no single inset that could describe it and
 * therefore no concentric corner to preserve. Neither `thickness` nor `fillet` is read —
 * `createSlabFace` takes the outline alone, and a painted panel has no wall.
 */
export const MACBOOK_DISPLAY: SlabSpec = {
  width: 0.3456,
  length: 0.2234,
  thickness: 0,
  cornerRadius: 0.0055,
  fillet: 0,
};

export const CHIN = 0.013;
/** The aluminum rim left showing around the cover glass, and the two steps above the lid. */
const GLASS_RIM = 0.0007;
const GLASS_RELIEF = 0.00015;
const DISPLAY_RELIEF = 0.0005;

export const FOOT_HEIGHT = 0.0015;
const FOOT_RADIUS = 0.0055;
const FOOT_INSET = 0.028;
export const DECK_Y = FOOT_HEIGHT + MACBOOK_BASE.thickness;

/**
 * How far the lid is opened, measured from the deck the way a hinge is: 105° stands it just
 * past upright and leans the panel back, which is where a laptop actually sits and what puts
 * the room's lights across the glass rather than straight down it.
 */
export const LID_ANGLE = (105 * Math.PI) / 180;
const HINGE_Z = -MACBOOK_BASE.length / 2 + 0.006;
const HINGE_Y = DECK_Y + 0.001;
const HINGE_RADIUS = 0.005;
const HINGE_WIDTH = 0.25;

/**
 * Every part set into the deck stands a fraction of a millimeter *above* it rather than
 * being recessed into it. The body is one solid extrusion, so anything below its top face is
 * simply inside the machine and renders as nothing at all; what a visitor reads as the well
 * is the line where black meets silver, and that line is in the same place either way.
 */
const DECK_RELIEF = 0.0003;
const PLATE_THICKNESS = 0.0006;

/**
 * The board, measured off a plan view of the machine rather than guessed from a key pitch.
 * The pitch is the well-known number and the only one that is; everything around it is what
 * decides whether the block reads as a MacBook's keyboard or as a keyboard drawn at the right
 * width. **The gap is the one that matters**: at 2.7 mm the caps came out visibly small inside
 * their own field with the well showing through as a grid, and 2 mm is what the plan shows.
 * The function row is the other: its caps are shorter than the rows below, but its *pitch* is
 * not — the extra sits as a gap under it, and squeezing the pitch instead pushed the whole
 * board up into the hinge.
 */
const KEY_UNIT = 0.01905;
export const KEY_GAP = 0.002;
const ROW_PITCH = 0.0185;
const ROW_DEPTH = 0.0167;
const FUNCTION_PITCH = 0.0187;
const FUNCTION_DEPTH = 0.0137;
const KEY_HEIGHT = 0.0009;
const ROW_UNITS = 14.5;

type KeyRow = {
  readonly key: string;
  readonly pitch: number;
  readonly depth: number;
  readonly widths: readonly number[];
  /** One per width, in the same order. Empty prints nothing: the space bar and Touch ID. */
  readonly labels: readonly string[];
  /** The bottom row ends in the inverted T, whose middle column is two half-height caps. */
  readonly arrows?: boolean;
};

/**
 * The layout and its legends together, because they are the same fact twice: a width with no
 * label under it is a key the texture would print nothing on, and a label with no width is one
 * the geometry never places. The legends are the Mac's own — the four modifier glyphs, the
 * three edit glyphs and the inverted T — rather than the words a PC keyboard spells them out
 * with, which at 16 mm a key is the difference between reading as a Mac and reading as a
 * laptop.
 */
const FUNCTION_KEYS = Array.from({ length: 12 }, (_, index) => `F${index + 1}`);

const KEY_ROWS: readonly KeyRow[] = [
  // esc, twelve function keys and Touch ID, all of them half-height. Touch ID is unmarked.
  {
    key: "function",
    pitch: FUNCTION_PITCH,
    depth: FUNCTION_DEPTH,
    widths: [1.5, ...Array<number>(12).fill(1), 1],
    labels: ["esc", ...FUNCTION_KEYS, ""],
  },
  {
    key: "number",
    pitch: ROW_PITCH,
    depth: ROW_DEPTH,
    widths: [...Array<number>(13).fill(1), 1.5],
    labels: ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "\u232b"],
  },
  {
    key: "upper",
    pitch: ROW_PITCH,
    depth: ROW_DEPTH,
    widths: [1.5, ...Array<number>(12).fill(1), 1],
    labels: ["\u21e5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  },
  {
    key: "home",
    pitch: ROW_PITCH,
    depth: ROW_DEPTH,
    widths: [1.75, ...Array<number>(11).fill(1), 1.75],
    labels: ["\u21ea", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "\u23ce"],
  },
  {
    key: "lower",
    pitch: ROW_PITCH,
    depth: ROW_DEPTH,
    widths: [2.25, ...Array<number>(10).fill(1), 2.25],
    labels: ["\u21e7", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "\u21e7"],
  },
  {
    key: "modifier",
    pitch: ROW_PITCH,
    depth: ROW_DEPTH,
    widths: [1, 1, 1, 1.25, 5, 1.25, 1],
    labels: ["fn", "\u2303", "\u2325", "\u2318", "", "\u2318", "\u2325"],
    arrows: true,
  },
];

/** The inverted T, in the order the cluster is built: left, up, down, right. */
const ARROW_LABELS = ["\u25c0", "\u25b2", "\u25bc", "\u25b6"] as const;

/**
 * The field in pitch, and the block of aluminum-free deck it actually covers. They differ by
 * one gap in each direction — a cap is its pitch less a gap, so the two end caps give up half
 * of one each — and it is the *covered* block the well is cut around.
 */
export const KEY_FIELD = {
  width: ROW_UNITS * KEY_UNIT,
  depth: FUNCTION_PITCH + ROW_PITCH * 5,
} as const;

export const CAP_EXTENT = {
  width: KEY_FIELD.width - KEY_GAP,
  depth: KEY_FIELD.depth - (ROW_PITCH - ROW_DEPTH),
} as const;

export type Keycap = {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  label: string;
};

/**
 * Where every cap sits, walked row by row from the back of the field. The arrow cluster is
 * the one thing a table of widths cannot say: three columns where the middle one is split
 * across the row, which is the shape a visitor recognizes the block by.
 */
function buildKeycaps(): readonly Keycap[] {
  const caps: Keycap[] = [];
  let z = -KEY_FIELD.depth / 2;

  for (const row of KEY_ROWS) {
    const center = z + row.pitch / 2;
    let x = -KEY_FIELD.width / 2;

    row.widths.forEach((units, column) => {
      const span = units * KEY_UNIT;
      caps.push({
        id: `${row.key}:${column}`,
        x: x + span / 2,
        z: center,
        width: span - KEY_GAP,
        depth: row.depth,
        label: row.labels[column] ?? "",
      });
      x += span;
    });

    if (row.arrows) {
      const half = (row.depth - KEY_GAP) / 2;
      const offset = (half + KEY_GAP) / 2;
      caps.push(
        {
          id: `${row.key}:arrow-left`,
          x: x + KEY_UNIT / 2,
          z: center,
          width: KEY_UNIT - KEY_GAP,
          depth: row.depth,
          label: ARROW_LABELS[0],
        },
        {
          id: `${row.key}:arrow-up`,
          x: x + KEY_UNIT * 1.5,
          z: center - offset,
          width: KEY_UNIT - KEY_GAP,
          depth: half,
          label: ARROW_LABELS[1],
        },
        {
          id: `${row.key}:arrow-down`,
          x: x + KEY_UNIT * 1.5,
          z: center + offset,
          width: KEY_UNIT - KEY_GAP,
          depth: half,
          label: ARROW_LABELS[2],
        },
        {
          id: `${row.key}:arrow-right`,
          x: x + KEY_UNIT * 2.5,
          z: center,
          width: KEY_UNIT - KEY_GAP,
          depth: row.depth,
          label: ARROW_LABELS[3],
        },
      );
    }

    z += row.pitch;
  }

  return caps;
}

export const KEYCAPS = buildKeycaps();

/**
 * The legends, printed by walking the very array the caps are instanced from — so a key added
 * to the layout is a key added to the texture by construction, and there is no second table to
 * keep in step. `scene/keyboard.tsx` prints the desk's board the same way.
 *
 * They are **backlit**, which is the whole reason this is a texture and not paint: white
 * glyphs with a glow under them read as light coming *through* a cap rather than ink lying on
 * one, and in a room this dark that glow is most of what says the machine is awake.
 *
 * The glow is drawn as a *separate, faint pass* under a sharp one, and that split is load-
 * bearing. The room runs a bloom pass over the whole frame, and bloom works on area: 78 glyphs
 * each wearing a full-strength halo is not 78 lit keys, it is one lit rectangle — the board
 * came back from the lounge as a light gray plate with white dots on it, brighter than the
 * palm rest beside it. A dim halo blooms as a halo.
 *
 * 3000 px/m gives a 19 mm key 57 px, which is enough for a glyph at a meter and cheap at
 * 830 × 320 for the whole board.
 */
const LEGEND_PIXELS_PER_METER = 3000;
const LEGEND_WIDTH = Math.round(KEY_FIELD.width * LEGEND_PIXELS_PER_METER);
const LEGEND_HEIGHT = Math.round(KEY_FIELD.depth * LEGEND_PIXELS_PER_METER);
/** Of the cap's own depth, so the half-height function row prints at half the size. */
const LEGEND_SIZE = 0.4;
/** How far the glow carries past its glyph, and how much of it survives to be bloomed. */
const LEGEND_GLOW = 0.55;
const LEGEND_GLOW_ALPHA = 0.3;
/** A word does not fit a key at the size a glyph does — "esc" and "fn" are the only two. */
const LEGEND_WORD_SCALE = 0.62;
const LEGEND_WORD_LENGTH = 1;

export function drawLegends(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = worldColors.coolLightCore;
  ctx.shadowColor = worldColors.coolLightCore;

  for (const cap of KEYCAPS) {
    if (!cap.label) continue;
    const size =
      cap.depth *
      LEGEND_PIXELS_PER_METER *
      LEGEND_SIZE *
      (cap.label.length > LEGEND_WORD_LENGTH ? LEGEND_WORD_SCALE : 1);
    const x = (cap.x + KEY_FIELD.width / 2) * LEGEND_PIXELS_PER_METER;
    const y = (cap.z + KEY_FIELD.depth / 2) * LEGEND_PIXELS_PER_METER;

    ctx.font = `${size.toFixed(2)}px ${MONO}`;

    ctx.globalAlpha = LEGEND_GLOW_ALPHA;
    ctx.shadowBlur = size * LEGEND_GLOW;
    ctx.fillText(cap.label, x, y);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillText(cap.label, x, y);
  }
}

function createLegendTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(LEGEND_WIDTH, LEGEND_HEIGHT, {
    // Read at a glancing angle from meters away and never repainted: without the chain the
    // glyphs crawl on every camera move, which on a grid this regular is very visible.
    mipmapped: true,
  });
  const ctx = canvas.getContext("2d");
  if (ctx) drawLegends(ctx);
  texture.needsUpdate = true;
  return texture;
}

/** The deck, front to back: a finger recess, the trackpad, the key well, then the hinge. */
const FRONT_Z = MACBOOK_BASE.length / 2;
export const TRACKPAD = { width: 0.16, depth: 0.0996, front: 0.012 } as const;
export const TRACKPAD_Z = FRONT_Z - TRACKPAD.front - TRACKPAD.depth / 2;
/** The hairline the glass is set into, showing as a border because the plate above is smaller. */
const TRACKPAD_SEAM = 0.0006;

/** How far the black runs past the last cap. Two millimeters, and it looks like four. */
const WELL_MARGIN = 0.002;
export const WELL = {
  width: CAP_EXTENT.width + WELL_MARGIN * 2,
  depth: CAP_EXTENT.depth + WELL_MARGIN * 2,
} as const;
/** The well all but touches the trackpad; what is left over is the margin behind it. */
const WELL_GAP = 0.003;
export const WELL_Z = TRACKPAD_Z - TRACKPAD.depth / 2 - WELL_GAP - WELL.depth / 2;

/**
 * The perforated panels either side of the keys. They very nearly fill what the well leaves —
 * 35 mm of the 39 mm between the black and the wall — so a narrow one reads as a strip of trim
 * and leaves the deck looking like a keyboard sitting in a wide silver frame.
 */
const GRILLE = { inner: 0.0015, outer: 0.0025, depth: 0.111 } as const;
export const GRILLE_WIDTH = MACBOOK_BASE.width / 2 - WELL.width / 2 - GRILLE.inner - GRILLE.outer;
export const GRILLE_X = WELL.width / 2 + GRILLE.inner + GRILLE_WIDTH / 2;
export const GRILLE_DEPTH = GRILLE.depth;

/**
 * The dip in the front wall a lid is opened by, drawn as the shadow it casts rather than cut
 * out of the wall. It is a scoop a couple of millimeters deep on the real machine, so it is
 * the seam gray and not the ports' black — at full contrast it reads as a sticker across the
 * front, which is what it did the first time it was rendered.
 */
const RECESS = { width: 0.072, height: 0.0018, depth: 0.0004 } as const;

/**
 * The two side walls, back to front. A laptop is the one object in this room whose ports face
 * sideways rather than at the visitor, so they read as slots in a wall seen almost edge-on —
 * which is exactly what they are, and why they are set into the wall rather than modeled.
 */
const PORT_DEPTH = 0.003;
const PORT_RELIEF = 0.0005;
type Port = { key: string; side: 1 | -1; z: number; length: number; height: number };

export const PORTS: readonly Port[] = [
  { key: "magsafe", side: -1, z: -0.06, length: 0.012, height: 0.003 },
  { key: "thunderbolt-rear", side: -1, z: -0.02, length: 0.0084, height: 0.0026 },
  { key: "thunderbolt-front", side: -1, z: 0.02, length: 0.0084, height: 0.0026 },
  { key: "headphone", side: -1, z: 0.065, length: 0.0035, height: 0.0035 },
  { key: "hdmi", side: 1, z: -0.05, length: 0.015, height: 0.0045 },
  { key: "sd-card", side: 1, z: 0, length: 0.024, height: 0.0022 },
  { key: "thunderbolt-right", side: 1, z: 0.05, length: 0.0084, height: 0.0026 },
];

export const PORT_Y = FOOT_HEIGHT + MACBOOK_BASE.thickness / 2;

/**
 * The finishes.
 *
 * The aluminum is **not** `slab.ts`'s silver, which is the one thing this object cannot share
 * with the phone and the iPad. Those are two thin walls seen almost edge-on; this is a 35 × 25
 * cm plate lying face up under the lounge's ceiling panel, and at their albedo it rendered as
 * a white slab — over the bloom threshold across its whole surface, with the keys, the
 * trackpad and its own edges washed out of it. `scene/mac-studio.tsx` reaches the same place
 * from the other side and for the same reason. So the albedo is stepped down between the two
 * and the metal carries the silver, which is also what an aluminum machine in a dim room
 * actually looks like rather than what it looks like in a daylit photograph of one.
 */
const ALUMINUM = { color: "#6b7178", roughness: 0.45, metalness: 0.44 } as const;
/**
 * The well is the only part of the backlight a visitor can actually see: the caps cover all of
 * it but the gaps, so a faint emissive here *is* light leaking around each key. Kept low —
 * the room runs a bloom pass, and a well bright enough to read as a lamp turns the whole board
 * into one white rectangle.
 */
const KEY_WELL = {
  color: "#07080a",
  roughness: 0.82,
  metalness: 0.08,
  emissive: worldColors.coolLightCore,
  emissiveIntensity: 0.02,
} as const;
/**
 * Black, and not metal at all. At any metalness the caps take their color from what they
 * reflect, and everything in this room is cyan — so a "dark gray" keyboard rendered as a
 * slate-blue one, which is the note that came back off the first build.
 *
 * Dropping metalness is not enough on its own, which is the note that came back off the
 * second: a dielectric in three.js reflects 4% head-on but 100% at a grazing angle, and the
 * caps are flat panels lying face up, so the whole field turns to sheen the moment the camera
 * comes down toward table height — black from above, gray from the sofa. `specularIntensity`
 * is what bounds that (it scales the grazing end of the Fresnel curve, which `roughness`
 * does not), and it is the one knob `MeshStandardMaterial` does not expose — hence the
 * physical material here and nowhere else on this object. A key is molded plastic: matte from
 * every angle is the *more* accurate answer, not a cheat to dodge the highlight.
 */
const KEYCAP = {
  color: "#0b0e10",
  roughness: 0.9,
  metalness: 0,
  specularIntensity: 0.25,
} as const;
/** Perforated, so it reads a shade under the deck it is cut into rather than beside it. */
const GRILLE_FACE = { color: "#585e65", roughness: 0.66, metalness: 0.3 } as const;
/** Glass, so it is the deck's own tone taken smoother rather than a lighter panel laid on
 *  it: on the machine the trackpad is the same aluminum seen through 0.6 mm of glass. */
const TRACKPAD_GLASS = { color: "#70767d", roughness: 0.24, metalness: 0.4 } as const;
const SEAM = { color: "#3a4046", roughness: 0.8, metalness: 0.2 } as const;
const FOOT = { color: "#0e1216", roughness: 0.92, metalness: 0.05 } as const;
/** The mark is a polished inlay in the lid, never lighter than it and only glossier. */
const MARK = { color: "#6e767d", roughness: 0.16, metalness: 0.72 } as const;
const MARK_SIZE = MACBOOK_LID.width * 0.115;

/**
 * The stations, bound at module scope so the array's identity is stable: the screen texture
 * has it as an effect dependency, and a fresh array per render would repaint and re-upload
 * half a megabyte of desktop on every frame.
 */
const APPS: readonly HomeApp[] = stationIndex.map(({ slug, label }) => ({
  label,
  accent: getStation(slug).accent,
}));

const CAP_TOP = DECK_Y + PLATE_THICKNESS + KEY_HEIGHT;

function Keys(): ReactElement {
  const legends = useDisposable(() => createLegendTexture());

  return (
    <group>
      {/* Culled on the base cap's bounds rather than the field's, and the bounds are measured
          before drei has placed a single instance — so the sphere comes out empty and the whole
          board disappears whenever the camera is closer than about a meter, leaving the bare
          well plate reading as a gray slab where the keys should be. `scene/shelving.tsx` hit
          this with the puzzle stickers. Off, because the field is one small draw call that is
          only ever in shot when the laptop is. */}
      <Instances
        limit={KEYCAPS.length}
        range={KEYCAPS.length}
        frustumCulled={false}
        position={[0, CAP_TOP - KEY_HEIGHT / 2, WELL_Z]}
      >
        <boxGeometry args={[1, KEY_HEIGHT, 1]} />
        <meshPhysicalMaterial {...KEYCAP} />
        {KEYCAPS.map((cap) => (
          <Instance key={cap.id} position={[cap.x, 0, cap.z]} scale={[cap.width, 1, cap.depth]} />
        ))}
      </Instances>
      {/* Unlit and unfogged, like every other lit thing in the room: a backlight emits, and a
          standard material would add the lounge's lamp to it and wash the glow out. */}
      <mesh position={[0, CAP_TOP + 0.0002, WELL_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[KEY_FIELD.width, KEY_FIELD.depth]} />
        <meshBasicMaterial map={legends} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Deck(): ReactElement {
  const body = useDisposable(() => createSlabBody(MACBOOK_BASE));
  const plateY = DECK_Y + DECK_RELIEF;

  return (
    <group>
      <mesh
        geometry={body}
        position={[0, FOOT_HEIGHT + MACBOOK_BASE.fillet, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...ALUMINUM} />
      </mesh>

      <mesh position={[0, plateY, WELL_Z]}>
        <boxGeometry args={[WELL.width, PLATE_THICKNESS, WELL.depth]} />
        <meshStandardMaterial {...KEY_WELL} />
      </mesh>
      <Keys />

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * GRILLE_X, plateY, WELL_Z]}>
          <boxGeometry args={[GRILLE_WIDTH, PLATE_THICKNESS, GRILLE.depth]} />
          <meshStandardMaterial {...GRILLE_FACE} />
        </mesh>
      ))}

      <mesh position={[0, plateY, TRACKPAD_Z]}>
        <boxGeometry
          args={[
            TRACKPAD.width + TRACKPAD_SEAM * 2,
            PLATE_THICKNESS * 0.6,
            TRACKPAD.depth + TRACKPAD_SEAM * 2,
          ]}
        />
        <meshStandardMaterial {...SEAM} />
      </mesh>
      <mesh position={[0, plateY + PLATE_THICKNESS * 0.4, TRACKPAD_Z]}>
        <boxGeometry args={[TRACKPAD.width, PLATE_THICKNESS, TRACKPAD.depth]} />
        <meshStandardMaterial {...TRACKPAD_GLASS} />
      </mesh>

      <mesh position={[0, DECK_Y - RECESS.height, FRONT_Z - RECESS.depth / 2 + PORT_RELIEF]}>
        <boxGeometry args={[RECESS.width, RECESS.height, RECESS.depth]} />
        <meshStandardMaterial {...SEAM} />
      </mesh>

      {PORTS.map((port) => (
        <mesh
          key={port.key}
          position={[
            port.side * (MACBOOK_BASE.width / 2 + PORT_RELIEF - PORT_DEPTH / 2),
            PORT_Y,
            port.z,
          ]}
        >
          <boxGeometry args={[PORT_DEPTH, port.height, port.length]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}

      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx},${sz}`}
            position={[
              sx * (MACBOOK_BASE.width / 2 - FOOT_INSET),
              FOOT_HEIGHT / 2,
              sz * (MACBOOK_BASE.length / 2 - FOOT_INSET),
            ]}
          >
            <cylinderGeometry args={[FOOT_RADIUS, FOOT_RADIUS, FOOT_HEIGHT, 12]} />
            <meshStandardMaterial {...FOOT} />
          </mesh>
        )),
      )}

      <mesh position={[0, HINGE_Y - HINGE_RADIUS, HINGE_Z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[HINGE_RADIUS, HINGE_RADIUS, HINGE_WIDTH, 16]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
    </group>
  );
}

/**
 * The lid, standing rather than lying: `createSlabBody` draws its profile in the XY plane and
 * extrudes along z, which is already a panel on its edge — so unlike the two devices on the
 * desk this one is *not* turned face-up. Its own frame is the useful one, with the hinge at
 * the origin, the panel running up +y and the glass facing +z at whoever is sitting there.
 */
function Lid(): ReactElement {
  const screen = useMacbookScreenTexture(APPS);
  const parts = useDisposable(() => ({
    body: createSlabBody(MACBOOK_LID),
    glass: createSlabFace(MACBOOK_LID, GLASS_RIM),
    display: createSlabFace(MACBOOK_DISPLAY, 0),
    mark: createMarkTexture(),
  }));
  const displayY = CHIN + MACBOOK_DISPLAY.length / 2;

  return (
    <group position={[0, HINGE_Y, HINGE_Z]} rotation={[Math.PI / 2 - LID_ANGLE, 0, 0]}>
      <mesh geometry={parts.body} position={[0, MACBOOK_LID.length / 2, MACBOOK_LID.fillet]}>
        <meshStandardMaterial {...ALUMINUM} />
      </mesh>
      <mesh
        geometry={parts.glass}
        position={[0, MACBOOK_LID.length / 2, MACBOOK_LID.thickness + GLASS_RELIEF]}
      >
        <meshStandardMaterial {...SLAB_GLASS} />
      </mesh>
      {/* Unlit, like the phone's and the tablet's: a lit material adds the room's light to
          what the panel emits, so every colored hotspot sweeping the lounge washes a second
          copy of the desktop over the real one. A screen emits; it does not also catch light. */}
      <mesh
        geometry={parts.display}
        position={[0, displayY, MACBOOK_LID.thickness + DISPLAY_RELIEF]}
      >
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      {/* Turned to read from behind the machine, which is the only side it can be read from. */}
      <mesh position={[0, MACBOOK_LID.length / 2, -0.0003]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[MARK_SIZE, MARK_SIZE]} />
        <meshStandardMaterial map={parts.mark} transparent depthWrite={false} {...MARK} />
      </mesh>
    </group>
  );
}

export function Macbook(): ReactElement {
  return (
    <group>
      <Deck />
      <Lid />
    </group>
  );
}

/** The modeled panel, for the spec that holds the canvas to the shape it is painted on. */
export const DISPLAY = {
  width: MACBOOK_DISPLAY.width,
  length: MACBOOK_DISPLAY.length,
  aspect: MACBOOK_DISPLAY.width / MACBOOK_DISPLAY.length,
  canvasAspect: MACBOOK_SCREEN.width / MACBOOK_SCREEN.height,
} as const;
