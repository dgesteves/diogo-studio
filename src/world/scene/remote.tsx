"use client";

import { type ReactElement } from "react";
import { type CanvasTexture } from "three";
import { useDisposable } from "../gpu";
import { worldColors } from "../materials";
import { createCanvasTexture } from "../screens/texture";
import { StatusLed } from "./status-led";
import {
  createSlabBody,
  createSlabFace,
  FACE_UP,
  SLAB_FRAME,
  SLAB_GLASS,
  type SlabSpec,
} from "./slab";

/**
 * The television's remote, lying on the lounge table.
 *
 * `scene/slab.ts` says of its own corner that "a rounded rectangle of the right radius still
 * reads as a remote control", and this is that sentence taken at its word: the remote is the
 * third caller of the phone's shape, at its own measurements, and gets the corner the room's
 * other devices have rather than a `RoundedBox` — one radius on twelve edges rounds the flat
 * sides too, and the box that stood here was a lozenge with a glowing dot on it.
 *
 * What makes it read at this size is the **button field**: a circular clickpad above three
 * ranks of round keys. It is printed rather than modeled, because eight 11 mm keys with
 * 0.2 mm of relief are a texture from anywhere in this room — `scene/phone.tsx` leaves its
 * side buttons off for the same reason, and the port in this one's bottom edge goes with them.
 *
 * It is lit, and lit in the two places the room can afford. The accent bead that used to sit
 * on the old box was 12 mm across and the loudest thing on a table that also holds an open
 * laptop; what is here instead is a **thin ring around the clickpad and one bead at the nose**,
 * which is the shape `world/postprocessing.tsx` blooms into a halo rather than a plate. Backlit
 * key legends were tried on the MacBook and are the counter-example: bloom accumulates by
 * area, so eight lit glyphs are not eight lit keys, they are one lit rectangle.
 */

/**
 * In meters: 176 × 46 × 13 mm, with an 18 mm corner. A full-sized television remote rather
 * than the streaming-box shape it started as — at 136 mm it was the same object as the phone
 * on the desk and read, on a table beside an open laptop, as something dropped there rather
 * than as the thing the television is worked from.
 */
export const REMOTE: SlabSpec = {
  width: 0.046,
  length: 0.176,
  thickness: 0.013,
  cornerRadius: 0.018,
  fillet: 0.0024,
};

/** The aluminum the black face is set into, which shows all the way round it. */
const RIM = 0.0016;
const FACE_Y = REMOTE.thickness + 0.00015;
const RING_Y = REMOTE.thickness + 0.0005;

/**
 * The field, in millimeters from the top of the face — the one set of numbers that makes this
 * object the thing it is. The clickpad is nearly the full width; the keys sit in two columns
 * under it, which is what leaves the bottom third blank and stops the face reading as a grid.
 */
const PAD = { x: 23, y: 60, radius: 17.5, center: 8.5 } as const;
const KEY_RADIUS = 5.5;
const KEYS = [
  { key: "back", x: 12, y: 17, glyph: "chevron" },
  { key: "power", x: 34, y: 17, glyph: "power" },
  { key: "guide", x: 12, y: 99, glyph: "panel" },
  { key: "mute", x: 34, y: 99, glyph: "bar" },
  { key: "play", x: 12, y: 122, glyph: "play" },
  { key: "voice", x: 34, y: 122, glyph: "dot" },
  { key: "volume-down", x: 12, y: 145, glyph: "bar" },
  { key: "volume-up", x: 34, y: 145, glyph: "plus" },
] as const;

/**
 * 4800 px/m, which is about three times the density the mug and the coaster are printed at
 * and is what an 11 mm key needs: at the phone's density a key came out 15 px across and its
 * glyph closed up into a blob.
 */
export const REMOTE_PRINT = { width: 221, height: 845 } as const;

/**
 * The paint box, not the room's surface list — the same rule the coaster's print follows. The
 * glyphs stay a mid gray on purpose: `world/postprocessing.tsx` blooms by area, and six white
 * marks on a black panel bloom together into one lit plate rather than into six keys.
 */
const INK = {
  panel: "#0c1114",
  panelLip: "#191f25",
  key: "#20272e",
  keyLip: "#2e3941",
  pad: "#141a1f",
  padRing: "#39434c",
  glyph: "#7e8b96",
} as const;

