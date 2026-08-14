import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/content/pages";
import { AboutPortrait } from "@/features/about";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
  alternates: { canonical: routes.about },
};

export default function AboutPage(): ReactElement {
  return <DestinationView slug="about" media={<AboutPortrait />} />;
}
