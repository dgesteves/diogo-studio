"use client";

import { type ReactElement } from "react";

import { drawPlayground } from "./playground-screen-draw";
import { drawPrinciples } from "./principles-screen-draw";
import { drawResume } from "./resume-screen-draw";
import { drawStack } from "./stack-screen-draw";
import { drawTimeline } from "./timeline-screen-draw";
import { WallScreen } from "./wall-screen";

const Y = 1.5;
const Z = -2.27;
const W = 0.5;
const H = 0.66;

export function WallScreens(): ReactElement {
  return (
    <group>
      <WallScreen
        draw={drawResume}
        position={[-1.56, Y, Z]}
        accent="#22d3ee"
        width={W}
        height={H}
      />
      <WallScreen
        draw={drawTimeline}
        position={[-0.78, Y, Z]}
        accent="#a78bfa"
        width={W}
        height={H}
      />
      <WallScreen
        draw={drawPrinciples}
        position={[0, Y, Z]}
        accent="#c084fc"
        width={W}
        height={H}
      />
      <WallScreen draw={drawStack} position={[0.78, Y, Z]} accent="#7dd3fc" width={W} height={H} />
      <WallScreen
        draw={drawPlayground}
        position={[1.56, Y, Z]}
        accent="#facc15"
        width={W}
        height={H}
      />
    </group>
  );
}
