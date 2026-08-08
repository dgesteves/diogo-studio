import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Stack",
  description: "Languages, frameworks, and platforms Diogo Esteves builds with.",
  alternates: { canonical: routes.stack },
};

export default function StackPage(): ReactElement {
  return <DestinationView slug="stack" />;
}
