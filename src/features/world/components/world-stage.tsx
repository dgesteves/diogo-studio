"use client";

import dynamic from "next/dynamic";
import { useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/utils/cn";
import { useActiveStation } from "../hooks/use-active-station";
import { WorldFallback } from "./world-fallback";
import { WorldThemeBridge } from "./world-theme-bridge";

const WorldCanvas = dynamic(() => import("./world-canvas").then((m) => m.WorldCanvas), {
  ssr: false,
  loading: () => null,
});

export function WorldStage(): ReactElement {
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();
  const active = useActiveStation();
  const [ready, setReady] = useState(false);

  const shouldMount = isClient && !reducedMotion;

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10" data-world-root="">
      <WorldFallback className="absolute inset-0" />

      {shouldMount ? (
        <>
          <WorldThemeBridge />
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <WorldCanvas active={active} onReady={() => setReady(true)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
