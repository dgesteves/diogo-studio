import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { patternList } from "@/constants/patterns";
import { routes } from "@/constants/routes";
import { getDestination } from "@/features/world";
import { HeroAskCta } from "./hero-ask-cta";

export function HeroSection(): ReactElement {
  const home = getDestination("home");

  return (
    <article className="world-intro-rise border-border/70 bg-background/80 supports-backdrop-filter:bg-background/60 pointer-events-auto flex w-full max-w-xl flex-col items-start gap-6 rounded-2xl border p-6 text-left shadow-2xl backdrop-blur-xl sm:p-8 md:max-w-md">
      <div className="border-border bg-surface/70 text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
        <StatusDot tone="good" />
        <span>Available — Staff+ / Principal / Founding / VP Engineering</span>
      </div>

      <h1
        id="hero-heading"
        className="neon-title text-foreground text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] font-medium tracking-tight text-balance"
      >
        {home.title}
      </h1>

      <p className="text-muted-foreground text-base leading-relaxed text-pretty sm:text-lg">
        {home.summary}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button asChild variant="accent" size="lg">
          <Link href={routes.work}>
            Explore the studio
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <HeroAskCta />
      </div>

      <ul className="flex flex-wrap items-center gap-2 pt-1">
        {patternList.map((pattern) => (
          <li key={pattern.id}>
            <Badge tone="outline">{pattern.label}</Badge>
          </li>
        ))}
      </ul>

      <p className="world-hint-pulse text-subtle-foreground pt-1 font-mono text-[10px] tracking-wider uppercase">
        Pick a sign in the studio — or use the dock — to travel
      </p>
    </article>
  );
}
