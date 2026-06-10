import type { ReactElement } from "react";
import { MetricGrid, MetricTile } from "@/components/article/metric-tile";
import { StackList } from "@/components/article/stack-list";

export function Intro(): ReactElement {
  return (
    <>
      <p>
        Diligent ships governance software to Fortune-1000-class boards, executives, and audit
        committees. The product surface is conservative, regulated, and serious — exactly the
        constituency that benefits from a design system, and exactly the constituency that
        punishes a bad one.
      </p>
      <p>
        I led the frontend side of Diligent’s company-wide design system in 2019–2020. The
        interesting parts of this case study are not “we shipped Buttons and Modals.” Every
        enterprise DS does. The interesting parts are how the system survived running on two
        frameworks, and how contribution got federated without losing coherence.
      </p>
      <MetricGrid>
        <MetricTile
          label="Tokens"
          value="Single"
          unit="source"
          tone="accent"
          hint="Colors, type, spacing, motion — declared once, consumed everywhere."
        />
        <MetricTile
          label="Component coverage"
          value="Foundational"
          unit="primitives"
          tone="good"
          hint="Layout, form, feedback, navigation — the spine of every product."
        />
        <MetricTile
          label="Adoption"
          value="Pull"
          unit="model"
          hint="Product teams adopted at their own pace; nothing was forced from the center."
        />
        <MetricTile
          label="A11y"
          value="WCAG AA"
          unit="baseline"
          tone="warn"
          hint="Governance products carry a higher bar; a11y was non-negotiable, not a stretch goal."
        />
      </MetricGrid>
      <StackList
        label="Surface area"
        items={[
          "Design tokens (JSON)",
          "React + TypeScript",
          "Angular + TypeScript",
          "Storybook",
          "Style Dictionary",
          "Versioned packages",
          "RFC + contribution model",
          "WCAG AA tooling",
        ]}
      />
    </>
  );
}
