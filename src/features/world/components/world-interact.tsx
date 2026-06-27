"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, type Camera, type Raycaster } from "three";
import type { RouteKey } from "@/constants/routes";
import { setHoveredStation } from "@/stores/world-store";
import { getHotspotObjects } from "../utils/hotspot-registry";
import type { OrbitInputState } from "../hooks/use-orbit-input";

type WorldInteractProps = {
  input: RefObject<OrbitInputState>;
  onSelect: (slug: RouteKey) => void;
};

function pickHotspot(raycaster: Raycaster, camera: Camera, ndc: Vector2): RouteKey | null {
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects(getHotspotObjects(), false)) {
    const slug = hit.object.userData.hotspotSlug;
    if (typeof slug === "string") return slug as RouteKey;
  }
  return null;
}

export function WorldInteract({ input, onSelect }: WorldInteractProps): null {
  const ndc = useRef(new Vector2());
  const lastX = useRef(-1);
  const lastY = useRef(-1);
  const lastClick = useRef(0);
  const hoveredSlug = useRef<RouteKey | null>(null);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useFrame(({ raycaster, camera, size }) => {
    const i = input.current;

    if (!i.overWorld) {
      if (hoveredSlug.current) {
        setHoveredStation(null);
        hoveredSlug.current = null;
        document.body.style.cursor = "";
      }
    } else if (i.clientX !== lastX.current || i.clientY !== lastY.current) {
      lastX.current = i.clientX;
      lastY.current = i.clientY;
      ndc.current.set(
        ((i.clientX - size.left) / size.width) * 2 - 1,
        -((i.clientY - size.top) / size.height) * 2 + 1,
      );
      const slug = pickHotspot(raycaster, camera, ndc.current);
      if (slug !== hoveredSlug.current) {
        hoveredSlug.current = slug;
        setHoveredStation(slug);
        document.body.style.cursor = slug ? "pointer" : "";
      }
    }

    if (i.clickSeq !== lastClick.current) {
      lastClick.current = i.clickSeq;
      ndc.current.set(
        ((i.clickX - size.left) / size.width) * 2 - 1,
        -((i.clickY - size.top) / size.height) * 2 + 1,
      );
      const slug = pickHotspot(raycaster, camera, ndc.current);
      if (slug) onSelect(slug);
    }
  });

  return null;
}
