import { type ReactElement, type ReactNode } from "react";
import type { RouteKey } from "@/content/pages";
import { getDestination } from "@/content/prose";
import { ContentBlocks } from "./blocks";

type PageViewProps = {
  slug: RouteKey;
  /** Rendered after the panel, outside it — a station's own extra surface. */
  children?: ReactNode;
  /** Rendered above the eyebrow: the about page's portrait. */
  media?: ReactNode;
  /** Rendered below the blocks: interaction the authored record cannot express. */
  actions?: ReactNode;
};

/**
 * Every page of the site, rendered to the DOM from the authored record alone. It knows
 * nothing about the 3D room — that is what makes the room an enhancement rather than the
 * only path to the content (`docs/architecture.md` §3).
 */
export function PageView({ slug, children, media, actions }: PageViewProps): ReactElement {
  const page = getDestination(slug);

  return (
    <>
      <section className="pointer-events-none relative z-10 flex min-h-[calc(100dvh-3.5rem)] w-full flex-col justify-end px-4 pt-24 pb-28 sm:px-6 md:justify-center md:py-24 lg:px-12">
        <article className="border-border/70 bg-background/80 supports-backdrop-filter:bg-background/60 pointer-events-auto w-full max-w-xl rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:max-w-md">
          {media ? <div className="mb-6">{media}</div> : null}
          <p className="text-accent font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
            {page.eyebrow}
          </p>
          <h1 className="text-foreground mt-3 text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl">
            {page.title}
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">{page.summary}</p>
          <div className="mt-8">
            <ContentBlocks blocks={page.blocks} />
          </div>
          {actions ? <div className="border-border/60 mt-8 border-t pt-6">{actions}</div> : null}
        </article>
      </section>
      {children}
    </>
  );
}
