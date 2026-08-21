"use client";

import { type ReactElement } from "react";
import {
  ExtrudeGeometry,
  Shape,
  ShapeGeometry,
  type BufferGeometry,
  type CanvasTexture,
} from "three";
import { useDisposable } from "../gpu";
import { portMaterial, worldColors } from "../materials";
import { createCanvasTexture } from "../screens/texture";
import { StatusLed } from "./status-led";

/**
 * The Mac Studio on the desk, modeled from the machine rather than from a box.
 *
 * The thing that makes one recognizable is not its proportions — those are just a squat
 * square — but **which of its edges are round**. The four vertical corners take a radius a
 * tenth of the width; the top and bottom edges take a fillet a fifth of that; and everything
 * between them is flat. A rounded box cannot say that, because one radius rounds all twelve
 * edges alike and turns it into a pillow, which is what stood here before. So the body is an
 * extruded profile instead: a rounded square swept upward, with a small bevel at each end.
 * The flat top that leaves is the machine's most recognizable surface, and it gets its own
 * plate — the seam where the plate meets the fillet is visible on the real one.
 *
 * The dimensions are the real machine's ratios, at the size the cluster was already built
 * for: 19.7 cm square by 9.5 cm, which is a height of 0.48 of the width.
 */

export const MAC_STUDIO = {
  width: 0.27,
  depth: 0.27,
  height: 0.13,
  /** The plan-view corner. Ten percent of the width, measured off the product. */
  cornerRadius: 0.027,
  /** The top and bottom fillets, which are a fifth of the corner and no more. */
  edgeFillet: 0.0055,
  /**
   * The dark intake the aluminum stands on. A reveal, not a plinth: at 0.012 it was a black
   * slab the machine was sitting on top of, which is what the desk shadow was blamed for
   * first. The aluminum takes back whatever this gives up — `BODY_HEIGHT` is the remainder.
   */
  baseHeight: 0.004,
  baseInset: 0.005,
} as const;

export const BODY_HEIGHT = MAC_STUDIO.height - MAC_STUDIO.baseHeight;
const TOP_Y = MAC_STUDIO.height;
/** How far inside the flat top's own edge the lid's seam runs. */
const LID_SEAM = 0.0015;

/**
 * Aluminum, as this room can light it. `scene/monitor-rig.tsx` floods the cluster from 0.4 m
 * away with a cyan point light, so a true silver albedo renders as a lamp: the box is the
 * largest flat surface on the desk and it clips to white with no edges left, then blooms. The
 * albedo is therefore a dark gray and the metal is carried by the specular term — which is
 * also what a silver machine standing in a cyan-lit room would actually look like, rather
 * than what it looks like in a daylit photograph of one.
 */
const ALUMINUM = { color: "#666d74", roughness: 0.5, metalness: 0.45 } as const;
/** The lid is a smoother plate than the extrusion, and the only part that reads near-white. */
const LID = { color: "#737a81", roughness: 0.4, metalness: 0.42 } as const;
const BASE = { color: "#171c21", roughness: 0.9, metalness: 0.15 } as const;
/** The mark is a polished inlay: it is never lighter than the lid, only glossier. */
const MARK = { color: "#454c53", roughness: 0.18, metalness: 0.7 } as const;

/**
 * The rounded square both the body and the lid are cut from. `inset` shrinks it without
 * changing its corner, so the lid sits inside the body's top fillet rather than over it.
 * The inset is a seam, not a border: the plate on the real machine runs to where the fillet
 * starts turning, and anything wider reads as a panel sitting on the lid.
 */
