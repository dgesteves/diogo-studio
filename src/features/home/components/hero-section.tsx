import type { ReactElement } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  CareerGraphAccessibleDescription,
  CareerGraphAtmosphere,
  CareerGraphFigure,
} from "@/features/career-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { siteConfig } from "@/config/site";
import { patternList } from "@/content/data/career-graph";
import { HeroAskCta } from "./hero-ask-cta";

export function HeroSection(): ReactElement {
  return (
    <section
      role="region"
      aria-labelledby="hero-heading"
      className="border-border relative isolate overflow-hidden border-b"
      style={{ minHeight: "min(820px, 92vh)" }}
    >
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 z-0 opacity-50 dark:opacity-30"
      />

      <CareerGraphAtmosphere className="z-0" />

      <CareerGraphAccessibleDescription id="career-graph-description" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10">
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
              {patternList.map((pattern) => (
                <li key={pattern.id}>
                  <Badge tone="outline">{pattern.label}</Badge>
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
