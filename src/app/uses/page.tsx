import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = {
  title: "Uses",
  description: "Tools, hardware, editor, and dotfiles.",
};

export default function UsesPage() {
  return (
    <ComingSoon
      eyebrow="Phase 5 — uses"
      title="Tools, hardware, editor, dotfiles."
      description="The small but real signal of taste: every tool I actually use day-to-day and why. Curated, not exhaustive."
      shipPhase="Phase 5"
      shipScope="Single MDX page grouped by category (hardware, editor + extensions, terminal, design, ops)."
    />
  );
}
