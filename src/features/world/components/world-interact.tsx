"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, type Camera, type Raycaster } from "three";
import type { RouteKey } from "@/content/pages";
import { setAiCoreHovered, setHoveredStation } from "@/world/store";
import { getHotspotObjects } from "../utils/hotspot-registry";
import type { OrbitInputState } from "../hooks/use-orbit-input";

type WorldInteractProps = {
  input: RefObject<OrbitInputState>;
  onSelect: (slug: RouteKey) => void;
  onAskAi: () => void;
};

type HotspotPick = { kind: "route"; slug: RouteKey } | { kind: "ai-core" };

function pickHotspot(raycaster: Raycaster, camera: Camera, ndc: Vector2): HotspotPick | null {
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects(getHotspotObjects(), false)) {
    if (hit.object.userData.aiCore === true) return { kind: "ai-core" };
    const slug = hit.object.userData.hotspotSlug;
    if (typeof slug === "string") return { kind: "route", slug: slug as RouteKey };
  }
  return null;
}

export function WorldInteract({ input, onSelect, onAskAi }: WorldInteractProps): null {
  const ndc = useRef(new Vector2());
  const lastX = useRef(-1);
  const lastY = useRef(-1);
  const lastClick = useRef(0);
  const hoveredSlug = useRef<RouteKey | null>(null);
  const hoveredAi = useRef(false);

  function applyHover(pick: HotspotPick | null): void {
    const slug = pick?.kind === "route" ? pick.slug : null;
    const overAi = pick?.kind === "ai-core";
    if (slug !== hoveredSlug.current) {
      hoveredSlug.current = slug;
      setHoveredStation(slug);
    }
    if (overAi !== hoveredAi.current) {
      hoveredAi.current = overAi;
      setAiCoreHovered(overAi);
    }
    document.body.style.cursor = slug || overAi ? "pointer" : "";
  }

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  useFrame(({ raycaster, camera, size }) => {
    const i = input.current;

    if (!i.overWorld) {
      if (hoveredSlug.current || hoveredAi.current) applyHover(null);
    } else if (i.clientX !== lastX.current || i.clientY !== lastY.current) {
      lastX.current = i.clientX;
      lastY.current = i.clientY;
      ndc.current.set(
        ((i.clientX - size.left) / size.width) * 2 - 1,
        -((i.clientY - size.top) / size.height) * 2 + 1,
      );
      applyHover(pickHotspot(raycaster, camera, ndc.current));
    }

    if (i.clickSeq !== lastClick.current) {
      lastClick.current = i.clickSeq;
      ndc.current.set(
        ((i.clickX - size.left) / size.width) * 2 - 1,
        -((i.clickY - size.top) / size.height) * 2 + 1,
      );
      const pick = pickHotspot(raycaster, camera, ndc.current);
      if (pick?.kind === "ai-core") onAskAi();
      else if (pick) onSelect(pick.slug);
    }
  });

  return null;
}
