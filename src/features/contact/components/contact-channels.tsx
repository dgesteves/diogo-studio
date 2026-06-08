import type { ReactElement, ReactNode } from "react";
import { Mail } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { siteConfig } from "@/config/site";

export function ContactChannels(): ReactElement {
  return (
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
  icon: ReactNode;
  external?: boolean;
}): ReactElement {
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
