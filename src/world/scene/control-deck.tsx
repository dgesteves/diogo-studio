"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { ExtrudeGeometry, Shape, type BufferGeometry } from "three";
import { useDisposable } from "../gpu";
import { anodizedMetalMaterial, darkMetalMaterial, portMaterial, worldColors } from "../materials";
import { CONTROL_SCREEN, KEY_LAMPS, KEYS, useControlDeckTexture } from "../screens/control-deck";
import { StatusLed } from "./status-led";

/**
 * The control deck at the right of the hardware row: the studio's own console, and the hub
 * the desk still needs. It replaced a flat anodized slab that carried four port slots and
 * nothing else — a box that size, in a room lit cyan over near-black furniture, read as a
 * shadow beside the Mac Studio rather than as a device.
 *
 * The shape is the fix. A console is a **wedge**, not a slab: a skirt at the front that the
 * ports are set into, a face sloping 28° up toward the chair, and the controls laid along it
 * — four soft keys and a jog dial across the bottom, the display filling everything above
 * them. The slope is the whole point. The room's camera looks down on the desk at about 17°,
 * so a panel lying flat is seen at 73° off its own normal, which is a bright smear; tilting
 * the face brings that to 45° and the screen becomes something a visitor can actually read.
 *
 * It owns this file for the reason `mac-studio.tsx` owns its own: `workstation.tsx` lays out
 * a row and needs one number from each box in it. The face layout, the console profile and
 * the screen the deck carries are not the row's business.
 */

/** In meters, and every one of them measured off the console face rather than the box. */
export const CONTROL_DECK = {
  width: 0.2,
  depth: 0.16,
  /** The front skirt: the low end of the face, and the wall the ports are set into. */
  frontHeight: 0.03,
  /** 28° from the desk — a console rather than a lectern, and still turned toward the chair. */
  slope: (28 * Math.PI) / 180,
  padHeight: 0.004,
  /** The softened edge. It also sets how far the profile has to be drawn small — see below. */
  bevel: 0.0025,
} as const;

const RISE = CONTROL_DECK.depth * Math.tan(CONTROL_DECK.slope);
export const DECK_HEIGHT = CONTROL_DECK.padHeight + CONTROL_DECK.frontHeight + RISE;
/** The face is longer than the box is deep, and everything on it is placed along that run. */
export const FACE_LENGTH = CONTROL_DECK.depth / Math.cos(CONTROL_DECK.slope);

/**
 * The console's side, in (depth, height): the skirt at the front, the back wall, and the face
 * sloping between them. `inset` pulls every edge inward along its own normal, which is not
 * the same as shrinking the coordinates — a sloped edge offset by `inset` moves *down* by
 * `inset / cos(slope)`, and taking the shortcut leaves the face a fraction of a degree off
 * every other measurement here.
 */
export function deckProfile(inset = 0): Shape {
  const { depth, frontHeight, slope } = CONTROL_DECK;
  const front = depth / 2 - inset;
  const back = -depth / 2 + inset;
  const drop = inset / Math.cos(slope);
  const topAt = (z: number): number => frontHeight + (depth / 2 - z) * Math.tan(slope) - drop;

  const shape = new Shape();
  shape.moveTo(back, inset);
  shape.lineTo(front, inset);
  shape.lineTo(front, topAt(front));
  shape.lineTo(back, topAt(back));
  shape.closePath();

  return shape;
}

/**
 * The body, extruded across the desk. `ExtrudeGeometry` grows its section outward by the
 * bevel in all three directions, so the profile is drawn a bevel small and the run is a bevel
 * short — the same trap documented in `mac-studio.tsx`, and the reason the mesh below is
 * offset rather than centered: the extrusion spans `-bevel … width - bevel` in its own frame.
 */
export function createDeckGeometry(): BufferGeometry {
  const { width, bevel } = CONTROL_DECK;

  return new ExtrudeGeometry(deckProfile(bevel), {
    depth: width - bevel * 2,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 1,
  });
}

/** A quarter turn about `y` lays the extrusion across the desk: profile `x` becomes world `z`. */
const BODY_ROTATION: [number, number, number] = [0, -Math.PI / 2, 0];
const BODY_OFFSET_X = CONTROL_DECK.width / 2 - CONTROL_DECK.bevel;

