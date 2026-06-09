import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

export function AboutCta(): ReactElement {
  return (
    <>
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
            <Link href={routes.contact}>
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
        href={routes.work}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors"
      >
        See the work behind the story
        <ArrowUpRight className="size-3" aria-hidden="true" />
      </Link>
    </>
  );
}
