import type { Metadata } from "next";
import type { ReactElement } from "react";
import { routes } from "@/constants/routes";
import { OperatingSection, TrustSection } from "@/features/home";
import { DestinationView } from "@/features/world";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected engineering experience across streaming, governance, automotive, and AI-native platforms.",
  alternates: { canonical: routes.work },
};

export default function WorkPage(): ReactElement {
  return (
    <DestinationView slug="work">
      <div className="bg-background relative z-10">
        <OperatingSection />
        <TrustSection />
      </div>
    </DestinationView>
  );
}
