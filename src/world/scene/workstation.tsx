"use client";

import { useRef, type ReactElement } from "react";
import { RoundedBox, ContactShadows } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type MeshBasicMaterial } from "three";
import { anodizedMetalMaterial, worldColors, portMaterial } from "../materials";
import { DESK_TOP_Y } from "../room";

/**
 * The three boxes behind the monitors — server node, Mac Studio, hub — and the blinking LED
 * they share. One file because they share one layout: the cluster is laid out as a row, so
 * moving any of them means recomputing all three, and `StatusLed` is used by all three fronts.
 *
 * Each box namespaces its own dimensions (`HUB_`, `MAC_`, `SERVER_`). They described the same
 * measurements under the same names in three files before this merge, which is exactly the
 * kind of collision that made them look separable when they never were.
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
const MAC_STUDIO_WIDTH = 0.27;
const MAC_STUDIO_HEIGHT = 0.13;
const HUB_WIDTH = 0.13;
const HUB_HEIGHT = 0.034;
const HUB_DEPTH = 0.23;

const CLUSTER_WIDTH = SERVER_WIDTH + MAC_STUDIO_WIDTH + HUB_WIDTH + HARDWARE_GAP * 2;
const CLUSTER_LEFT = -CLUSTER_WIDTH / 2;

const SERVER_X = CLUSTER_LEFT + SERVER_WIDTH / 2;
const MAC_STUDIO_X = CLUSTER_LEFT + SERVER_WIDTH + HARDWARE_GAP + MAC_STUDIO_WIDTH / 2;
const HUB_X = CLUSTER_LEFT + CLUSTER_WIDTH - HUB_WIDTH / 2;

const HALO_SCALE = 3.4;
const HALO_OPACITY = 0.26;
const IDLE_LEVEL = 0.22;

type StatusLedProps = {
  position: [number, number, number];
  color: string;
  radius: number;
  blinkSpeed?: number;
  phase?: number;
};

export function StatusLed({
  position,
  color,
  radius,
  blinkSpeed = 0,
  phase = 0,
}: StatusLedProps): ReactElement {
  const core = useRef<MeshBasicMaterial>(null);
  const halo = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!blinkSpeed || !core.current || !halo.current) return;
    const wave = 0.5 + 0.5 * Math.sin(clock.elapsedTime * blinkSpeed + phase);
    const level = IDLE_LEVEL + (1 - IDLE_LEVEL) * wave * wave;
    core.current.opacity = level;
    halo.current.opacity = HALO_OPACITY * level;
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 12, 10]} />
        <meshBasicMaterial ref={core} color={color} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, radius * 0.2]}>
        <circleGeometry args={[radius * HALO_SCALE, 20]} />
        <meshBasicMaterial
          ref={halo}
          color={color}
          transparent
          opacity={HALO_OPACITY}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

const HUB_FOOT_HEIGHT = 0.005;
const HUB_BODY_HEIGHT = HUB_HEIGHT - HUB_FOOT_HEIGHT;
const HUB_BODY_CENTER_Y = HUB_FOOT_HEIGHT + HUB_BODY_HEIGHT / 2;
const HUB_FRONT_Z = HUB_DEPTH / 2;
const HUB_PORT_Y = HUB_FOOT_HEIGHT + HUB_BODY_HEIGHT * 0.48;
const HUB_PORT_HEIGHT = 0.0036;
const HUB_FOOT_X = HUB_WIDTH / 2 - 0.016;
const HUB_FOOT_Z = HUB_DEPTH / 2 - 0.022;

const HUB_FRONT_PORTS = [
  { x: -0.03, width: 0.028, height: HUB_PORT_HEIGHT },
  { x: 0.002, width: 0.0165, height: 0.0072 },
  { x: 0.024, width: 0.0114, height: HUB_PORT_HEIGHT },
  { x: 0.043, width: 0.0114, height: HUB_PORT_HEIGHT },
] as const;

const HUB_FEET = [
  [-HUB_FOOT_X, -HUB_FOOT_Z],
  [HUB_FOOT_X, -HUB_FOOT_Z],
  [-HUB_FOOT_X, HUB_FOOT_Z],
  [HUB_FOOT_X, HUB_FOOT_Z],
] as const;

function DeskHub(): ReactElement {
  return (
    <group position={[HUB_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      {HUB_FEET.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, HUB_FOOT_HEIGHT / 2, z]}>
          <cylinderGeometry args={[0.006, 0.0065, HUB_FOOT_HEIGHT, 12]} />
          <meshStandardMaterial color="#05080b" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
      <RoundedBox
        args={[HUB_WIDTH, HUB_BODY_HEIGHT, HUB_DEPTH]}
        radius={0.005}
        smoothness={3}
        position={[0, HUB_BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...anodizedMetalMaterial} />
      </RoundedBox>
      <mesh position={[0, HUB_HEIGHT - 0.0008, 0]}>
        <boxGeometry args={[HUB_WIDTH - 0.018, 0.0018, HUB_DEPTH - 0.03]} />
        <meshStandardMaterial color="#0d1318" roughness={0.72} metalness={0.35} />
      </mesh>
      <mesh position={[0, HUB_HEIGHT + 0.0004, HUB_FRONT_Z - 0.034]}>
        <boxGeometry args={[HUB_WIDTH * 0.42, 0.0008, 0.0022]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <HubFrontPanel />
    </group>
  );
}

function HubFrontPanel(): ReactElement {
  return (
    <group position={[0, 0, HUB_FRONT_Z]}>
      {HUB_FRONT_PORTS.map((port) => (
        <mesh key={port.x} position={[port.x, HUB_PORT_Y, -0.0015]}>
          <boxGeometry args={[port.width, port.height, 0.004]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}
      <StatusLed
        position={[-0.054, HUB_PORT_Y, 0.0012]}
        color={worldColors.accentBright}
        radius={0.0024}
        blinkSpeed={1.6}
      />
    </group>
  );
}

const MAC_PEDESTAL_HEIGHT = 0.019;
const MAC_PEDESTAL_RADIUS = MAC_STUDIO_WIDTH * 0.42;
const MAC_BODY_HEIGHT = MAC_STUDIO_HEIGHT - MAC_PEDESTAL_HEIGHT;
const MAC_BODY_CENTER_Y = MAC_PEDESTAL_HEIGHT + MAC_BODY_HEIGHT / 2;
const MAC_FRONT_Z = HARDWARE_DEPTH / 2;
const MAC_PORT_Y = MAC_PEDESTAL_HEIGHT + MAC_BODY_HEIGHT * 0.34;
const MAC_PORT_HEIGHT = 0.0036;
const MAC_SD_SLOT_WIDTH = 0.032;
const MAC_USB_C_WIDTH = 0.0114;

const MAC_FRONT_PORTS = [
  { x: -0.05, width: MAC_SD_SLOT_WIDTH },
  { x: 0.026, width: MAC_USB_C_WIDTH },
  { x: 0.05, width: MAC_USB_C_WIDTH },
] as const;

function MacStudio(): ReactElement {
  return (
    <group position={[MAC_STUDIO_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      <mesh position={[0, MAC_PEDESTAL_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[MAC_PEDESTAL_RADIUS, MAC_PEDESTAL_RADIUS, MAC_PEDESTAL_HEIGHT, 32]}
        />
        <meshStandardMaterial color="#0a0e12" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh position={[0, MAC_PEDESTAL_HEIGHT * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[MAC_PEDESTAL_RADIUS - 0.006, 0.0022, 8, 40]} />
        <meshStandardMaterial color="#161c22" roughness={0.6} metalness={0.5} />
      </mesh>
      <RoundedBox
        args={[MAC_STUDIO_WIDTH, MAC_BODY_HEIGHT, HARDWARE_DEPTH]}
        radius={0.017}
        smoothness={4}
        position={[0, MAC_BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...anodizedMetalMaterial} />
      </RoundedBox>
      <mesh position={[0, MAC_PEDESTAL_HEIGHT + 0.0015, 0]}>
        <boxGeometry args={[MAC_STUDIO_WIDTH - 0.014, 0.003, HARDWARE_DEPTH - 0.014]} />
        <meshStandardMaterial color="#0a0f14" roughness={0.5} metalness={0.55} />
      </mesh>
      <MacFrontPanel />
      <mesh position={[0, MAC_BODY_CENTER_Y, -MAC_FRONT_Z - 0.0005]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[MAC_STUDIO_WIDTH - 0.03, MAC_BODY_HEIGHT - 0.026]} />
        <meshStandardMaterial color="#0b1015" roughness={0.85} metalness={0.35} />
      </mesh>
    </group>
  );
}

function MacFrontPanel(): ReactElement {
  return (
    <group position={[0, 0, MAC_FRONT_Z]}>
      {MAC_FRONT_PORTS.map((port) => (
        <mesh key={port.x} position={[port.x, MAC_PORT_Y, -0.0015]}>
          <boxGeometry args={[port.width, MAC_PORT_HEIGHT, 0.004]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}
      <mesh position={[0, MAC_PEDESTAL_HEIGHT + 0.0022, -0.001]}>
        <boxGeometry args={[MAC_STUDIO_WIDTH * 0.34, 0.0009, 0.002]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <StatusLed
        position={[-0.104, MAC_PORT_Y, 0.0012]}
        color={worldColors.coolLightCore}
        radius={0.0022}
      />
    </group>
  );
}

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
      <MacStudio />
      <DeskHub />
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
