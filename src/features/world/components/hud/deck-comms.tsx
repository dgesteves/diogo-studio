import type { ReactElement } from "react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { StatusDot } from "@/components/ui/status-dot";
import { siteConfig } from "@/config/site";

export function DeckComms(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <div className="border-border/70 mt-auto flex flex-col gap-2.5 border-t pt-4">
      <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
        <StatusDot tone="good" />
        <span>Available — Staff+, Principal, Founding, VP Eng</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {siteConfig.email}
        </a>
        <a
          href={siteConfig.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <LinkedinIcon className="size-3.5" />
          LinkedIn
        </a>
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <GithubIcon className="size-3.5" />
          GitHub
        </a>
      </div>
      <p className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
        © {year} {siteConfig.name}
      </p>
    </div>
  );
}
