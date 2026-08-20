"use client";

import { type ReactElement } from "react";
import { BackSide, LinearMipmapLinearFilter, type CanvasTexture } from "three";
import { useDisposable } from "../gpu";
import { DESK_TOP_Y } from "../room";
import { COASTER, Coaster } from "./coaster";
import { MONO } from "../screens/kit";
import { createCanvasTexture } from "../screens/texture";

/**
 * The mug on the desk, which is the object the `/now` station is framed on — and which, in
 * a room lit cyan over near-black furniture, used to be a dark blue-gray cylinder standing
 * on a dark blue-gray desk. A station's object has to be findable before it can be a
 * station, so this one is glazed bone-white: the lightest surface in the studio, and the
 * only one that reads as a personal object rather than as equipment.
 *
 * The cup is open, with coffee in it: a printed outer wall, an inner wall facing the other
 * way, and the liquid. That glaze is what makes it printable — the side of a mug unrolls to
 * a rectangle 2πr wide by its height, so the print below is painted on a canvas of exactly that ratio
 * and wrapped once around the body — the rules and the trail of footprints run continuously
 * around it, and the quote sits on the third of the circumference that faces the camera.
 *
 * The pigments here are a canvas routine's paint box rather than the room's surface list,
 * which is why they live with the routine that mixes them, as `books.tsx` and `city.tsx` do.
 *
 * The mug does not stand on the desk. It stands on the coaster in `scene/coaster.tsx`, which
 * owns its own face and knows nothing about what is set on it, so the only thing this file
 * takes from there is the height the cup has to clear.
 */

/** In meters. The taper and the handle are the mug's, the y offsets stack from the desk. */
const BODY = {
  topRadius: 0.05,
  bottomRadius: 0.044,
  /** A shade under the width: taller than that and the blank wall above the print reads as a beaker. */
  height: 0.096,
  /** 24 was enough for an untextured cylinder; a printed one kinks its type on the facets. */
  segments: 48,
} as const;

const MUG_POSITION = [0.78, DESK_TOP_Y, 0.06] as const;

/**
 * The mug is open at the top with coffee in it, which costs it two meshes rather than one. A
 * cylinder's caps take their UVs from the middle of the print, so the body is open-ended and
 * the wall you see over the lip is a second cylinder facing inward — without it the room's
 * single-sided materials leave a hole where the far inside should be.
 */
const WALL = 0.0035;
const INTERIOR = {
  topRadius: BODY.topRadius - WALL,
  bottomRadius: BODY.bottomRadius - WALL,
} as const;

/**
 * The coffee, poured near enough to the lip to be seen: the station looks down on the mug at
 * about 17°, so a low fill shows as a dark slot at the back of the opening rather than as a
 * drink. Its radius is the inner wall's *at that height* rather than at either end: the wall
 * tapers, so any other number leaves either a ring of daylight around the liquid or a disc
 * clipping through the ceramic.
 */
const FILL = 0.9;
const COFFEE = {
  y: BODY.height * FILL,
  radius: INTERIOR.bottomRadius + (INTERIOR.topRadius - INTERIOR.bottomRadius) * FILL,
} as const;
/** A rolled lip, sized to close the ring between the two walls and no more. */
const RIM = {
  radius: BODY.topRadius - WALL / 2,
  tube: WALL / 2 + 0.0008,
  y: BODY.height,
} as const;
/**
 * The handle. It sweeps well past a half turn so both ends curve back *into* the tapered wall
 * instead of stopping flat against it, and it is spun by half that extra sweep, which is what
 * keeps the two ends level with each other.
 *
 * Those two are why `x` and `y` are held in meters rather than derived: what they have to
 * satisfy is that both ends land inside a wall whose radius changes with height, so they are
 * read off the geometry rather than computed from it. Pushing the ring further out opens the
 * hole but lifts the ends clear of the wall, and more sweep is what buys them back — the two
 * numbers move together.
 *
 * The ring itself stays essentially round, and that is a decision rather than an omission. The
 * mug is about ninety pixels tall on screen and the canvas renders at half DPR, so what
 * survives is the silhouette and the hole; an ellipse flattened toward the body reads there as
 * a slot, not as a handle. `HANDLE_SCALE` therefore does almost nothing across, a little in
 * height, and its real work front to back, where thinning the strap costs the hole nothing.
 */
