"use client";

import { type ReactElement } from "react";
import { Html } from "@react-three/drei";
import { worldColors, useWorldPalette } from "../materials";
import { BACK_WALL_Z } from "../room";
import { siteConfig } from "@/content/profile";

export function WorldNeon(): ReactElement {
  const palette = useWorldPalette();

  return (
    <group>
      <Html position={[0, 2.45, BACK_WALL_Z]} center distanceFactor={8} zIndexRange={[0, 0]}>
        <div
          aria-hidden="true"
          className="pointer-events-none text-center whitespace-nowrap select-none"
        >
          <p
            className="font-mono text-2xl font-semibold tracking-[0.32em]"
            style={{
              color: worldColors.accentBright,
              textShadow: "0 0 10px rgba(34,211,238,0.9), 0 0 26px rgba(34,211,238,0.5)",
            }}
          >
            {siteConfig.name.toUpperCase()}
          </p>
          <p
            className="mt-2 font-mono text-[9px] tracking-[0.4em]"
            style={{ color: worldColors.accentSoft, textShadow: "0 0 8px rgba(125,211,252,0.7)" }}
          >
            STAFF · PRINCIPAL · FOUNDING ENGINEER
          </p>
        </div>
      </Html>

      <pointLight
        position={[0, 2.4, BACK_WALL_Z + 0.6]}
        color={worldColors.accent}
        intensity={1.2 * palette.neonIntensity}
        distance={5}
        decay={2}
      />

      <mesh position={[-2.27, 1.7, 2.6]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[3.2, 0.012, 0.012]} />
        <meshBasicMaterial color={worldColors.accentSoft} toneMapped={false} />
      </mesh>
    </group>
  );
}
