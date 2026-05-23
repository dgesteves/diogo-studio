import type { ComponentProps } from "react";
import { SystemDiagramFallback } from "./system-diagram-fallback";
import { SystemDiagramMount } from "./system-diagram-mount";
import type { SystemDiagramData } from "./system-diagram-types";

/**
 * `<SystemDiagram />` — interactive system architecture diagram.
 *
 * Server-side: renders the deterministic, screen-reader-friendly SVG
 * fallback (`<SystemDiagramFallback />`). This is what LCP sees and
 * what `prefers-reduced-motion: reduce` users keep.
 *
 * Client-side: `<SystemDiagramMount />` (a thin Client Component)
 * lazy-loads the @xyflow/react canvas on top via `dynamic({ ssr: false })`.
 * The fallback stays underneath as a graceful no-JS surface.
 *
 * @xyflow/react ships its own CSS, so the canvas component imports
 * `@xyflow/react/dist/style.css` directly and we override what we need
 * in `mdx.css` to keep the cockpit palette.
 */

export type SystemDiagramProps = {
  title: string;
  description?: string;
  data: SystemDiagramData;
  /** Optional caption rendered under the diagram. */
  caption?: string;
} & Pick<ComponentProps<typeof SystemDiagramFallback>, "height">;

export function SystemDiagram({
  title,
  description,
  data,
  caption,
  height = 360,
}: SystemDiagramProps) {
  return (
    <figure
      className="not-prose border-border bg-surface mdx-system-diagram flex flex-col gap-2 overflow-hidden rounded-lg border"
      aria-label={title}
      data-mdx-block="diagram"
    >
      <header className="border-border bg-surface-muted flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            System diagram
          </p>
          <p className="text-foreground text-sm font-medium tracking-tight">{title}</p>
        </div>
        <span aria-hidden="true" className="text-accent font-mono text-[10px] tracking-wider">
          ● live
        </span>
      </header>
      <div className="relative" style={{ height }}>
        {/* Static SVG fallback — LCP-safe, screen-reader-first, no JS. */}
        <SystemDiagramFallback
          title={title}
          description={description}
          data={data}
          height={height}
        />
        {/* Interactive canvas — hydrates on top once JS arrives. */}
        <div className="absolute inset-0">
          <SystemDiagramMount data={data} title={title} />
        </div>
      </div>
      {caption ? (
        <figcaption className="text-subtle-foreground border-border border-t px-4 py-2 font-mono text-[10px] tracking-wider uppercase">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
