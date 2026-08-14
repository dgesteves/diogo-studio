"use client";

import { usePathname } from "next/navigation";
import type { RouteKey } from "@/content/pages";
import { resolveStation } from "@/content/pages";

export function useActiveStation(): RouteKey {
  const pathname = usePathname();
  return resolveStation(pathname);
}
