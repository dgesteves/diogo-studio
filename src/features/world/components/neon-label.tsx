"use client";

import { type ReactElement, type Ref } from "react";
import { Html } from "@react-three/drei";

type NeonLabelProps = {
  position: [number, number, number];
  accent: string;
  label: string;
  ref?: Ref<HTMLSpanElement>;
};

export function NeonLabel({ position, accent, label, ref }: NeonLabelProps): ReactElement {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[0, 0]}>
      <span
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none font-mono text-[11px] font-medium tracking-[0.18em] whitespace-nowrap uppercase"
        style={{
          color: accent,
          textShadow: `0 0 10px ${accent}, 0 0 22px ${accent}`,
          opacity: 0,
          willChange: "opacity, transform",
        }}
      >
        {label}
      </span>
    </Html>
  );
}
