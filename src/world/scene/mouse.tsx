"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Vector3 } from "three";
import { useDisposable } from "@/hooks/use-disposable";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";

/**
 * A mouse whose shell is a surface of revolution built point by point rather than a primitive:
 * a rounded box does not read as a mouse at this scale, and a loaded model is a fetch this
 * scene refuses to pay for. Everything above `Mouse` is that construction — the profile
 * functions, the geometry builders and the trim that follows the same surface.
 *
 * Deliberately not merged with `keyboard.tsx`: two objects, two geometries, two lifecycles.
 */

const MOUSE_LENGTH = 0.112;
const MOUSE_WIDTH = 0.0635;
const MOUSE_HEIGHT = 0.024;

const PLAN_FLATNESS = 4.2;
const NOSE_NARROWING = 0.12;
const CREST_ROUNDING = 8;
const CREST_FALLOFF = 3;
const NOSE_HEIGHT = 0.11;
const CREST_START = 0.06;
const CREST_END = 0.74;
const NOSE_LIFT = 0.3;
const NOSE_LIFT_START = 0.18;
const NOSE_LIFT_END = 0.6;
const SECTION_NOSE = 2.4;
const SECTION_TAIL = 3.2;
const DERIVATIVE_STEP = 0.0015;

function smoothStep(from: number, to: number, value: number): number {
  const blend = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return blend * blend * (3 - 2 * blend);
}

function smootherStep(from: number, to: number, value: number): number {
  const blend = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return blend * blend * blend * (blend * (blend * 6 - 15) + 10);
}

function halfWidthAt(t: number): number {
  const along = Math.abs(2 * t - 1);
  const outline = Math.max(0, 1 - along ** PLAN_FLATNESS) ** (1 / PLAN_FLATNESS);
  return (MOUSE_WIDTH / 2) * outline * (1 - NOSE_NARROWING * (1 - t));
}

function heightAt(t: number): number {
  const along = Math.abs(2 * t - 1);
  const crest = Math.max(0, 1 - along ** CREST_ROUNDING) ** (1 / CREST_FALLOFF);
  const rise = NOSE_HEIGHT + (1 - NOSE_HEIGHT) * smoothStep(CREST_START, CREST_END, t);
  const bulge = NOSE_LIFT * (1 - smootherStep(NOSE_LIFT_START, NOSE_LIFT_END, t));
  return MOUSE_HEIGHT * crest * (rise + bulge);
}

function mousePoint(t: number, v: number): Vector3 {
  const angle = v * Math.PI;
  const power = 2 / (SECTION_NOSE + (SECTION_TAIL - SECTION_NOSE) * smoothStep(0, 1, t));
  const cos = Math.cos(angle);

  return new Vector3(
    halfWidthAt(t) * Math.sign(cos) * Math.abs(cos) ** power,
    heightAt(t) * Math.abs(Math.sin(angle)) ** power,
    (t - 0.5) * MOUSE_LENGTH,
  );
}

function mouseNormal(t: number, v: number): Vector3 {
  const safeT = Math.min(Math.max(t, DERIVATIVE_STEP), 1 - DERIVATIVE_STEP);
  const safeV = Math.min(Math.max(v, DERIVATIVE_STEP), 1 - DERIVATIVE_STEP);
  const alongLength = mousePoint(safeT + DERIVATIVE_STEP, safeV).sub(
    mousePoint(safeT - DERIVATIVE_STEP, safeV),
  );
  const alongSection = mousePoint(safeT, safeV + DERIVATIVE_STEP).sub(
    mousePoint(safeT, safeV - DERIVATIVE_STEP),
  );

  return alongSection.cross(alongLength).normalize();
}

const LENGTH_SEGMENTS = 96;
const SECTION_SEGMENTS = 52;

function buildGeometry(
  positions: readonly number[],
  normals: readonly number[],
  indices: readonly number[],
): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex([...indices]);
  return geometry;
}

function clustered(step: number, count: number): number {
  return 0.5 - 0.5 * Math.cos((Math.PI * step) / count);
}