/**
 * A point on the console face, `s` meters up the slope from the front edge, lifted `lift`
 * along the face normal. Everything on the face is placed through this, so the layout below
 * reads as the run of the face rather than as a column of y/z pairs nobody can check.
 */
export function onFace(x: number, s: number, lift = 0): [number, number, number] {
  const { padHeight, frontHeight, depth, slope } = CONTROL_DECK;

  return [
    x,
    padHeight + frontHeight + s * Math.sin(slope) + lift * Math.cos(slope),
    depth / 2 - s * Math.cos(slope) + lift * Math.sin(slope),
  ];
}

/** A plane's normal starts at `+z`, so this is the turn that lays it on the face, image up. */
const FACE_TILT: [number, number, number] = [CONTROL_DECK.slope - Math.PI / 2, 0, 0];
/** A box or a cylinder stands on its own `+y` instead, so it takes the slope itself. */
const FACE_STAND: [number, number, number] = [CONTROL_DECK.slope, 0, 0];

const FACE_MARGIN = 0.011;
const KEY_SIZE = 0.026;
const KEY_GAP = 0.009;
const KEY_HEIGHT = 0.005;
const DIAL_RADIUS = 0.016;
const DIAL_GAP = 0.01;
/** The gap between the control row and the panel, with the accent groove down the middle. */
const KEY_TO_PANEL = 0.012;
const KEY_ROW_S = FACE_MARGIN + KEY_SIZE / 2;
const GROOVE_S = FACE_MARGIN + KEY_SIZE + KEY_TO_PANEL / 2;

const KEY_ROW_SPAN = KEYS.length * KEY_SIZE + (KEYS.length - 1) * KEY_GAP;
const CONTROLS_SPAN = KEY_ROW_SPAN + DIAL_GAP + DIAL_RADIUS * 2;
const CONTROLS_LEFT = -CONTROLS_SPAN / 2;
const DIAL_X = CONTROLS_LEFT + KEY_ROW_SPAN + DIAL_GAP + DIAL_RADIUS;

/** The panel's height follows its width and the texture's shape, so type is never stretched. */
export const SCREEN_WIDTH = 0.176;
export const SCREEN_HEIGHT = (SCREEN_WIDTH * CONTROL_SCREEN.height) / CONTROL_SCREEN.width;
const BEZEL_PAD = 0.0045;
const BEZEL_THICKNESS = 0.004;
export const SCREEN_S = FACE_MARGIN + KEY_SIZE + KEY_TO_PANEL + BEZEL_PAD + SCREEN_HEIGHT / 2;

/** The pads the console stands on. */
const PAD = { color: "#05080b", roughness: 0.95, metalness: 0.05 } as const;
const BEZEL = { color: "#080d12", roughness: 0.45, metalness: 0.5 } as const;
const KEY_CAP = { color: "#0e141a", roughness: 0.7, metalness: 0.25 } as const;
const KNURL = { color: "#080d12", roughness: 0.8, metalness: 0.35 } as const;

const PAD_X = CONTROL_DECK.width / 2 - 0.018;
const PAD_Z = CONTROL_DECK.depth / 2 - 0.02;
const PADS = [
  [-PAD_X, -PAD_Z],
  [PAD_X, -PAD_Z],
  [-PAD_X, PAD_Z],
  [PAD_X, PAD_Z],
] as const;

/**
 * The port bank, in the skirt: the hub the deck replaced kept the desk's peripherals plugged
 * in and this one still has to. One row, weighted left, with the link LED alone at the right
 * end — the arrangement every other box on this desk wears.
 */
const SKIRT_Z = CONTROL_DECK.depth / 2;
export const SKIRT_PORT_Y = CONTROL_DECK.padHeight + CONTROL_DECK.frontHeight * 0.5;
const PORT_DEPTH = 0.004;
const PORT_RELIEF = 0.0005;
const LED_X = 0.076;

export const SKIRT_PORTS = [
  { key: "sd-card", x: -0.062, width: 0.026, height: 0.0032 },
  { key: "usb-c-left", x: -0.03, width: 0.0038, height: 0.0118 },
  { key: "usb-c-right", x: -0.016, width: 0.0038, height: 0.0118 },
  { key: "uplink", x: 0.018, width: 0.018, height: 0.0092 },
] as const;

