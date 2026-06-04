"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useIsClient } from "@/lib/hooks/use-is-client";

export {
  CareerGraphSvg as CareerGraphFigure,
  CareerGraphAccessibleDescription,
} from "./career-graph-svg";

const CareerGraphCanvas = dynamic(
  () => import("./career-graph-canvas").then((m) => m.CareerGraphCanvas),
  { ssr: false, loading: () => null },
);

export function CareerGraphAtmosphere({
  containerRef: externalRef,
  className,
}: {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}): ReactElement {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef ?? (internalRef as React.RefObject<HTMLElement | null>);

  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();

  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = internalRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin: "200px 0px",
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const shouldMount = isClient && !reducedMotion && inView;
  const [ready, setReady] = useState(false);

  return (
    <div
      ref={internalRef}
      aria-hidden="true"
      data-career-graph-atmosphere=""
      className={[
        "pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out",
        ready ? "opacity-100" : "opacity-0",
        className ?? "",
      ].join(" ")}
    >
      {shouldMount ? (
        <CareerGraphCanvas containerRef={containerRef} onReady={() => setReady(true)} />
      ) : null}
    </div>
  );
}
