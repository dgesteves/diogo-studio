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
    <div className="world-intro-rise pointer-events-auto flex w-full max-w-2xl flex-col items-center gap-7 text-center">
      <div className="border-border bg-surface/70 text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase backdrop-blur">
        <StatusDot tone="good" />
        <span>Available — Staff+ / Principal / Founding / VP Engineering</span>
      </div>

      <h1
        id="hero-heading"
        className="neon-title text-foreground text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-medium tracking-tight text-balance"
      >
        {home.title}
      </h1>

      <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-balance sm:text-lg">
        {home.summary}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button asChild variant="accent" size="lg">
          <Link href={routes.work}>
            Explore the studio
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <HeroAskCta />
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {patternList.map((pattern) => (
          <li key={pattern.id}>
            <Badge tone="outline">{pattern.label}</Badge>
          </li>
        ))}
      </ul>

      <p className="world-hint-pulse text-subtle-foreground pt-2 font-mono text-[10px] tracking-wider uppercase">
        Pick a sign in the studio — or use the dock — to travel
      </p>
    </div>
  );
}
