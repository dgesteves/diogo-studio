import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "Résumé of Diogo Esteves — AI-native systems, enterprise UI infrastructure, and scalable web architectures.",
  alternates: { canonical: routes.resume },
};

export default function ResumePage(): ReactElement {
  return <DestinationView slug="resume" />;
}
