import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CareerGraphAccessibleDescription,
  CareerGraphAtmosphere,
  CareerGraphFigure,
} from "@/components/career-graph/career-graph";
import { Studio } from "@/components/studio/studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { HeroAskCta } from "@/components/site/hero-ask-cta";
import { operatingCompanies, patterns, siteConfig } from "@/lib/site-config";

/**
 * Home page — Phase 2 introduces the 3D Career Graph as the signature hero
 * surface. The hero is split into two columns on `lg+`: typographic intro on
 * the left, Career Graph on the right. Below `lg`, the graph stacks under
 * the type for breathing room.
 *
 * Server Component — only the `CareerGraph` and `HeroAskCta` are client
 * islands. The SVG inside the graph is server-rendered to drive LCP.
 *
 * Sections:
 * 1. Hero — status + headline + subhead + CTAs + pattern strip + 3D graph.
 * 2. Operating modes — three altitudes within the last 18 months.
 * 3. Trust strip — operating companies, mono small caps.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <OperatingSection />
      <StudioSection />
      <TrustSection />
    </>
  );
}

function StudioSection() {
  return (
    <section role="region" aria-labelledby="studio-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 flex flex-col gap-3">
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            The studio — present tense
          </p>
          <h2
            id="studio-heading"
            className="text-foreground max-w-3xl text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl"
          >
            Three monitors, one focus. Live signals from the rig the work ships from.
          </h2>
        </div>

        <Studio />

        {/* Caption strip — names what each monitor is showing. Mono caps. */}
        <ul className="text-subtle-foreground mt-6 grid grid-cols-1 gap-3 font-mono text-[10px] tracking-wider uppercase sm:grid-cols-3 sm:gap-8">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>LEFT · runtime — code in flight</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>CENTER · ops.live — production telemetry</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>RIGHT · signals — perf, latency, errors</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section
      role="region"
      aria-labelledby="hero-heading"
      // `isolate` creates a stacking context so the absolute atmosphere
      // layer (z-0) sits *behind* the content (z-10) but in front of the
      // page background.
      className="border-border relative isolate overflow-hidden border-b"
      // Generous min-height so the full-bleed atmosphere has real estate
      // to breathe across the viewport — sized so the heatmap + radar +
      // grid floor read as a panoramic field, not a thin strip.
      style={{ minHeight: "min(820px, 92vh)" }}
    >
      {/* Console grid backdrop — sits just above the page background but
          BELOW the atmosphere canvas so the grid remains visible only
          along the edges where the atmosphere's vignette has faded out. */}
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 z-0 opacity-50 dark:opacity-30"
      />

      {/* Full-bleed R3F atmosphere — spans the entire hero section,
          extending well past the centered content column on wide screens
          to deliver the cinematic background the blueprint asked for. */}
      <CareerGraphAtmosphere className="z-0" />

      {/* Long-form description for screen readers — outside the visual
          layout but inside the same section so it groups with the hero. */}
      <CareerGraphAccessibleDescription id="career-graph-description" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <div className="flex max-w-3xl flex-col gap-8">
            <div className="border-border bg-surface/80 text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase backdrop-blur">
              <StatusDot tone="good" />
              <span>Available — Staff+ / Principal / Founding / VP Engineering</span>
            </div>

            <h1
              id="hero-heading"
              className="text-foreground text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1.02] font-medium tracking-tight text-balance"
            >
              Engineering the systems behind ambitious products.
            </h1>

            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed text-balance sm:text-lg">
              {siteConfig.role}. 11+ years shipping AI-native interfaces, design-system
              infrastructure, and streaming-grade platforms at{" "}
              <span className="text-foreground">NBCUniversal</span>,{" "}
              <span className="text-foreground">BMW Group</span>,{" "}
              <span className="text-foreground">Diligent</span>,{" "}
              <span className="text-foreground">eino.ai</span>,{" "}
              <span className="text-foreground">Moment</span>, and{" "}
              <span className="text-foreground">Fueled</span>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" variant="default">
                <Link href="/work">
                  <span>Browse case studies</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <HeroAskCta />
            </div>

            <ul className="flex flex-wrap items-center gap-2 pt-4">
              {patterns.map((pattern) => (
                <li key={pattern}>
                  <Badge tone="outline">{pattern}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <figure
            aria-labelledby="career-graph-caption"
            aria-describedby="career-graph-description"
            className="relative"
          >
            <span id="career-graph-caption" className="sr-only">
              Career graph — engagements connected by pattern themes
            </span>
            {/* SVG figure — bounded in its column with a generous aspect
                ratio. Sits ABOVE the atmosphere thanks to the section's
                z-10 content wrapper. */}
            <div
              className="border-border/40 bg-surface/20 relative rounded-xl border backdrop-blur-[2px]"
              style={{ aspectRatio: "5 / 3" }}
            >
              <CareerGraphFigure
                ariaLabelledBy="career-graph-caption"
                className="absolute inset-0"
              />
            </div>
            <figcaption className="text-subtle-foreground mt-3 flex items-center justify-between font-mono text-[10px] tracking-wider uppercase">
              <span>Career graph · 7 engagements · 5 patterns</span>
              <span aria-hidden="true" className="text-accent">
                ● live
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function OperatingSection() {
  return (
    <section role="region" aria-labelledby="operating-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex flex-col gap-2">
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Operating from three altitudes — within the last 18 months
          </p>
          <h2
            id="operating-heading"
            className="text-foreground max-w-3xl text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl"
          >
            Equally comfortable as a Staff IC inside a large org and as a founding-engineer or VPE
            inside a fast-moving AI startup.
          </h2>
        </div>

        <ol className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
          <OperatingCard
            tag="01 — Staff IC"
            title="Lead, frontend platform"
            org="Fueled · current"
            copy="Architecting AI-augmented web platforms for enterprise clients across media, technology, and digital-transformation programs."
          />
          <OperatingCard
            tag="02 — VP Engineering"
            title="Built the operating model"
            org="Moment · 2025"
            copy="Took an AI-native platform from prototype velocity to production reliability. Hiring bar, leveling, RFCs, observability, on-call."
          />
          <OperatingCard
            tag="03 — Founding-engineer"
            title="Shipped agentic UX in production"
            org="eino.ai · 2023–2025"
            copy="Owned the React + GraphQL foundation for agentic RF planning. Digital-twin maps, agent orchestration, proposal generation."
          />
        </ol>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section role="region" aria-labelledby="trust-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2
          id="trust-heading"
          className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase"
        >
          Selected engagements
        </h2>
        <ul className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {operatingCompanies.map((company, idx) => (
            <li key={company} className="flex items-center gap-6">
              <span className="tabular text-foreground/90">{company}</span>
              {idx < operatingCompanies.length - 1 ? (
                <span aria-hidden="true" className="text-subtle-foreground">
                  ·
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function OperatingCard({
  tag,
  title,
  org,
  copy,
}: {
  tag: string;
  title: string;
  org: string;
  copy: string;
}) {
  return (
    <li className="bg-surface hover:bg-surface-muted flex flex-col gap-3 p-6 transition-colors">
      <span className="text-accent font-mono text-[10px] font-medium tracking-wider uppercase">
        {tag}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-medium tracking-tight">{title}</h3>
        <p className="text-muted-foreground font-mono text-[11px] tracking-wide">{org}</p>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{copy}</p>
    </li>
  );
}
