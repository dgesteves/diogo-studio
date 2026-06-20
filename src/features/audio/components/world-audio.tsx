"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "@/stores/world-store";
import { useAudio } from "../audio-provider";

export function WorldAudio(): null {
  const { play } = useAudio();
  const pathname = usePathname();
  const hovered = useSyncExternalStore(
    subscribeWorld,
    getWorldSnapshot,
    getWorldServerSnapshot,
  ).hovered;

  const previousHover = useRef(hovered);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (hovered && hovered !== previousHover.current) play("hover");
    previousHover.current = hovered;
  }, [hovered, play]);

  useEffect(() => {
    if (pathname !== previousPath.current) {
      play("whoosh");
      previousPath.current = pathname;
    }
  }, [pathname, play]);

  return null;
}
