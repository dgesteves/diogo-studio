"use client";

import { useEffect, useState, type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y, METAL } from "./constants";

export function Headphones(): ReactElement {
  return (
    <group position={[1.12, DESK_TOP_Y, 0.05]}>
      <mesh position={[0, 0.009, 0]}>
        <cylinderGeometry args={[0.088, 0.098, 0.018, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.019, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.0024, 10, 32]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.38, 14]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <torusGeometry args={[0.11, 0.016, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#0c1116" roughness={0.55} metalness={0.45} />
      </mesh>
      <mesh position={[-0.11, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.052, 24]} />
        <meshStandardMaterial color="#0c1116" roughness={0.55} metalness={0.45} />
      </mesh>
      <mesh position={[0.11, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.052, 24]} />
        <meshStandardMaterial color="#0c1116" roughness={0.55} metalness={0.45} />
      </mesh>
      <mesh position={[-0.11, 0.27, 0.028]}>
        <torusGeometry args={[0.042, 0.0032, 10, 28]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.11, 0.27, 0.028]}>
        <torusGeometry args={[0.042, 0.0032, 10, 28]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, 0.28, 0.2]}
        intensity={0.12}
        distance={0.6}
        decay={2}
        color={brandColors.accent}
      />
    </group>
  );
}

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