const HANDLE_SWEEP = 0.93;
const HANDLE = {
  radius: 0.024,
  tube: 0.005,
  x: 0.054,
  y: BODY.height * 0.528,
  arc: Math.PI + HANDLE_SWEEP,
  segments: [12, 32],
} as const;
/** Rolls the extra sweep evenly onto both ends, so the handle stays level about its waist. */
const HANDLE_SPIN = -HANDLE.arc / 2;
const HANDLE_SCALE: [number, number, number] = [1, 1.08, 0.75];

/**
 * The print, unrolled. Width is the resolution decision — 512 px around a 31 cm circumference
 * is ~1600 px/m, three times what a book spine is painted at, because a mug is small enough
 * that a visitor who wants to read it walks up to it. Height then follows from the geometry
 * rather than being chosen, so the type cannot come out stretched.
 */
export const MUG_PRINT = {
  width: 512,
  height: Math.round((512 * BODY.height) / (2 * Math.PI * BODY.topRadius)),
} as const;

/**
 * Lao Tzu, in the rendering everyone knows, broken into the lines it prints as. A mug shows
 * about a third of its circumference at once, so the break is the design: three short lines
 * fill that third, and one long one would wrap around out of sight.
 */
export const MUG_QUOTE = ["Every journey", "begins with", "a single step"] as const;

const GLAZE = "#e4dccb";
const INK = "#1a2026";
/** The `/now` station's own amber, muted to something a kiln could plausibly have fired. */
const AMBER = "#d98b2b";

/** Everything on the print is placed as a fraction of it, so the layout survives a resize. */
const RULE_TOP = 0.2;
const RULE_BOTTOM = 0.72;
const RULE_WEIGHT = 0.013;
/**
 * The share of the circumference the quote is set across, which is not the share of the mug
 * you can see. A point at angle θ from the front lands at sin θ of the way to the silhouette,
 * so a panel of 0.42 — a third of the circumference, all of it technically facing you — put
 * the first and last letter of every line at 87% of the way to the edge, where the curve eats
 * them. At 0.28 the line ends at ±50°, which is 77% of the apparent width and reads flat.
 */
const QUOTE_PANEL = 0.28;
const LEADING = 1.35;
const PROBE_PX = 100;
const TRAIL_STEPS = 14;
const TRAIL_Y = 0.86;
const TRAIL_HEIGHT = 0.17;
const TAU = Math.PI * 2;

/**
 * One footprint, at the size the trail walks in. Drawn as filled ovals rather than a traced
 * outline: at a third of a centimeter tall, an outline is a smudge — the same reason the
 * publisher's marks on the spines are solid shapes.
 */
function paintFootprint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  side: number,
): void {
  const ball = height * 0.19;
  // Toes turned out, the way a foot leaves a print, mirrored between left and right.
  const lean = side * 0.2;

  ctx.beginPath();
  ctx.ellipse(x, y - height * 0.14, ball, height * 0.3, lean, 0, TAU);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x - side * ball * 0.3, y + height * 0.26, ball * 0.78, height * 0.15, lean, 0, TAU);
  ctx.fill();

  for (const toe of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.arc(
      x + side * ball * 0.3 + toe * ball * 0.62,
      y - height * 0.45 + Math.abs(toe) * height * 0.035,
      ball * 0.3,
      0,
      TAU,
    );
    ctx.fill();
  }
}

/**
 * The largest the quote can be set on this mug. Canvas has no "fit this box", so the lines
 * are measured once at a probe size and scaled to whichever runs out first — the panel that
 * faces the camera, or the band between the two rules.
 */
export function quoteSize(ctx: CanvasRenderingContext2D, lines: readonly string[]): number {
  const across = MUG_PRINT.width * QUOTE_PANEL;
  const down = MUG_PRINT.height * (RULE_BOTTOM - RULE_TOP - RULE_WEIGHT * 2);

  ctx.font = `600 ${PROBE_PX}px ${MONO}`;
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));

  return Math.min((PROBE_PX * across) / widest, down / (lines.length * LEADING));
}

/**
 * The whole print, painted once. Pure in the way every draw routine in the room is: it takes
 * a context, reads nothing else, and returns nothing.
 *
 * Order matters only at the seam, which is the canvas's left and right edges and ends up at
 * the back of the mug: the two rules span the full width so they meet there, and the trail
 * steps in whole strides across it so no footprint is cut in half.
 */
