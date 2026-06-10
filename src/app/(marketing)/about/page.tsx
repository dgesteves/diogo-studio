import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { About } from "@/features/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
  alternates: { canonical: routes.about },
};

export default function AboutPage(): ReactElement {
  return <About />;
}
