"use client";

import { type ReactElement, useEffect } from "react";
import { RoundedBox } from "@react-three/drei";
import { engagements } from "@/content/career";
import { experiments } from "@/content/playground";
import { practices } from "@/content/principles";
import { stackGroups } from "@/content/stack";
import { darkMetalMaterial, frameMaterial } from "../materials";
import { WALL_SCREEN, WALL_SCREEN_Z, type WallScreenSlug } from "../room";
import { useScreenTexture, type ScreenDraw } from "../screens/texture";
import {
  drawPlayground,
  drawPrinciples,
  drawResume,
  drawStack,
  drawTimeline,
} from "../screens/wall";
import { type Vec3 } from "../stations";
import { Bookshelf } from "./shelving";

/**
 * The set dressing that carries a station: the door to /contact and the five panels on the
 * right wall. Each panel is a canvas screen painted from the authored record — the data is
 * bound here and the drawing happens in `world/screens/wall.ts`, so no fact reaches a draw
 * routine except as an argument.
 */

const LEAF_W = 0.92;
const LEAF_H = 2.08;
const LEAF_T = 0.05;
const REVEAL = 0.07;
const REVEAL_DEPTH = 0.14;
const REVEAL_CENTER_Z = 0.005;

const LEAF = { color: "#17212b", roughness: 0.45, metalness: 0.4 } as const;

const JAMBS: readonly { position: Vec3; args: Vec3 }[] = [
  {
    position: [-(LEAF_W + REVEAL) / 2, LEAF_H / 2, REVEAL_CENTER_Z],
    args: [REVEAL, LEAF_H + REVEAL, REVEAL_DEPTH],
  },
  {
    position: [(LEAF_W + REVEAL) / 2, LEAF_H / 2, REVEAL_CENTER_Z],
    args: [REVEAL, LEAF_H + REVEAL, REVEAL_DEPTH],
  },
  {
    position: [0, LEAF_H + REVEAL / 2, REVEAL_CENTER_Z],
    args: [LEAF_W + REVEAL * 2, REVEAL, REVEAL_DEPTH],
  },
];

const PULL_X = LEAF_W / 2 - 0.08;
const PULL_Y = 1.06;
const PULL_LENGTH = 0.72;
const STANDOFF_YS = [PULL_Y - 0.32, PULL_Y + 0.32] as const;

function ContactDoor(): ReactElement {
  return (
    <group position={[-2.27, 0, 2.28]} rotation={[0, Math.PI / 2, 0]}>
      {JAMBS.map((jamb) => (
        <mesh key={jamb.position.join(",")} position={jamb.position}>
          <boxGeometry args={jamb.args} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      ))}

      <mesh position={[0, LEAF_H / 2 + 0.012, 0]}>
        <boxGeometry args={[LEAF_W, LEAF_H, LEAF_T]} />
        <meshStandardMaterial {...LEAF} />
      </mesh>

      {STANDOFF_YS.map((y) => (
        <mesh key={y} position={[PULL_X, y, 0.048]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.048, 10]} />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
      ))}
      <mesh position={[PULL_X, PULL_Y, 0.072]}>
        <cylinderGeometry args={[0.013, 0.013, PULL_LENGTH, 12]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
    </group>
  );
}

type WallScreenProps = {
  draw: ScreenDraw;
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
};

function WallScreen({
  draw,
  position,
  rotationY = 0,
  width = 0.6,
  height = 0.66,
}: WallScreenProps): ReactElement {
  const { texture, paint } = useScreenTexture(600, 800);

  useEffect(() => {
    paint(draw);
  }, [paint, draw]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[width + 0.06, height + 0.06, 0.05]} radius={0.014} smoothness={3}>
        <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Where the authored record meets the canvas. Bound at module scope so each `draw` keeps
 * a stable identity — `useScreenTexture` has it as an effect dependency, and a new
 * closure per render would repaint and re-upload the texture every time.
 */
const SCREEN_DRAWS: Record<WallScreenSlug, ScreenDraw> = {
  resume: (ctx) => drawResume(ctx, engagements),
  timeline: (ctx) => drawTimeline(ctx, engagements),
  principles: (ctx) => drawPrinciples(ctx, practices),
  stack: (ctx) => drawStack(ctx, stackGroups),
  playground: (ctx) => drawPlayground(ctx, experiments),
};

const SLUGS = Object.keys(SCREEN_DRAWS) as WallScreenSlug[];

function WallScreens(): ReactElement {
  return (
    <group>
      {SLUGS.map((slug) => (
        <WallScreen
          key={slug}
          draw={SCREEN_DRAWS[slug]}
          position={[WALL_SCREEN.x, WALL_SCREEN.y, WALL_SCREEN_Z[slug]]}
          rotationY={WALL_SCREEN.rotationY}
          width={WALL_SCREEN.width}
          height={WALL_SCREEN.height}
        />
      ))}
    </group>
  );
}

export function WorldProps(): ReactElement {
  return (
    <group>
      <Bookshelf />

      <group position={[-1.8, 0, 1.4]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.36, 16]} />
          <meshStandardMaterial color="#11181f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial color="#1f3a2c" roughness={0.9} flatShading />
        </mesh>
      </group>

      <ContactDoor />

      <WallScreens />
    </group>
  );
}