function createMouseShellGeometry(): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const stride = SECTION_SEGMENTS + 1;

  for (let row = 0; row <= LENGTH_SEGMENTS; row += 1) {
    const t = clustered(row, LENGTH_SEGMENTS);
    for (let column = 0; column <= SECTION_SEGMENTS; column += 1) {
      const v = clustered(column, SECTION_SEGMENTS);
      const point = mousePoint(t, v);
      const normal = mouseNormal(t, v);
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  for (let row = 0; row < LENGTH_SEGMENTS; row += 1) {
    for (let column = 0; column < SECTION_SEGMENTS; column += 1) {
      const here = row * stride + column;
      const ahead = here + stride;
      indices.push(here, ahead + 1, ahead, here, here + 1, ahead + 1);
    }
  }

  appendSole(positions, normals, indices);
  return buildGeometry(positions, normals, indices);
}

function appendSole(positions: number[], normals: number[], indices: number[]): void {
  const first = positions.length / 3;

  for (let row = 0; row <= LENGTH_SEGMENTS; row += 1) {
    const right = mousePoint(clustered(row, LENGTH_SEGMENTS), 0);
    const left = mousePoint(clustered(row, LENGTH_SEGMENTS), 1);
    positions.push(right.x, right.y, right.z, left.x, left.y, left.z);
    normals.push(0, -1, 0, 0, -1, 0);
  }

  for (let row = 0; row < LENGTH_SEGMENTS; row += 1) {
    const right = first + row * 2;
    indices.push(right, right + 3, right + 1, right, right + 2, right + 3);
  }
}

const RIM_SEGMENTS = 96;
const BAND_FADE_CREST = 0.007;
const SEAM_SEGMENTS = 56;
const SEAM_STEP = 0.0015;
const SEAM_TAPER = 0.35;

const UP = new Vector3(0, 1, 0);

type MouseBand = {
  readonly offset: number;
  readonly bottom: number;
  readonly top: number;
};

type MouseSeam = {
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

function createMouseBandGeometry({ offset, bottom, top }: MouseBand): BufferGeometry {
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

function createMouseSeamGeometry(seam: MouseSeam): BufferGeometry {
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

const RIDGE_V = 0.5;
const DIVIDE_T = 0.5;
const SEAM_LIFT = 0.0002;
const WHEEL_T = 0.24;
const WHEEL_RADIUS = 0.0055;
const WHEEL_WIDTH = 0.0032;
const WHEEL_SINK = 0.0032;
const WHEEL_SLOT_SPAN = 0.075;

const SEAM_MATERIAL = { color: "#05090d", roughness: 0.9, metalness: 0.1 } as const;

const CHANNEL = {
  axis: "length",
  fixed: RIDGE_V,
  from: 0.02,
  to: DIVIDE_T,
  halfWidth: 0.0019,
  lift: SEAM_LIFT,
} as const satisfies MouseSeam;

const DIVIDE = {
  axis: "section",
  fixed: DIVIDE_T,
  from: 0.1,
  to: 0.9,
  halfWidth: 0.0009,
  lift: SEAM_LIFT,
} as const satisfies MouseSeam;

const WHEEL_SLOT = {
  axis: "length",
  fixed: RIDGE_V,
  from: WHEEL_T - WHEEL_SLOT_SPAN,
  to: WHEEL_T + WHEEL_SLOT_SPAN,
  halfWidth: 0.0027,
  lift: 0.00015,
} as const satisfies MouseSeam;

function MouseControls(): ReactElement {
  // `wheel` is a Vector3 rather than a resource, and is left alone: only the three seam
  // geometries hold anything the GPU has to be told to let go of.
  const parts = useDisposable(() => ({
    channel: createMouseSeamGeometry(CHANNEL),
    divide: createMouseSeamGeometry(DIVIDE),
    slot: createMouseSeamGeometry(WHEEL_SLOT),
    wheel: mousePoint(WHEEL_T, RIDGE_V).addScaledVector(mouseNormal(WHEEL_T, RIDGE_V), -WHEEL_SINK),
  }));

  return (
    <>
      <mesh geometry={parts.slot}>
        <meshStandardMaterial color="#02050a" roughness={0.95} metalness={0.05} side={DoubleSide} />
      </mesh>
      <mesh geometry={parts.channel}>
        <meshStandardMaterial {...SEAM_MATERIAL} side={DoubleSide} />
      </mesh>
      <mesh geometry={parts.divide}>
        <meshStandardMaterial {...SEAM_MATERIAL} side={DoubleSide} />
      </mesh>
      <mesh position={parts.wheel} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 24]} />
        <meshStandardMaterial color="#0b1116" roughness={0.85} metalness={0.15} />
      </mesh>
    </>
  );
}

const SKIRT: MouseBand = { offset: 0.00015, bottom: 0, top: 0.0038 };
const LED: MouseBand = { offset: 0.00055, bottom: 0.0013, top: 0.0027 };
const HALO: MouseBand = { offset: 0.0013, bottom: 0.0005, top: 0.0036 };

function MouseGlow(): ReactElement {
  const bands = useDisposable(() => ({
    skirt: createMouseBandGeometry(SKIRT),
    led: createMouseBandGeometry(LED),
    halo: createMouseBandGeometry(HALO),
  }));

  return (
    <>
      <mesh geometry={bands.skirt}>
        <meshStandardMaterial color="#070c11" roughness={0.72} metalness={0.35} side={DoubleSide} />
      </mesh>
      <mesh geometry={bands.led}>
        <meshBasicMaterial color={worldColors.accentBright} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh geometry={bands.halo}>
        <meshBasicMaterial
          color={worldColors.accent}
          toneMapped={false}
          side={DoubleSide}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        position={[0, 0.006, -0.03]}
        intensity={0.05}
        distance={0.14}
        decay={2}
        color={worldColors.accent}
      />
      <pointLight
        position={[0, 0.006, 0.03]}
        intensity={0.07}
        distance={0.16}
        decay={2}
        color={worldColors.accent}
      />
    </>
  );
}

const MOUSE_SCALE = 1.05;

const SHELL_MATERIAL = { color: "#141a21", roughness: 0.62, metalness: 0.3 } as const;

export function Mouse(): ReactElement {
  const shell = useDisposable(() => createMouseShellGeometry());

  return (
    <group position={[0.45, DESK_TOP_Y, 0.34]} rotation={[0, -0.09, 0]} scale={MOUSE_SCALE}>
      <mesh geometry={shell}>
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      <MouseControls />
      <MouseGlow />
      <ContactShadows
        position={[0, 0.0008, 0]}
        scale={0.26}
        resolution={256}
        blur={1.8}
        far={0.06}
        opacity={0.6}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}