export function macProfile(inset = 0): Shape {
  const halfWidth = MAC_STUDIO.width / 2 - inset;
  const halfDepth = MAC_STUDIO.depth / 2 - inset;
  const radius = Math.max(0.001, MAC_STUDIO.cornerRadius - inset);
  const shape = new Shape();

  shape.moveTo(-halfWidth + radius, -halfDepth);
  shape.lineTo(halfWidth - radius, -halfDepth);
  shape.absarc(halfWidth - radius, -halfDepth + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(halfWidth, halfDepth - radius);
  shape.absarc(halfWidth - radius, halfDepth - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(-halfWidth + radius, halfDepth);
  shape.absarc(-halfWidth + radius, halfDepth - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-halfWidth, -halfDepth + radius);
  shape.absarc(-halfWidth + radius, -halfDepth + radius, radius, Math.PI, Math.PI * 1.5, false);

  return shape;
}

/**
 * The body, and the two places `ExtrudeGeometry` will quietly resize a machine if it is taken
 * at face value.
 *
 * **The bevel grows outward.** The widest section is the profile *plus* `bevelSize`, not the
 * profile — so the shape has to be drawn a fillet small for the box to come out 27 cm wide,
 * and the flat top it leaves is that smaller profile. Fed the finished outline instead, this
 * one came out 28.1 cm across, which put the front wall half a millimeter in front of its own
 * ports and hid every one of them.
 *
 * **It also grows downward.** The run spans `-bevelThickness … depth + bevelThickness`, so the
 * mesh is lifted by one fillet to stand on the base rather than sink into it.
 */
export const BODY_LIFT = MAC_STUDIO.edgeFillet;

export function createBodyGeometry(): BufferGeometry {
  const fillet = MAC_STUDIO.edgeFillet;

  return new ExtrudeGeometry(macProfile(fillet), {
    depth: BODY_HEIGHT - fillet * 2,
    bevelEnabled: true,
    bevelSize: fillet,
    bevelThickness: fillet,
    bevelSegments: 4,
    curveSegments: 16,
  });
}

/** The lid covers the flat top the bevel leaves, less a seam so it cannot z-fight its edge. */
export function createLidGeometry(): BufferGeometry {
  return new ShapeGeometry(macProfile(MAC_STUDIO.edgeFillet + LID_SEAM), 16);
}

/**
 * The front, in the order the machine has it: two USB-C ports standing on end, an SD slot
 * beside them, all of it in the left third, and the status LED alone out to the right. One
 * line carries all four — the LED sits at the ports' own height rather than under them — so
 * the face reads as a single row weighted to the left, which is most of what a panel this
 * small can say. Both ends stop short of the corner radius, where the wall has already begun
 * turning away from the camera and anything set into it reads as a scratch.
 */
export const PORT_Y = MAC_STUDIO.baseHeight + BODY_HEIGHT * 0.36;
export const LED_X = 0.078;
export const FRONT_Z = MAC_STUDIO.depth / 2;
/** How far a port's black box stands out of the wall: enough not to z-fight, no more. */
export const PORT_RELIEF = 0.0005;
const PORT_DEPTH = 0.004;
const USB_C = { width: 0.0038, height: 0.0118 } as const;
const SD_SLOT = { width: 0.03, height: 0.0032 } as const;

export const FRONT_PORTS = [
  { key: "usb-c-left", x: -0.095, ...USB_C },
  { key: "usb-c-right", x: -0.077, ...USB_C },
  { key: "sd-card", x: -0.045, ...SD_SLOT },
] as const;

/**
 * The mark on the lid, painted rather than modeled: two lobes flooded together, then the
 * valley and the bite punched back out of them. A silhouette this shape has no inside to
 * trace — the bite is a piece missing from the outline, not a hole in a face — so cutting is
 * the operation that describes it, and the leaf is the one piece drawn on top afterwards.
 */
const MARK_PIXELS = 128;
const MARK_SIZE = MAC_STUDIO.width * 0.17;

export function paintMark(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  const unit = size / 100;
  const x = size / 2;
  const y = size * 0.57;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 14 * unit, y, 26 * unit, 29 * unit, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The lobes are round at the foot and the fruit is not, so the base is drawn across them.
  ctx.beginPath();
  ctx.ellipse(x, y + 16 * unit, 25 * unit, 17 * unit, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.ellipse(x, y - 33 * unit, 12 * unit, 11 * unit, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 45 * unit, y - 3 * unit, 15 * unit, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // The leaf, leaning right out of the valley: two arcs meeting at a point at either end.
  ctx.beginPath();
  ctx.moveTo(x + unit, y - 29 * unit);
  ctx.quadraticCurveTo(x + 6 * unit, y - 49 * unit, x + 19 * unit, y - 51 * unit);
  ctx.quadraticCurveTo(x + 14 * unit, y - 33 * unit, x + unit, y - 29 * unit);
  ctx.fill();
}

function createMarkTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(MARK_PIXELS, MARK_PIXELS, {
    // Read from above at a glancing angle across the room, never repainted: the same case
    // as a book's cloth.
    mipmapped: true,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintMark(ctx);
  texture.needsUpdate = true;
  return texture;
}

export function MacStudio(): ReactElement {
  const { body, lid, mark } = useDisposable(() => ({
    body: createBodyGeometry(),
    lid: createLidGeometry(),
    mark: createMarkTexture(),
  }));

  return (
    <group>
      <mesh
        geometry={body}
        position={[0, MAC_STUDIO.baseHeight + BODY_LIFT, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial {...ALUMINUM} />
      </mesh>
      <mesh geometry={lid} position={[0, TOP_Y + 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial {...LID} />
      </mesh>
      {/* Turned so it reads from the chair, which is where a lid is read from. */}
      <mesh position={[0, TOP_Y + 0.0006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MARK_SIZE, MARK_SIZE]} />
        <meshStandardMaterial map={mark} transparent depthWrite={false} {...MARK} />
      </mesh>
      <mesh position={[0, MAC_STUDIO.baseHeight / 2, 0]}>
        <boxGeometry
          args={[
            MAC_STUDIO.width - MAC_STUDIO.baseInset * 2,
            MAC_STUDIO.baseHeight,
            MAC_STUDIO.depth - MAC_STUDIO.baseInset * 2,
          ]}
        />
        <meshStandardMaterial {...BASE} />
      </mesh>
      {FRONT_PORTS.map((port) => (
        <mesh key={port.key} position={[port.x, PORT_Y, FRONT_Z + PORT_RELIEF - PORT_DEPTH / 2]}>
          <boxGeometry args={[port.width, port.height, PORT_DEPTH]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}
      <StatusLed
        position={[LED_X, PORT_Y, FRONT_Z + 0.0012]}
        color={worldColors.coolLightCore}
        radius={0.0012}
      />
    </group>
  );
}
