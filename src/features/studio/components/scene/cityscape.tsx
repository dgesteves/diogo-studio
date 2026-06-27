"use client";

import { useMemo, type ReactElement } from "react";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending } from "three";

import { createCityFacadeTexture, createSkyTexture } from "./city-textures";
import { CITY_BUILDINGS, FACADE_VARIANTS } from "./city-layout";
import { Moon } from "./moon";

export function Cityscape(): ReactElement {
  const facades = useMemo(
    () => Array.from({ length: FACADE_VARIANTS }, (_, i) => createCityFacadeTexture(100 + i)),
    [],
  );
  const sky = useMemo(() => createSkyTexture(), []);

  return (
    <group>
      <mesh position={[0, -1, -9]}>
        <planeGeometry args={[46, 14]} />
        <meshBasicMaterial map={sky} toneMapped={false} fog={false} />
      </mesh>

      <mesh position={[0, 0.15, -7.4]}>
        <planeGeometry args={[44, 3.4]} />
        <meshBasicMaterial
          color="#2f86a2"
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      <Moon />

      {facades.map((texture, variant) => {
        const group = CITY_BUILDINGS.filter((building) => building.variant === variant);
        if (!texture || group.length === 0) return null;
        return (
          <Instances key={variant} limit={group.length} range={group.length} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={texture}
              emissive="#ffffff"
              emissiveMap={texture}
              emissiveIntensity={1.3}
              roughness={0.9}
              metalness={0}
              toneMapped={false}
            />
            {group.map((building) => (
              <Instance key={building.seed} position={building.position} scale={building.scale} />
            ))}
          </Instances>
        );
      })}

      <Instances limit={CITY_BUILDINGS.length} range={CITY_BUILDINGS.length} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#080c12" roughness={0.95} metalness={0.1} />
        {CITY_BUILDINGS.map((building) => (
          <Instance key={building.seed} position={building.capPosition} scale={building.capScale} />
        ))}
      </Instances>
    </group>
  );
}
