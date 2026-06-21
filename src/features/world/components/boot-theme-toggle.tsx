"use client";

import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactElement } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { BootSegmented } from "./boot-segmented";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: MoonStar },
];

export function BootThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <BootSegmented
      label="Theme preference"
      options={OPTIONS}
      value={isClient ? resolvedTheme : undefined}
      onChange={setTheme}
    />
  );
}
