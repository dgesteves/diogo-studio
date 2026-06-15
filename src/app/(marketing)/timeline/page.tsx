import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { CareerGraphShowcase } from "@/features/career-graph";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Timeline",
  description: "The chronological career and education timeline of Diogo Esteves.",
  alternates: { canonical: routes.timeline },
};

export default function TimelinePage(): ReactElement {
  return (
    <DestinationView slug="timeline">
      <div className="bg-background relative z-10 px-4 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto w-full max-w-3xl">
          <CareerGraphShowcase />
        </div>
      </div>
    </DestinationView>
  );
}
