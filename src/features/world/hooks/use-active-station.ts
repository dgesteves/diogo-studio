"use client";

import { usePathname } from "next/navigation";
import type { RouteKey } from "@/constants/routes";
import { resolveStation } from "../constants/station-index";

export function useActiveStation(): RouteKey {
  const pathname = usePathname();
  return resolveStation(pathname);
}
