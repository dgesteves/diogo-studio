import type { ReactElement } from "react";
import Link from "next/link";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { StatusDot } from "@/components/ui/status-dot";
import { routes } from "@/constants/routes";
import { siteConfig } from "@/config/site";

export function SiteFooter(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-background mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
            <StatusDot tone="good" />
            <span>Available — Staff+, Principal, Founding, VP Engineering</span>
          </div>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            {siteConfig.role}. Based in {siteConfig.location}. Reach out about architecture, hiring,
            or platform engagements.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <ul className="flex flex-wrap items-center gap-3 text-sm">
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {siteConfig.email}
              </a>
            </li>
            <li aria-hidden="true" className="text-subtle-foreground">
              ·
            </li>
            <li>
              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <LinkedinIcon className="size-3.5" />
                LinkedIn
              </a>
            </li>
            <li aria-hidden="true" className="text-subtle-foreground">
              ·
            </li>
            <li>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <GithubIcon className="size-3.5" />
                GitHub
              </a>
            </li>
          </ul>
          <div className="text-subtle-foreground flex items-center gap-3 font-mono text-[10px] tracking-wider uppercase">
            <span>
              © {year} {siteConfig.name}
            </span>
            <span aria-hidden="true">·</span>
            <Link href={routes.colophon} className="hover:text-foreground transition-colors">
              Colophon
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
