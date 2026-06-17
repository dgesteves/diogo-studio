import { type ReactElement, type ReactNode } from "react";
import type { RouteKey } from "@/constants/routes";
import { getDestination } from "../content/destinations";
import { ContentBlocks } from "./content-blocks";
import { DestinationPanel } from "./destination-panel";

type DestinationViewProps = {
  slug: RouteKey;
  children?: ReactNode;
  media?: ReactNode;
};

export function DestinationView({ slug, children, media }: DestinationViewProps): ReactElement {
  const destination = getDestination(slug);

  return (
    <>
      <section className="pointer-events-none relative z-10 flex min-h-[calc(100dvh-3.5rem)] w-full flex-col justify-center px-4 py-24 sm:px-6 lg:px-12">
        <DestinationPanel
          eyebrow={destination.eyebrow}
          title={destination.title}
          summary={destination.summary}
          media={media}
        >
          <ContentBlocks blocks={destination.blocks} />
        </DestinationPanel>
      </section>
      {children}
    </>
  );
}
