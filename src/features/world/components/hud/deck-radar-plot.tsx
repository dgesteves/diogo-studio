"use client";

import { Fragment, type ReactElement } from "react";
import type { RouteKey } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { radarPoints } from "../../utils/radar-layout";

type DeckRadarPlotProps = {
  active: RouteKey;
  hovered: RouteKey | null;
};

export function DeckRadarPlot({ active, hovered }: DeckRadarPlotProps): ReactElement {
  return (
    <span aria-hidden="true" className="relative block size-full overflow-hidden rounded-md">
      <span className="deck-radar-grid absolute inset-0 opacity-60" />
      <span className="deck-radar-sweep absolute inset-0 motion-reduce:hidden" />
      {radarPoints.map((point) => {
        const isActive = point.slug === active;
        const isHovered = point.slug === hovered;
        return (
          <Fragment key={point.slug}>
            {isActive && (
              <span
                className="deck-radar-ping absolute size-1.5 rounded-full motion-reduce:hidden"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  border: `1px solid ${point.accent}`,
                }}
              />
            )}
            <span
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
                isActive ? "size-1.5" : "size-1",
                !isActive && !isHovered && "opacity-60",
              )}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                backgroundColor: point.accent,
                boxShadow: isActive || isHovered ? `0 0 6px ${point.accent}` : undefined,
              }}
            />
          </Fragment>
        );
      })}
    </span>
  );
}
