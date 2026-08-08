import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Now",
  description: "What Diogo Esteves is building, learning, and optimizing for today.",
  alternates: { canonical: routes.now },
};

export default function NowPage(): ReactElement {
  return <DestinationView slug="now" />;
}
