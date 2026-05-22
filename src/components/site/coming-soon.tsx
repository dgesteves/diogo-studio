import Link from "next/link";
import { Balancer } from "react-wrap-balancer";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";

/**
 * Tasteful placeholder section for routes that exist in the IA but whose
 * content lands in a later phase. Renders honestly — no "coming soon",
 * no spinner, no fake teaser — just a console-grade status card that
 * says what's planned and links back to live work.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  shipPhase,
  shipScope,
  backHref = "/",
  backLabel = "Back home",
}: {
  eyebrow: string;
  title: string;
  description: string;
  shipPhase: string;
  shipScope: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section
      role="region"
      aria-labelledby="coming-soon-heading"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="border-border bg-surface text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
          <StatusDot tone="warn" />
          <span>{eyebrow}</span>
        </div>

        <h1
          id="coming-soon-heading"
          className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight"
        >
          <Balancer>{title}</Balancer>
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          <Balancer>{description}</Balancer>
        </p>

        <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
          <div className="bg-surface flex flex-col gap-2 p-5">
            <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              Lands in
            </dt>
            <dd className="text-foreground text-sm">
              <Badge tone="accent">{shipPhase}</Badge>
            </dd>
          </div>
          <div className="bg-surface flex flex-col gap-2 p-5">
            <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              Scope
            </dt>
            <dd className="text-muted-foreground text-sm leading-relaxed">{shipScope}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild variant="outline" size="md">
            <Link href={backHref}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
