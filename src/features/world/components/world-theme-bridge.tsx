"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { resolveWorldMode } from "@/config/world-theme";
import { setWorldMode } from "@/stores/world-theme-store";

export function WorldThemeBridge(): null {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setWorldMode(resolveWorldMode(resolvedTheme));
  }, [resolvedTheme]);

  return null;
}
