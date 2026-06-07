import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { aboutCommunity, aboutEducation, aboutFacts, aboutPrinciples } from "@/content/data/about";
import { siteConfig } from "@/config/site";

import { Prose, SectionLabel } from "./about-section";
import { AboutExperience } from "./about-experience";
import { PixelatedPortrait } from "./pixelated-portrait";

const PORTRAIT = {
  src: "/static/diogo-esteves.png",
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

        <div className="flex flex-col gap-5">
          <SectionLabel>How I work</SectionLabel>
          <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
            {aboutPrinciples.map((p) => (
              <div key={p.title} className="bg-surface flex flex-col gap-2 p-5">
                <h3 className="text-foreground text-sm font-medium tracking-tight">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <AboutExperience />

        <div className="flex flex-col gap-5">
          <SectionLabel>Beyond the org</SectionLabel>
          <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
            {aboutCommunity.map((c) => (
              <div key={c.title} className="bg-surface flex flex-col gap-2 p-5">
                <h3 className="text-foreground text-sm font-medium tracking-tight">{c.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <SectionLabel>Education</SectionLabel>
          <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
            {aboutEducation.map((e) => (
              <div key={e.school} className="bg-surface flex flex-col gap-1.5 p-5">
                <dt className="text-foreground text-sm leading-snug font-medium">{e.school}</dt>
                <dd className="text-muted-foreground text-sm">
                  {e.credential}
                  <span className="text-subtle-foreground tabular ml-2 font-mono text-xs">
                    {e.years}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-border bg-surface-inset/60 flex flex-col gap-5 rounded-lg border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-base font-medium tracking-tight">
              Optimizing for Staff+, Principal, Founding Engineer, or VP / Head of Engineering.
            </p>
            <p className="text-muted-foreground text-sm">
              Seed to Series B AI-native product companies, frontend platform teams, remote-first
              orgs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="accent" size="md">
              <Link href="/contact">
                Start a conversation
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="GitHub">
              <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                <GithubIcon className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="LinkedIn">
              <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon className="size-4" />
              </a>
            </Button>
          </div>
        </div>

        <Link
          href="/work"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors"
        >
          See the work behind the story
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
