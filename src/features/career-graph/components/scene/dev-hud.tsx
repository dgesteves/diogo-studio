"use client";

import { Stats } from "@react-three/drei";
import type { ReactElement } from "react";

import { env } from "@/env";

const isDev = process.env.NODE_ENV !== "production";

const enabled = isDev && env.NEXT_PUBLIC_PERF_HUD === "1";

export function CareerGraphDevHud(): ReactElement | null {
  if (!enabled) return null;
  return <Stats showPanel={0} />;
}
