import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Contact } from "@/features/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out about Staff+, Principal, Founding Engineer, or VP / Head of Engineering roles.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage(): ReactElement {
  return <Contact />;
}