function PortBank(): ReactElement {
  return (
    <group position={[0, 0, SKIRT_Z + PORT_RELIEF - PORT_DEPTH / 2]}>
      {SKIRT_PORTS.map((port) => (
        <mesh key={port.key} position={[port.x, SKIRT_PORT_Y, 0]}>
          <boxGeometry args={[port.width, port.height, PORT_DEPTH]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}
      <StatusLed
        position={[LED_X, SKIRT_PORT_Y, PORT_DEPTH / 2 + 0.0012]}
        color={worldColors.statusOk}
        radius={0.0024}
        blinkSpeed={1.6}
      />
    </group>
  );
}

/**
 * The soft keys and the jog dial, in the same count and order as the chips on the screen —
 * and each key's bar in that chip's lamp, so the row is read as four controls rather than as
 * one lit strip broken into four.
 */
function ControlRow(): ReactElement {
  return (
    <group>
      {KEYS.map((key, index) => {
        const x = CONTROLS_LEFT + KEY_SIZE / 2 + index * (KEY_SIZE + KEY_GAP);
        return (
          <group key={key} position={onFace(x, KEY_ROW_S)} rotation={FACE_STAND}>
            <RoundedBox args={[KEY_SIZE, KEY_HEIGHT, KEY_SIZE]} radius={0.0018} smoothness={2}>
              <meshStandardMaterial {...KEY_CAP} />
            </RoundedBox>
            <mesh position={[0, KEY_HEIGHT / 2 + 0.0002, 0.006]}>
              <boxGeometry args={[KEY_SIZE * 0.5, 0.0006, 0.0018]} />
              <meshBasicMaterial color={KEY_LAMPS[key]} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <group position={onFace(DIAL_X, KEY_ROW_S)} rotation={FACE_STAND}>
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry args={[DIAL_RADIUS, DIAL_RADIUS * 0.94, 0.012, 28]} />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[DIAL_RADIUS, 0.0016, 8, 28]} />
          <meshStandardMaterial {...KNURL} />
        </mesh>
        <mesh position={[0, 0.0122, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[DIAL_RADIUS * 0.62, 0.0011, 8, 24]} />
          <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function ControlDeck(): ReactElement {
  const body = useDisposable(() => createDeckGeometry());
  const screen = useControlDeckTexture();

  return (
    <group>
      {PADS.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, CONTROL_DECK.padHeight / 2, z]}>
          <cylinderGeometry args={[0.006, 0.0065, CONTROL_DECK.padHeight, 12]} />
          <meshStandardMaterial {...PAD} />
        </mesh>
      ))}
      <mesh
        geometry={body}
        position={[BODY_OFFSET_X, CONTROL_DECK.padHeight, 0]}
        rotation={BODY_ROTATION}
      >
        <meshStandardMaterial {...anodizedMetalMaterial} />
      </mesh>
      <mesh position={onFace(0, GROOVE_S, 0.0004)} rotation={FACE_STAND}>
        <boxGeometry args={[CONTROL_DECK.width * 0.78, 0.0008, 0.0022]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <ControlRow />
      <RoundedBox
        args={[SCREEN_WIDTH + BEZEL_PAD * 2, SCREEN_HEIGHT + BEZEL_PAD * 2, BEZEL_THICKNESS]}
        radius={0.002}
        smoothness={2}
        position={onFace(0, SCREEN_S, BEZEL_THICKNESS / 2)}
        rotation={FACE_TILT}
      >
        <meshStandardMaterial {...BEZEL} />
      </RoundedBox>
      <mesh position={onFace(0, SCREEN_S, BEZEL_THICKNESS + 0.0004)} rotation={FACE_TILT}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
        <meshStandardMaterial
          map={screen}
          emissive="#ffffff"
          emissiveMap={screen}
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
      <PortBank />
      {/*
        The console throws no lamp of its own. A point light off the face lit a 36 cm disc of
        desk in front of the deck, and a disc on a flat top reads as a circle painted on it —
        the emissive screen above is what a visitor reads the console's light from, and Bloom
        already spreads it.
      */}
    </group>
  );
}
