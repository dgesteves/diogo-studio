"use client";

import { useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { setBootProgress } from "@/world/boot";

export function BootProgressReporter(): null {
  const { progress } = useProgress();

  useEffect(() => {
    setBootProgress(progress);
  }, [progress]);

  return null;
}