function paintRemoteFace(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;
  const mm = width / (REMOTE.width * 1000);
  const key = KEY_RADIUS * mm;

  ctx.fillStyle = INK.panel;
  ctx.fillRect(0, 0, width, height);

  // The face is glass over a dark plastic, so it is lightest where it turns at the edge.
  const lip = ctx.createLinearGradient(0, 0, width, 0);
  lip.addColorStop(0, INK.panelLip);
  lip.addColorStop(0.16, INK.panel);
  lip.addColorStop(0.84, INK.panel);
  lip.addColorStop(1, INK.panelLip);
  ctx.fillStyle = lip;
  ctx.fillRect(0, 0, width, height);

  const padX = PAD.x * mm;
  const padY = PAD.y * mm;
  ctx.fillStyle = INK.pad;
  ctx.beginPath();
  ctx.arc(padX, padY, PAD.radius * mm, 0, Math.PI * 2);
  ctx.fill();
  // Only the inner button is drawn, and as a ring rather than a disc: it is flush with the
  // pad around it and shows only where the two surfaces meet. The pad's own rim is modeled
  // below, so printing a second circle there put two edges a pixel apart.
  ctx.strokeStyle = INK.padRing;
  ctx.lineWidth = Math.max(1, mm * 0.35);
  ctx.beginPath();
  ctx.arc(padX, padY, PAD.center * mm, 0, Math.PI * 2);
  ctx.stroke();

  for (const button of KEYS) {
    const x = button.x * mm;
    const y = button.y * mm;
    ctx.fillStyle = INK.key;
    ctx.beginPath();
    ctx.arc(x, y, key, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK.keyLip;
    ctx.lineWidth = Math.max(1, mm * 0.3);
    ctx.stroke();
    paintGlyph(ctx, button.glyph, x, y, key * 0.44);
  }
}

/**
 * One key's mark. Every glyph is drawn inside a box of `size`, in strokes rather than filled
 * shapes, so each of them survives being minified to a few pixels as a smudge in the right
 * place instead of as a solid dot.
 */
function paintGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: (typeof KEYS)[number]["glyph"],
  x: number,
  y: number,
  size: number,
): void {
  ctx.strokeStyle = INK.glyph;
  ctx.fillStyle = INK.glyph;
  ctx.lineWidth = Math.max(1, size * 0.26);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  switch (glyph) {
    case "chevron":
      ctx.moveTo(x + size * 0.45, y - size);
      ctx.lineTo(x - size * 0.5, y);
      ctx.lineTo(x + size * 0.45, y + size);
      ctx.stroke();
      break;
    case "power":
      ctx.arc(x, y + size * 0.12, size * 0.85, -Math.PI * 0.35, Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.05);
      ctx.lineTo(x, y - size * 0.05);
      ctx.stroke();
      break;
    case "panel":
      ctx.rect(x - size * 0.9, y - size * 0.65, size * 1.8, size * 1.3);
      ctx.stroke();
      break;
    case "bar":
      ctx.moveTo(x - size * 0.85, y);
      ctx.lineTo(x + size * 0.85, y);
      ctx.stroke();
      break;
    case "play":
      ctx.moveTo(x - size * 0.6, y - size * 0.8);
      ctx.lineTo(x + size * 0.75, y);
      ctx.lineTo(x - size * 0.6, y + size * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    case "dot":
      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "plus":
      ctx.moveTo(x - size * 0.85, y);
      ctx.lineTo(x + size * 0.85, y);
      ctx.moveTo(x, y - size * 0.85);
      ctx.lineTo(x, y + size * 0.85);
      ctx.stroke();
      break;
  }
}

export function createRemoteFaceTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(REMOTE_PRINT.width, REMOTE_PRINT.height, {
    // Painted once, then read from across the room at a glancing angle — the coaster's case.
    mipmapped: true,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintRemoteFace(ctx);
  texture.needsUpdate = true;
  return texture;
}

/**
 * The face's finish is the room's cover glass; only its albedo is overridden, and only because
 * the print now carries the black. Left at `SLAB_GLASS`'s own near-black the map would be
 * multiplied into nothing and the button field would never appear — the same one-value
 * exception `scene/mac-studio.tsx` makes to `SLAB_FRAME`.
 */
const FACE = { ...SLAB_GLASS, color: "#eef2f6" } as const;
/**
 * Graphite, not the desk cluster's silver. The finish is the family's — this is the same
 * anodized shell as the phone beside it — but the albedo is stepped down, for the reason
 * `scene/mac-studio.tsx` steps its own down and this room keeps running into: bloom
 * accumulates by *area*, and the chamfer around a 13 cm device is a 2 mm band running its
 * whole length, so at `SLAB_FRAME`'s own silver the remote left a white streak on the table
 * from four meters and nothing else. A remote left on a dark table is a dark object.
 */
const BODY = { ...SLAB_FRAME, color: "#5a626a" } as const;
/**
 * The clickpad's rim, modeled and lit rather than printed. A ring is the safe shape for this:
 * its lit area is a circumference times a third of a millimeter, so bloom gives it a halo,
 * where the same light spread over the eight key legends gives a plate. Basic rather than
 * standard and untone-mapped, for the reason `scene/phone.tsx` gives about its display — a
 * light emits, it does not also catch the room.
 */
const PAD_RING = { tube: 0.00035, radius: PAD.radius / 1000 } as const;
/** The bead at the nose, at the size the room's other indicators are drawn. */
const NOSE_LED = { radius: 0.0012, inset: 0.009 } as const;

/**
 * Where the printed pad lands in the room. The field is measured from the top of the face,
 * and `FACE_UP` turns the shape's `+y` — its top — toward `-z`, so the two run opposite ways.
 */
export const PAD_Z = PAD.y / 1000 - REMOTE.length / 2;

export function Remote(): ReactElement {
  const parts = useDisposable(() => ({
    body: createSlabBody(REMOTE),
    face: createSlabFace(REMOTE, RIM),
    print: createRemoteFaceTexture(),
  }));

  return (
    <group>
      <mesh geometry={parts.body} position={[0, REMOTE.fillet, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...BODY} />
      </mesh>
      <mesh geometry={parts.face} position={[0, FACE_Y, 0]} rotation={FACE_UP}>
        <meshStandardMaterial map={parts.print} {...FACE} />
      </mesh>
      <mesh position={[0, RING_Y, PAD_Z]} rotation={FACE_UP}>
        <torusGeometry args={[PAD_RING.radius, PAD_RING.tube, 6, 48]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      {/* Turned face up: `StatusLed`'s halo is a disc in its own XY plane, and left standing
          it is edge-on to a remote lying on a table — a bead with no glow around it. */}
      <group position={[0, RING_Y, NOSE_LED.inset - REMOTE.length / 2]} rotation={FACE_UP}>
        <StatusLed position={[0, 0, 0]} color={worldColors.accent} radius={NOSE_LED.radius} />
      </group>
    </group>
  );
}
