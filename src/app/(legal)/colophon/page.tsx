import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Colophon } from "@/features/colophon";

export const metadata: Metadata = {
  title: "Colophon",
  description: "How this site is built — stack, conventions, and the inspector overlay.",
  alternates: { canonical: "/colophon" },
};

export default function ColophonPage(): ReactElement {
  return <Colophon />;
}
