import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Speaking",
  description: "Talks, mentoring, and community leadership by Diogo Esteves.",
  alternates: { canonical: routes.speaking },
};

export default function SpeakingPage(): ReactElement {
  return <DestinationView slug="speaking" />;
}
