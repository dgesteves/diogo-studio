import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { ContactForm } from "@/features/contact";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out about Staff+, Principal, Founding Engineer, or VP / Head of Engineering roles.",
  alternates: { canonical: "/contact" },
};

/**
 * Contact page — branded `react-hook-form` + Resend form with Upstash
 * rate-limiting (Phase 5), plus the direct channels as a secondary strip so
 * the route is useful even when email delivery isn't configured.
 */
export default function ContactPage(): ReactElement {
  return (
    <section role="region" aria-labelledby="contact-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="text-muted-foreground border-border bg-surface inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
          <StatusDot tone="good" />
          <span>Open to senior engineering roles</span>
        </div>

        <h1
          id="contact-heading"
          className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-balance"
        >
          Tell me about the system you’re trying to build.
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
          Mention the role altitude (IC, Founding, VPE), the company stage, and one decision you’re
          wrestling with. I’ll respond with how I’d approach it.
        </p>

        <ContactForm />

        <div className="flex items-center gap-3 pt-4">
          <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
            Or reach me directly
          </span>
          <span className="bg-border h-px flex-1" aria-hidden="true" />
        </div>

        <ul className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
          <ContactCard
            label="Email"
            value={siteConfig.email}
            href={`mailto:${siteConfig.email}`}
            icon={<Mail className="size-4" />}
          />
          <ContactCard
            label="LinkedIn"
            value="linkedin.com/in/diogo-esteves"
            href={siteConfig.links.linkedin}
            external
            icon={<LinkedinIcon className="size-4" />}
          />
          <ContactCard
            label="GitHub"
            value="github.com/dgesteves"
            href={siteConfig.links.github}
            external
            icon={<GithubIcon className="size-4" />}
          />
        </ul>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild variant="outline" size="md">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Back home</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContactCard({
  label,
  value,
  href,
  icon,
  external,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li className="bg-surface">
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="hover:bg-surface-muted flex flex-col gap-2 p-5 transition-colors"
      >
        <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
          {icon}
          {label}
        </span>
        <span className="text-foreground text-sm break-all">{value}</span>
      </a>
    </li>
  );
}
