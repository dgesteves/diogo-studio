import { Vector3, type BufferGeometry } from "three";

import { buildGeometry, clustered } from "./mouse-geometry";
import { mouseNormal, mousePoint } from "./mouse-shell";

const RIM_SEGMENTS = 96;
const BAND_FADE_CREST = 0.007;
const SEAM_SEGMENTS = 56;
const SEAM_STEP = 0.0015;
const SEAM_TAPER = 0.35;

const UP = new Vector3(0, 1, 0);

export type MouseBand = {
  readonly offset: number;
  readonly bottom: number;
  readonly top: number;
};

export type MouseSeam = {
  readonly axis: "length" | "section";
  readonly fixed: number;
  readonly from: number;
  readonly to: number;
  readonly halfWidth: number;
  readonly lift: number;
};

type OutlinePoint = { readonly at: Vector3; readonly crest: number };

function outlinePoint(t: number, v: number): OutlinePoint {
  return { at: mousePoint(t, v), crest: mousePoint(t, 0.5).y };
}

function baseOutline(): readonly OutlinePoint[] {
  const loop: OutlinePoint[] = [];

  for (let step = 0; step <= RIM_SEGMENTS; step += 1) {
    loop.push(outlinePoint(clustered(step, RIM_SEGMENTS), 0));
  }
  for (let step = RIM_SEGMENTS - 1; step > 0; step -= 1) {
    loop.push(outlinePoint(clustered(step, RIM_SEGMENTS), 1));
  }

  return loop;
}

export function createMouseBandGeometry({ offset, bottom, top }: MouseBand): BufferGeometry {
  const loop = baseOutline();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  loop.forEach(({ at, crest }, index) => {
    const ahead = loop[(index + 1) % loop.length]?.at ?? at;
    const behind = loop[(index + loop.length - 1) % loop.length]?.at ?? at;
    const outward = new Vector3().subVectors(ahead, behind).normalize().cross(UP).negate();
    const fade = Math.min(1, crest / BAND_FADE_CREST);
    const x = at.x + outward.x * offset * fade;
    const z = at.z + outward.z * offset * fade;
    positions.push(x, bottom * fade, z, x, top * fade, z);
    normals.push(outward.x, 0, outward.z, outward.x, 0, outward.z);
    const edge = index * 2;
    const next = ((index + 1) % loop.length) * 2;
    indices.push(edge, next, edge + 1, next, next + 1, edge + 1);
  });

  return buildGeometry(positions, normals, indices);
}

export function createMouseSeamGeometry(seam: MouseSeam): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const isLength = seam.axis === "length";

  for (let step = 0; step <= SEAM_SEGMENTS; step += 1) {
    const progress = step / SEAM_SEGMENTS;
    const moving = seam.from + (seam.to - seam.from) * progress;
    const t = isLength ? moving : seam.fixed;
    const v = isLength ? seam.fixed : moving;
    const normal = mouseNormal(t, v);
    const ahead = isLength ? mousePoint(t + SEAM_STEP, v) : mousePoint(t, v + SEAM_STEP);
    const behind = isLength ? mousePoint(t - SEAM_STEP, v) : mousePoint(t, v - SEAM_STEP);
    const spread = seam.halfWidth * Math.sin(Math.PI * progress) ** SEAM_TAPER;
    const side = ahead.sub(behind).normalize().cross(normal).multiplyScalar(spread);
    const center = mousePoint(t, v).addScaledVector(normal, seam.lift);
    const edges = [center.clone().add(side), center.sub(side)];
    edges.forEach(({ x, y, z }) => {
      positions.push(x, y, z);
      normals.push(normal.x, normal.y, normal.z);
    });
    if (step === 0) continue;
    const edge = (step - 1) * 2;
    indices.push(edge, edge + 1, edge + 2, edge + 1, edge + 3, edge + 2);
  }

  return buildGeometry(positions, normals, indices);
}
