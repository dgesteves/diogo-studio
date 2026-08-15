"use client";

import { type ReactElement, useMemo } from "react";
import { Object3D } from "three";
import { worldColors, useWorldPalette, frameMaterial } from "../materials";
import { ROOM } from "../room";

/**
 * Two things that are both "light" and cannot be separated: the rig, which is pure lights
 * swapped by the day/night palette, and the ceiling fixtures, which are meshes that emit and
 * therefore have to agree with it. Change one without the other and the room stops matching
 * its own ceiling.
 */

export function Lighting(): ReactElement {
  const palette = useWorldPalette();

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} />
      <hemisphereLight
        color={palette.hemisphereSky}
        groundColor={palette.hemisphereGround}
        intensity={palette.hemisphereIntensity}
      />
      <directionalLight
        position={[3, 5, 3]}
        intensity={palette.keyLightIntensity}
        color={palette.keyLightColor}
      />
      <pointLight position={[0, 0.6, -1.2]} intensity={0.9} decay={2} color={worldColors.accent} />
      <pointLight
        position={[2.4, 1.6, 0.6]}
        intensity={0.35}
        decay={2}
        color={worldColors.accentSoft}
      />
    </>
  );
}

const PANEL_SPAN = 2;
const HOUSING_HEIGHT = 0.16;
const DIFFUSER_INSET = 0.07;
const TRIM_THICKNESS = 0.014;
const CORE_SPAN = 0.9;

const HOUSING_Y = ROOM.ceilingY - HOUSING_HEIGHT / 2;
const DIFFUSER_Y = ROOM.ceilingY - HOUSING_HEIGHT - 0.004;
const CORE_Y = DIFFUSER_Y - 0.004;
const TRIM_Y = ROOM.ceilingY - HOUSING_HEIGHT;

const LIGHT_Y = ROOM.ceilingY - 0.3;
const LIGHT_INTENSITY = 7;
const LIGHT_DISTANCE = 9;
const LIGHT_ANGLE = 0.75;

const FIXTURE_POSITIONS: readonly [number, number][] = [
  [-0.15, 0.3],
  [2.55, 0.3],
];

type Bar = { size: [number, number, number]; position: [number, number, number] };

const HALF = PANEL_SPAN / 2;
const TRIM_BARS: Bar[] = [
  { size: [PANEL_SPAN, TRIM_THICKNESS, TRIM_THICKNESS], position: [0, TRIM_Y, HALF] },
  { size: [PANEL_SPAN, TRIM_THICKNESS, TRIM_THICKNESS], position: [0, TRIM_Y, -HALF] },
  { size: [TRIM_THICKNESS, TRIM_THICKNESS, PANEL_SPAN], position: [HALF, TRIM_Y, 0] },
  { size: [TRIM_THICKNESS, TRIM_THICKNESS, PANEL_SPAN], position: [-HALF, TRIM_Y, 0] },
];

const DIFFUSER_SPAN = PANEL_SPAN - DIFFUSER_INSET * 2;

export function CeilingLights(): ReactElement {
  const palette = useWorldPalette();

  return (
    <group>
      {FIXTURE_POSITIONS.map(([x, z]) => (
        <CeilingPanel key={`${x},${z}`} x={x} z={z} intensity={palette.ceilingLightIntensity} />
      ))}
    </group>
  );
}

type CeilingPanelProps = { x: number; z: number; intensity: number };

function CeilingPanel({ x, z, intensity }: CeilingPanelProps): ReactElement {
  const target = useMemo(() => new Object3D(), []);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, HOUSING_Y, 0]}>
        <boxGeometry args={[PANEL_SPAN, HOUSING_HEIGHT, PANEL_SPAN]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <mesh position={[0, DIFFUSER_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DIFFUSER_SPAN, DIFFUSER_SPAN]} />
        <meshBasicMaterial color={worldColors.coolLight} toneMapped={false} />
      </mesh>

      <mesh position={[0, CORE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORE_SPAN, CORE_SPAN]} />
        <meshBasicMaterial color={worldColors.coolLightCore} toneMapped={false} />
      </mesh>

      {TRIM_BARS.map((bar) => (
        <mesh key={bar.position.join(",")} position={bar.position}>
          <boxGeometry args={bar.size} />
          <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
        </mesh>
      ))}

      <primitive object={target} />
      <spotLight
        position={[0, LIGHT_Y, 0]}
        target={target}
        color={worldColors.coolLight}
        intensity={LIGHT_INTENSITY * intensity}
        angle={LIGHT_ANGLE}
        penumbra={1}
        distance={LIGHT_DISTANCE}
        decay={2}
      />
    </group>
  );
}
