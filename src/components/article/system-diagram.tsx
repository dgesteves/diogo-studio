import type { ComponentProps, ReactElement } from "react";
import { SystemDiagramFallback } from "./system-diagram-fallback";
import { SystemDiagramMount } from "./system-diagram-mount";
import type { SystemDiagramData } from "@/content/schema/system-diagram";

export type SystemDiagramProps = {
  title: string;
  description?: string;
  data: SystemDiagramData;
  caption?: string;
} & Partial<Pick<ComponentProps<typeof SystemDiagramFallback>, "height">>;

export function SystemDiagram({
  title,
  description,
  data,
  caption,
  height = 360,
}: SystemDiagramProps): ReactElement {
  return (
    <figure
      className="border-border bg-surface flex flex-col gap-2 overflow-hidden rounded-lg border"
      aria-label={title}
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
        <SystemDiagramFallback
          title={title}
          description={description}
          data={data}
          height={height}
        />
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
