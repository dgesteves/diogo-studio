import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
};

export default function AboutPage() {
  return (
    <ComingSoon
      eyebrow="Phase 3 — about"
      title="Background, leadership philosophy, and how I work."
      description="The long-form story behind the work strip on the home page. How I think about hiring bar, RFC culture, AI-native operating models, and shipping into regulated enterprise environments."
      shipPhase="Phase 3"
      shipScope="MDX long-form authored against the same telemetry-dashboard primitives used by case studies."
    />
  );
}
