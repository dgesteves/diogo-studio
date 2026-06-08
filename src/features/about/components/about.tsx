import type { ReactElement } from "react";
import { StatusDot } from "@/components/ui/status-dot";
import { aboutFacts } from "@/content/data/about";
import { siteConfig } from "@/config/site";

import { Prose } from "./about-section";
import { AboutExperience } from "./about-experience";
import { CommunitySection, EducationSection, PrinciplesSection } from "./about-card-grids";
import { AboutCta } from "./about-cta";
import { PixelatedPortrait } from "./pixelated-portrait";

const PORTRAIT = {
  src: "/images/diogo-esteves.png",
  alt: `Pixelated portrait of ${siteConfig.name}`,
} as const;

export function About(): ReactElement {
  return (
    <section role="region" aria-labelledby="about-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14">
            <div className="flex flex-col gap-6">
              <div className="text-muted-foreground border-border bg-surface inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
                <StatusDot tone="good" />
                <span>About · {siteConfig.name}</span>
              </div>

              <h1
                id="about-heading"
                className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-balance"
              >
                I build the engineering systems behind ambitious products.
              </h1>

              <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
                {siteConfig.role}. Over 11+ years I&rsquo;ve owned the surfaces users touch and the
                platform infrastructure underneath them — at NBCUniversal&rsquo;s Peacock, BMW
                Group, Diligent, eino.ai, Moment, Deloitte, and Fueled.
              </p>
            </div>

            <PixelatedPortrait
              src={PORTRAIT.src}
              alt={PORTRAIT.alt}
              bleed
              className="w-64 justify-self-start sm:w-72 lg:w-96 lg:justify-self-end"
            />
          </div>

          <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            {aboutFacts.map((fact) => (
              <div key={fact.label} className="bg-surface flex flex-col gap-1.5 p-4">
                <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {fact.label}
                </dt>
                <dd className="text-foreground text-sm leading-relaxed">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Prose title="The pattern">
          <p>
            The throughline across every role: I&rsquo;m the senior engineering voice on the
            surfaces users actually touch, plus the infrastructure beneath them. Design systems that
            survive multiple product lines. Monorepos that keep ten teams unblocked. AI workflows
            that hold up in production rather than impressing only in demos.
          </p>
          <p>
            I&rsquo;m equally comfortable as a Staff IC inside a large engineering org and as a
            founding engineer or VP of Engineering inside a fast-moving AI startup — I&rsquo;ve done
            both inside the last eighteen months.
          </p>
        </Prose>

        <PrinciplesSection />

        <AboutExperience />

        <CommunitySection />

        <EducationSection />

        <AboutCta />
      </div>
    </section>
  );
}
