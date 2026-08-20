"use client";

import { type ReactElement } from "react";
import { RoundedBox, ContactShadows } from "@react-three/drei";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";
import { CONTROL_DECK, ControlDeck } from "./control-deck";
import { MAC_STUDIO, MacStudio } from "./mac-studio";
import { StatusLed } from "./status-led";

/**
 * The three boxes behind the monitors — server node, Mac Studio, control deck — the row they
 * stand in, and the blinking LED they share. The layout is the reason this is one file: the
 * cluster is a row, so moving any of them means recomputing all three, and `StatusLed` is on
 * all three fronts.
 *
 * Only the server node is *built* here, because it is a plain chassis this studio invented and
 * nothing outside decides what it looks like. The other two are not. The Mac Studio is a real
 * machine whose shape is the thing being reproduced; the control deck is a console with a face
 * layout and a screen of its own. Each owns its file — `scene/mac-studio.tsx` and
 * `scene/control-deck.tsx` — and this row lays out from the one width it takes from each.
 */

const HARDWARE_DEPTH = 0.27;
const HARDWARE_BACK_Z = -0.31;
const HARDWARE_CENTER_Z = HARDWARE_BACK_Z + HARDWARE_DEPTH / 2;
const HARDWARE_GAP = 0.04;

const SERVER_WIDTH = 0.16;
const SERVER_HEIGHT = 0.16;
const SERVER_FOOT_HEIGHT = 0.006;
const SERVER_BODY_HEIGHT = SERVER_HEIGHT - SERVER_FOOT_HEIGHT;
const SERVER_BODY_CENTER_Y = SERVER_FOOT_HEIGHT + SERVER_BODY_HEIGHT / 2;
const CLUSTER_WIDTH = SERVER_WIDTH + MAC_STUDIO.width + CONTROL_DECK.width + HARDWARE_GAP * 2;
const CLUSTER_LEFT = -CLUSTER_WIDTH / 2;

const SERVER_X = CLUSTER_LEFT + SERVER_WIDTH / 2;
const MAC_STUDIO_X = CLUSTER_LEFT + SERVER_WIDTH + HARDWARE_GAP + MAC_STUDIO.width / 2;
const DECK_X = CLUSTER_LEFT + CLUSTER_WIDTH - CONTROL_DECK.width / 2;

const SERVER_FRONT_Z = HARDWARE_DEPTH / 2;
const SERVER_BEZEL_Z = SERVER_FRONT_Z - 0.0025;
const TRAY_WIDTH = 0.058;
const TRAY_HEIGHT = 0.126;
const TRAY_DEPTH = 0.012;
const TRAY_FACE_Z = SERVER_FRONT_Z + 0.002;
const TRAY_Z = TRAY_FACE_Z - TRAY_DEPTH / 2;
const LED_X = SERVER_WIDTH / 2 - 0.018;
const LED_Z = SERVER_FRONT_Z + 0.0006;
const TRAY_MATERIAL = { color: "#151c23", roughness: 0.55, metalness: 0.42 } as const;

const TRAY_X = [-0.045, 0.017] as const;
const TRAY_SLOT_Y = [0.03, 0, -0.03] as const;

const LEDS = [
  { y: 0.13, color: worldColors.accent, blinkSpeed: 0 },
  { y: 0.108, color: worldColors.statusOk, blinkSpeed: 1.1 },
  { y: 0.086, color: worldColors.statusOk, blinkSpeed: 6.2 },
  { y: 0.064, color: worldColors.statusOk, blinkSpeed: 8.7 },
] as const;

