import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { Contact } from "@/features/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out about Staff+, Principal, Founding Engineer, or VP / Head of Engineering roles.",
  alternates: { canonical: routes.contact },
};

export default function ContactPage(): ReactElement {
  return <Contact />;
}
