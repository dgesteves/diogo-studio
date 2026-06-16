"use client";

import { type ReactElement } from "react";
import { Html } from "@react-three/drei";

type NeonLabelProps = {
  position: [number, number, number];
  accent: string;
  label: string;
};

export function NeonLabel({ position, accent, label }: NeonLabelProps): ReactElement {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[0, 0]}>
      <span
        aria-hidden="true"
        className="pointer-events-none font-mono text-[11px] font-medium tracking-[0.18em] whitespace-nowrap uppercase"
        style={{
          color: accent,
          textShadow: `0 0 10px ${accent}, 0 0 22px ${accent}`,
        }}
      >
        {label}
      </span>
    </Html>
  );
}
