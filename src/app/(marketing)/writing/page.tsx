import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays and field notes on frontend platforms, AI-native UX, and engineering leadership.",
  alternates: { canonical: routes.writing },
};

export default function WritingPage(): ReactElement {
  return <DestinationView slug="writing" />;
}
