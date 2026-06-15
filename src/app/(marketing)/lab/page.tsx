import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Research and development explorations by Diogo Esteves — AI tooling and interface R&D.",
  alternates: { canonical: routes.lab },
};

export default function LabPage(): ReactElement {
  return <DestinationView slug="lab" />;
}
