"use client";

import { useEffect, useState, type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";

export function ServerNode(): ReactElement {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setActive((a) => !a), 720);
    return () => window.clearInterval(id);
  }, []);

  return (
    <group position={[0, DESK_TOP_Y, -0.08]}>
      <RoundedBox args={[0.14, 0.12, 0.2]} radius={0.008} smoothness={2} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#0a0e12" roughness={0.5} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.101]}>
        <planeGeometry args={[0.1, 0.08]} />
        <meshStandardMaterial color="#05080b" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0.05, 0.1, 0.103]}>
        <boxGeometry args={[0.012, 0.012, 0.002]} />
        <meshStandardMaterial
          color="#0a3d2a"
          emissive="#34d399"
          emissiveIntensity={active ? 1.2 : 0.12}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.03, 0.1, 0.103]}>
        <boxGeometry args={[0.012, 0.012, 0.002]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
    </group>
  );
}