export function paintMugPrint(ctx: CanvasRenderingContext2D): void {
  const { width, height } = MUG_PRINT;
  const weight = Math.max(1, Math.round(height * RULE_WEIGHT));

  ctx.fillStyle = GLAZE;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = AMBER;
  ctx.fillRect(0, Math.round(height * RULE_TOP), width, weight);
  ctx.fillRect(0, Math.round(height * RULE_BOTTOM), width, weight);

  const stride = width / TRAIL_STEPS;
  for (let step = 0; step < TRAIL_STEPS; step += 1) {
    // Left foot, right foot: the side sets which way the print leans and stepping the pair
    // along one line is what reads as walking rather than as a row of stamps.
    const side = step % 2 === 0 ? -1 : 1;
    paintFootprint(
      ctx,
      (step + 0.5) * stride,
      height * TRAIL_Y + side * height * 0.02,
      height * TRAIL_HEIGHT,
      side,
    );
  }

  // Set in the room's monospace and in capitals: the type is a centimeter tall on a curved
  // surface, where a lowercase serif would be a gray smear and caps still read as words.
  const lines = MUG_QUOTE.map((line) => line.toUpperCase());
  const size = quoteSize(ctx, lines);
  const middle = height * ((RULE_TOP + RULE_BOTTOM) / 2);

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${size.toFixed(2)}px ${MONO}`;

  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * size * LEADING;
    ctx.fillText(line, width / 2, middle + offset);
  });
}

function createMugPrintTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(MUG_PRINT.width, MUG_PRINT.height);

  // Painted once and then read from across the room at a glancing angle, like a book's cloth
  // and unlike a screen — so it gets the mipmap chain `createCanvasTexture` leaves off.
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintMugPrint(ctx);
  texture.needsUpdate = true;
  return texture;
}

/** Glazed ceramic: soft specular, no metal. The body's color comes from the print instead. */
const CERAMIC = { roughness: 0.34, metalness: 0.05 } as const;
/** The inside is unprinted and a shade duller — a glaze pools thinner up a mug's wall. */
const INTERIOR_GLAZE = { color: "#ded7c9", roughness: 0.45, metalness: 0.04 } as const;
/** Black coffee: almost no color left, and glossy enough to catch the lamp. */
const BREW = { color: "#33190a", roughness: 0.12, metalness: 0.08 } as const;

export function CoffeeMug(): ReactElement {
  const print = useDisposable(() => createMugPrintTexture());

  return (
    <group position={MUG_POSITION}>
      <Coaster />
      {/* Every offset in the cup is measured from its own base, so the coaster lifts the
          whole of it rather than being added to each one. */}
      <group position={[0, COASTER.height, 0]}>
        {/* Half a turn: a cylinder's texture seam starts at +z, which is exactly the side the
            `/now` camera looks at, so the quote would be split down the middle without it. */}
        <mesh position={[0, BODY.height / 2, 0]} rotation={[0, Math.PI, 0]}>
          <cylinderGeometry
            args={[BODY.topRadius, BODY.bottomRadius, BODY.height, BODY.segments, 1, true]}
          />
          <meshStandardMaterial map={print} {...CERAMIC} />
        </mesh>
        <mesh position={[0, BODY.height / 2, 0]}>
          <cylinderGeometry
            args={[INTERIOR.topRadius, INTERIOR.bottomRadius, BODY.height, BODY.segments, 1, true]}
          />
          <meshStandardMaterial {...INTERIOR_GLAZE} side={BackSide} />
        </mesh>
        <mesh position={[0, COFFEE.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[COFFEE.radius, BODY.segments]} />
          <meshStandardMaterial {...BREW} />
        </mesh>
        <mesh position={[0, RIM.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RIM.radius, RIM.tube, 10, BODY.segments]} />
          <meshStandardMaterial color={GLAZE} {...CERAMIC} />
        </mesh>
        {/* Scale on the group and rotation on the mesh, in that order: a scale applied under
            the rotation would stretch the ring along the arc instead of standing it up. */}
        <group position={[HANDLE.x, HANDLE.y, 0]} scale={HANDLE_SCALE}>
          <mesh rotation={[0, 0, HANDLE_SPIN]}>
            <torusGeometry args={[HANDLE.radius, HANDLE.tube, ...HANDLE.segments, HANDLE.arc]} />
            <meshStandardMaterial color={GLAZE} {...CERAMIC} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
