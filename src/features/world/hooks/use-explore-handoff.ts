"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { routes, type RouteKey } from "@/constants/routes";

export function useExploreHandoff(active: RouteKey, explore: boolean): void {
  const router = useRouter();
  const wasExploring = useRef(false);

  useEffect(() => {
    const was = wasExploring.current;
    wasExploring.current = explore;
    if (!explore && was && active !== "home") {
      router.replace(routes.home, { scroll: false });
    }
  }, [explore, active, router]);
}
