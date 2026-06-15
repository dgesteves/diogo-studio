import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Diogo Esteves — open to Staff+, Principal, Founding Engineer, and VP / Head of Engineering roles.",
  alternates: { canonical: routes.contact },
};

export default function ContactPage(): ReactElement {
  return <DestinationView slug="contact" />;
}
