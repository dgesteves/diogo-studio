"use client";

import { useEffect, type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { useScreenTexture, type ScreenDraw } from "@/world/screens/texture";

type WallScreenProps = {
  draw: ScreenDraw;
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
};

export function WallScreen({
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
