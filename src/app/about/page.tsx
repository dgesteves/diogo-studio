import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { nodeHref, nodes, patterns } from "@/content/data/career-graph";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, leadership philosophy, and how Diogo Esteves works as a Staff/Principal frontend & platform engineer.",
  alternates: { canonical: "/about" },
};

const facts = [
  { label: "Based", value: "Lisbon · Remote (US hours)" },
  { label: "Experience", value: "11+ years shipping platforms" },
  { label: "Altitude", value: "Staff IC ⇄ VP of Engineering" },
  { label: "Optimizing for", value: "AI-native product companies" },
];

const principles = [
  {
    title: "Raise the hiring bar, then trust it",
    body: "Leveling and interviewing are leverage. I calibrate the bar, write the rubric, and then give people the autonomy that bar earns — fewer, stronger engineers shipping with conviction.",
  },
  {
    title: "RFCs over heroics",
    body: "Hard calls get written down before they get built. An RFC culture turns architecture into a reviewable artifact, so decisions survive re-orgs and the reasoning outlives the author.",
  },
  {
    title: "AI that survives production",
    body: "Agentic UX is easy to demo and hard to keep honest. I build retrieval, evaluation, and human-in-the-loop surfaces that hold up under real traffic — not just on the happy path.",
  },
  {
    title: "Ship into regulated reality",
    body: "Governance software, automotive, streaming at tens-of-millions scale. I design for audit, accessibility, and release safety from the first commit, not as a compliance retrofit.",
  },
];

const community = [
  {
    title: "Founder, WebDevPortugal",
    body: "Built and run Portugal's web-engineering community — talks, mentoring, and a hiring network for local engineers.",
  },
  {
    title: "President & Co-Founder, Northern Grade E-Sports",
    body: "Co-founded and led a competitive e-sports organization — operations, sponsorship, and team leadership at altitude.",
  },
  {
    title: "Interviewing, mentoring & coaching",
    body: "Ongoing technical interviewing and engineering coaching — calibrating bars and growing senior engineers.",
  },
];

const education = [
  {
    school: "ISEL — Instituto Superior de Engenharia de Lisboa",
    credential: "Engineer's Degree, Computer Engineering",
    years: "2015–2018",
  },
  {
    school: "Universidade Lusófona",
    credential: "Bachelor of Laws (LLB)",
    years: "2011–2014",
  },
];

export default function AboutPage() {
  return (
    <section role="region" aria-labelledby="about-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-14 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        {/* Header */}
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
            platform infrastructure underneath them — at NBCUniversal&rsquo;s Peacock, BMW Group,
            Diligent, eino.ai, Moment, Deloitte, and Fueled.
          </p>

          <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-surface flex flex-col gap-1.5 p-4">
                <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                  {fact.label}
                </dt>
                <dd className="text-foreground text-sm leading-relaxed">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The pattern */}
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

        {/* How I work */}
        <div className="flex flex-col gap-5">
          <SectionLabel>How I work</SectionLabel>
          <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="bg-surface flex flex-col gap-2 p-5">
                <h3 className="text-foreground text-sm font-medium tracking-tight">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected experience — sourced from the same data as the hero graph */}
        <div className="flex flex-col gap-5">
          <SectionLabel>Selected experience</SectionLabel>
          <ol className="flex flex-col">
            {nodes.map((node) => {
              const href = nodeHref(node);
              const hasCaseStudy = href.startsWith("/work/");
              return (
                <li
                  key={node.id}
                  className="border-border grid gap-3 border-t py-5 first:border-t-0 sm:grid-cols-[7rem_1fr]"
                >
                  <span className="text-subtle-foreground tabular pt-0.5 font-mono text-xs tracking-wider">
                    {node.years}
                  </span>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-foreground text-base font-medium tracking-tight">
                        {node.fullName}
                      </h3>
                      <span className="text-muted-foreground text-sm">{node.role}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{node.summary}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {node.patterns.map((id) => (
                        <Badge
                          key={id}
                          tone="outline"
                          style={{
                            borderColor: `color-mix(in srgb, var(--${patterns[id].colorVar}) 40%, transparent)`,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-block size-1.5 rounded-full"
                            style={{ backgroundColor: `var(--${patterns[id].colorVar})` }}
                          />
                          {patterns[id].label}
                        </Badge>
                      ))}
                      {hasCaseStudy ? (
                        <Link
                          href={href}
                          className="text-accent hover:text-accent ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase underline-offset-4 hover:underline"
                        >
                          Read case study
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Community */}
        <div className="flex flex-col gap-5">
          <SectionLabel>Beyond the org</SectionLabel>
          <div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
            {community.map((c) => (
              <div key={c.title} className="bg-surface flex flex-col gap-2 p-5">
                <h3 className="text-foreground text-sm font-medium tracking-tight">{c.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="flex flex-col gap-5">
          <SectionLabel>Education</SectionLabel>
          <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
            {education.map((e) => (
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

        {/* CTA */}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-subtle-foreground border-border flex items-center gap-3 border-b pb-3 font-mono text-[11px] font-medium tracking-wider uppercase">
      {children}
    </h2>
  );
}

function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>{title}</SectionLabel>
      <div className="text-muted-foreground flex flex-col gap-4 text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}