function ServerNodeFront(): ReactElement {
  return (
    <>
      <mesh position={[0, SERVER_BODY_CENTER_Y, SERVER_BEZEL_Z]}>
        <boxGeometry args={[SERVER_WIDTH - 0.012, SERVER_BODY_HEIGHT - 0.012, 0.005]} />
        <meshStandardMaterial color="#05080b" roughness={0.85} metalness={0.25} />
      </mesh>
      {TRAY_X.map((x) => (
        <DriveTray key={x} x={x} />
      ))}
      {LEDS.map((led, index) => (
        <StatusLed
          key={led.y}
          position={[LED_X, led.y, LED_Z]}
          color={led.color}
          radius={0.0025}
          blinkSpeed={led.blinkSpeed}
          phase={index * 1.9}
        />
      ))}
      <mesh position={[0, SERVER_FOOT_HEIGHT + 0.004, LED_Z]}>
        <boxGeometry args={[SERVER_WIDTH * 0.5, 0.0009, 0.002]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
    </>
  );
}

function DriveTray({ x }: { x: number }): ReactElement {
  return (
    <group position={[x, SERVER_BODY_CENTER_Y, TRAY_Z]}>
      <RoundedBox args={[TRAY_WIDTH, TRAY_HEIGHT, TRAY_DEPTH]} radius={0.0035} smoothness={2}>
        <meshStandardMaterial {...TRAY_MATERIAL} />
      </RoundedBox>
      <mesh position={[-TRAY_WIDTH / 2 + 0.008, 0, TRAY_DEPTH / 2 - 0.0005]}>
        <boxGeometry args={[0.0045, TRAY_HEIGHT - 0.02, 0.0035]} />
        <meshStandardMaterial color="#04070a" roughness={0.9} metalness={0.15} />
      </mesh>
      {TRAY_SLOT_Y.map((y) => (
        <mesh key={y} position={[0.008, y, TRAY_DEPTH / 2 - 0.0004]}>
          <boxGeometry args={[TRAY_WIDTH * 0.52, 0.0022, 0.0025]} />
          <meshStandardMaterial color="#080d12" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

const CHASSIS_MATERIAL = { color: "#0d1318", roughness: 0.58, metalness: 0.48 } as const;
const VENT_MATERIAL = { color: "#04070a", roughness: 0.95, metalness: 0.1 } as const;
const SERVER_FOOT_X = SERVER_WIDTH / 2 - 0.018;
const SERVER_FOOT_Z = HARDWARE_DEPTH / 2 - 0.024;
const SERVER_SIDE_X = SERVER_WIDTH / 2 - 0.0006;
const TOP_VENT_X = [-0.048, -0.032, -0.016, 0, 0.016, 0.032, 0.048] as const;
const SIDE_VENT_Z = [-0.088, -0.07, -0.052, -0.034, -0.016] as const;

const SERVER_FEET = [
  [-SERVER_FOOT_X, -SERVER_FOOT_Z],
  [SERVER_FOOT_X, -SERVER_FOOT_Z],
  [-SERVER_FOOT_X, SERVER_FOOT_Z],
  [SERVER_FOOT_X, SERVER_FOOT_Z],
] as const;

function ServerNode(): ReactElement {
  return (
    <group position={[SERVER_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      {SERVER_FEET.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, SERVER_FOOT_HEIGHT / 2, z]}>
          <cylinderGeometry args={[0.007, 0.0075, SERVER_FOOT_HEIGHT, 12]} />
          <meshStandardMaterial color="#05080b" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
      <RoundedBox
        args={[SERVER_WIDTH, SERVER_BODY_HEIGHT, HARDWARE_DEPTH]}
        radius={0.008}
        smoothness={3}
        position={[0, SERVER_BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...CHASSIS_MATERIAL} />
      </RoundedBox>
      <ChassisVents />
      <ServerNodeFront />
      <pointLight
        position={[0.04, SERVER_HEIGHT * 0.6, HARDWARE_DEPTH / 2 + 0.05]}
        intensity={0.07}
        distance={0.34}
        decay={2}
        color={worldColors.statusOk}
      />
    </group>
  );
}

function ChassisVents(): ReactElement {
  return (
    <>
      {TOP_VENT_X.map((x) => (
        <mesh key={`top-${x}`} position={[x, SERVER_HEIGHT - 0.0008, -0.055]}>
          <boxGeometry args={[0.004, 0.0022, HARDWARE_DEPTH * 0.44]} />
          <meshStandardMaterial {...VENT_MATERIAL} />
        </mesh>
      ))}
      {SIDE_VENT_Z.flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh
            key={`side-${side}-${z}`}
            position={[side * SERVER_SIDE_X, SERVER_BODY_CENTER_Y, z]}
          >
            <boxGeometry args={[0.0025, SERVER_BODY_HEIGHT * 0.62, 0.005]} />
            <meshStandardMaterial {...VENT_MATERIAL} />
          </mesh>
        )),
      )}
    </>
  );
}

export function DeskHardware(): ReactElement {
  return (
    <group>
      <ServerNode />
      <group position={[MAC_STUDIO_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
        <MacStudio />
      </group>
      <group position={[DECK_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
        <ControlDeck />
      </group>
      <ContactShadows
        position={[0, DESK_TOP_Y + 0.0009, HARDWARE_CENTER_Z]}
        scale={0.95}
        resolution={512}
        blur={2}
        far={0.12}
        opacity={0.62}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}
