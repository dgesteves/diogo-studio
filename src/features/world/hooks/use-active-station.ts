"use client";

import { usePathname } from "next/navigation";
import type { RouteKey } from "@/constants/routes";
import { worldDestinations } from "../content/destinations";

export function useActiveStation(): RouteKey {
  const pathname = usePathname();
  return resolveStation(pathname);
}

export function resolveStation(pathname: string | null): RouteKey {
  if (!pathname || pathname === "/") return "home";
  const match = worldDestinations.find(
    (d) => d.href !== "/" && (pathname === d.href || pathname.startsWith(`${d.href}/`)),
  );
  return match?.slug ?? "home";
}
