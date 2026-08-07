"use client";

import { type ReactElement } from "react";

import {
  WALL_SCREEN,
  WALL_SCREEN_Z,
  type WallScreenSlug,
} from "../../constants/wall-screen-layout";
import { drawPlayground } from "./playground-screen-draw";
import { drawPrinciples } from "./principles-screen-draw";
import { drawResume } from "./resume-screen-draw";
import { drawStack } from "./stack-screen-draw";
import { drawTimeline } from "./timeline-screen-draw";
import { WallScreen, type ScreenDraw } from "./wall-screen";

const SCREEN_DRAWS: Record<WallScreenSlug, ScreenDraw> = {
  resume: drawResume,
  timeline: drawTimeline,
  principles: drawPrinciples,
  stack: drawStack,
  playground: drawPlayground,
};

const SLUGS = Object.keys(SCREEN_DRAWS) as WallScreenSlug[];

export function WallScreens(): ReactElement {
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
