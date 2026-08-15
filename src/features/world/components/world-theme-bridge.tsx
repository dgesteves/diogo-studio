"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { resolveWorldMode } from "@/world/materials";
import { setWorldMode } from "@/world/store";

export function WorldThemeBridge(): null {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setWorldMode(resolveWorldMode(resolvedTheme));
  }, [resolvedTheme]);

  return null;
}
