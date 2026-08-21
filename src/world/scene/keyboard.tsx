"use client";

import { type ReactElement } from "react";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import { type CanvasTexture } from "three";
import { useDisposable } from "../gpu";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";
import { MONO } from "../screens/kit";
import { createCanvasTexture } from "../screens/texture";

/**
 * One keyboard: where the keys are, the canvas texture that prints legends on them, and the
 * meshes. The layout and the legend texture cannot be pulled apart — the texture is drawn by
 * walking the same key array the geometry is instanced from, so a key added to one is a key
 * added to the other by construction.
 */

const ROW_WIDTHS: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

const ROW_LABELS: readonly (readonly string[])[] = [
  ["esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "prt", "del"],
  ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "bsp"],
  ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "enter"],
  ["shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "shift", "^"],
  ["ctrl", "alt", "cmd", "", "cmd", "fn", "<", "v"],
];

const KEY_SHADES = ["#151c22", "#171f26", "#131a20", "#182028"] as const;

const UNIT = 0.0452;
const GAP = 0.0042;
const ROW_PITCH = 0.0318;
const ROW_SPAN_UNITS = 15;
const ROW_COUNT = ROW_WIDTHS.length;
const ROW_TILT = 0.018;

const KEYCAP_HEIGHT = 0.0055;
const KEYCAP_DEPTH = ROW_PITCH - GAP;
export const KEY_FIELD_WIDTH = ROW_SPAN_UNITS * UNIT;
export const KEY_FIELD_DEPTH = (ROW_COUNT - 1) * ROW_PITCH + KEYCAP_DEPTH;

export type Keycap = {
  id: string;
  x: number;
  z: number;
  width: number;
  tilt: number;
  shade: string;
  label: string;
};

function buildKeycaps(): readonly Keycap[] {
  const caps: Keycap[] = [];
  const firstRowZ = -((ROW_COUNT - 1) * ROW_PITCH) / 2;
  const centerRow = (ROW_COUNT - 1) / 2;

  ROW_WIDTHS.forEach((widths, row) => {
    let cursor = -KEY_FIELD_WIDTH / 2;

    widths.forEach((widthUnits, column) => {
      const span = widthUnits * UNIT;
      caps.push({
        id: `${row}:${column}`,
        x: cursor + span / 2,
        z: firstRowZ + row * ROW_PITCH,
        width: span - GAP,
        tilt: (centerRow - row) * ROW_TILT,
        shade: KEY_SHADES[(row * 7 + column * 3) % KEY_SHADES.length] ?? KEY_SHADES[0],
        label: ROW_LABELS[row]?.[column] ?? "",
      });
      cursor += span;
    });
  });

  return caps;
}

export const KEYCAPS = buildKeycaps();

const PIXELS_PER_METER = 1500;
const TEXTURE_WIDTH = Math.round(KEY_FIELD_WIDTH * PIXELS_PER_METER);
const TEXTURE_HEIGHT = Math.round(KEY_FIELD_DEPTH * PIXELS_PER_METER);
const FONT_SIZE = KEYCAP_DEPTH * PIXELS_PER_METER * 0.4;
const SMALL_LABEL_SCALE = 0.68;
const LONG_LABEL_LENGTH = 2;

function drawLegends(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = worldColors.accentSoft;
  ctx.shadowColor = worldColors.accent;
  ctx.shadowBlur = FONT_SIZE * 0.8;

  for (const cap of KEYCAPS) {
    if (!cap.label) continue;
    const isLong = cap.label.length > LONG_LABEL_LENGTH;
    ctx.font = `${isLong ? FONT_SIZE * SMALL_LABEL_SCALE : FONT_SIZE}px ${MONO}`;
    ctx.fillText(
      cap.label,
      (cap.x + KEY_FIELD_WIDTH / 2) * PIXELS_PER_METER,
      (cap.z + KEY_FIELD_DEPTH / 2) * PIXELS_PER_METER,
    );
  }
}

export function useKeyboardLegendTexture(): CanvasTexture {
  return useDisposable(() => {
    const { canvas, texture } = createCanvasTexture(TEXTURE_WIDTH, TEXTURE_HEIGHT);
    const ctx = canvas.getContext("2d");
    if (ctx) drawLegends(ctx);
    return texture;
  });
}

const CASE_BEZEL = 0.026;
const CASE_WIDTH = KEY_FIELD_WIDTH + CASE_BEZEL * 2;
const CASE_DEPTH = KEY_FIELD_DEPTH + CASE_BEZEL * 2;
const CASE_HEIGHT = 0.016;
const DECK_TOP = CASE_HEIGHT / 2;
const CAP_Y = DECK_TOP + KEYCAP_HEIGHT / 2 - 0.0012;
const LEGEND_Y = CAP_Y + KEYCAP_HEIGHT / 2 + 0.0004;

export function Keyboard(): ReactElement {
  const legendTexture = useKeyboardLegendTexture();

  return (
    <group position={[-0.05, DESK_TOP_Y + DECK_TOP, 0.34]}>
      <RoundedBox args={[CASE_WIDTH, CASE_HEIGHT, CASE_DEPTH]} radius={0.005} smoothness={2}>
        <meshStandardMaterial color="#0b1014" roughness={0.62} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, DECK_TOP - 0.0012, 0]}>
        <boxGeometry args={[KEY_FIELD_WIDTH + 0.008, 0.003, KEY_FIELD_DEPTH + 0.008]} />
        <meshStandardMaterial
          color="#04121a"
          emissive={worldColors.accent}
          emissiveIntensity={0.85}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      <KeycapField />
      <mesh position={[0, LEGEND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[KEY_FIELD_WIDTH, KEY_FIELD_DEPTH]} />
        <meshBasicMaterial map={legendTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, DECK_TOP - 0.0016, -CASE_DEPTH / 2 + 0.009]}>
        <boxGeometry args={[KEY_FIELD_WIDTH * 0.5, 0.0008, 0.0022]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, -0.012, 0.02]}
        intensity={0.18}
        distance={0.45}
        decay={2}
        color={worldColors.accent}
      />
    </group>
  );
}

function KeycapField(): ReactElement {
  return (
    /* Never culled, for the reason `scene/macbook.tsx` carries: the bounds are the base cap's
       and are measured before drei places the instances, so whether the board survives a close
       camera comes down to which frame won the race. */
    <Instances
      limit={KEYCAPS.length}
      range={KEYCAPS.length}
      frustumCulled={false}
      position={[0, CAP_Y, 0]}
    >
      <boxGeometry args={[1, KEYCAP_HEIGHT, KEYCAP_DEPTH]} />
      <meshStandardMaterial color="#ffffff" roughness={0.82} metalness={0.12} />
      {KEYCAPS.map((cap) => (
        <Instance
          key={cap.id}
          color={cap.shade}
          position={[cap.x, 0, cap.z]}
          rotation={[cap.tilt, 0, 0]}
          scale={[cap.width, 1, 1]}
        />
      ))}
    </Instances>
  );
}
