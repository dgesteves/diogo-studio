"use client";

import { Command } from "cmdk";
import {
  ArrowUpRight,
  Home,
  Mail,
  Monitor,
  MoonStar,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { type ReactElement, type ReactNode } from "react";

import { GithubIcon, LinkedinIcon } from "@/ui/brand-icons";
import { routes, stationSectors } from "@/content/pages";
import { siteConfig } from "@/content/profile";

export function NavigateView({ onClose }: { onClose: () => void }): ReactElement {
  const router = useRouter();
  const { setTheme } = useTheme();

  function runAndClose(action: () => void): void {
    onClose();
    requestAnimationFrame(action);
  }

  return (
    <Command label="Site command menu" className="flex flex-col">
      <div className="border-border flex items-center gap-2 border-b px-4">
        <Sparkles className="text-muted-foreground size-4" aria-hidden="true" />
        <Command.Input
          placeholder="Type a command, page, or question…"
          className="text-foreground placeholder:text-subtle-foreground h-12 flex-1 bg-transparent text-sm focus:outline-none"
        />
        <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          ⌘K
        </span>
      </div>

      <Command.List className="max-h-[420px] overflow-y-auto px-2 py-2">
        <Command.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">
          No results. Try <span className="text-foreground font-medium">studio</span> or{" "}
          <span className="text-foreground font-medium">about</span>.
        </Command.Empty>

        {/*
         * All seventeen routes, under the editorial grouping `content/pages.ts` authors.
         * A second, partial list of six lived in `config/navigation.ts` until Phase 2b and
         * had already stopped covering two thirds of the site.
         */}
        {stationSectors.map((sector) => (
          <Command.Group key={sector.label} heading={sector.label}>
            {sector.stations.map((station) => (
              <Item
                key={station.href}
                icon={iconForPage(station.href)}
                label={station.label}
                hint={station.href}
                onSelect={() => runAndClose(() => router.push(station.href))}
              />
            ))}
          </Command.Group>
        ))}

        <ThemeGroup run={runAndClose} setTheme={setTheme} />

        <ProfileGroup run={runAndClose} />
      </Command.List>
    </Command>
  );
}

function iconForPage(href: string): ReactElement {
  if (href === routes.home) return <Home className="size-4" />;
  if (href.startsWith(routes.about)) return <UserRound className="size-4" />;
  return <ArrowUpRight className="size-4" />;
}

type ItemProps = {
  icon: ReactNode;
  label: string;
  hint?: string;
  external?: boolean;
  onSelect: () => void;
};

function Item({ icon, label, hint, external, onSelect }: ItemProps): ReactElement {
  return (
    <Command.Item
      onSelect={onSelect}
      className="text-foreground aria-selected:bg-surface-muted aria-selected:text-foreground data-[selected=true]:bg-surface-muted flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
    >
      <span className="border-border bg-surface-inset text-muted-foreground grid size-7 place-items-center rounded-md border">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {hint ? (
        <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          {hint}
        </span>
      ) : null}
      {external ? <ArrowUpRight className="text-subtle-foreground size-3.5" /> : null}
    </Command.Item>
  );
}

type RunAction = (action: () => void) => void;

function ThemeGroup({
  run,
  setTheme,
}: {
  run: RunAction;
  setTheme: (theme: string) => void;
}): ReactElement {
  return (
    <Command.Group heading="Theme">
      <Item
        icon={<Sun className="size-4" />}
        label="Light theme"
        onSelect={() => run(() => setTheme("light"))}
      />
      <Item
        icon={<MoonStar className="size-4" />}
        label="Dark theme"
        onSelect={() => run(() => setTheme("dark"))}
      />
      <Item
        icon={<Monitor className="size-4" />}
        label="Follow system"
        onSelect={() => run(() => setTheme("system"))}
      />
    </Command.Group>
  );
}

function ProfileGroup({ run }: { run: RunAction }): ReactElement {
  return (
    <Command.Group heading="Profile">
      <Item
        icon={<LinkedinIcon className="size-4" />}
        label="LinkedIn"
        hint="linkedin.com/in/diogo-esteves"
        external
        onSelect={() =>
          run(() => window.open(siteConfig.links.linkedin, "_blank", "noopener,noreferrer"))
        }
      />
      <Item
        icon={<GithubIcon className="size-4" />}
        label="GitHub"
        hint="github.com/dgesteves"
        external
        onSelect={() =>
          run(() => window.open(siteConfig.links.github, "_blank", "noopener,noreferrer"))
        }
      />
      <Item
        icon={<Mail className="size-4" />}
        label="Email"
        hint={siteConfig.email}
        external
        onSelect={() =>
          run(() => {
            window.location.href = `mailto:${siteConfig.email}`;
          })
        }
      />
    </Command.Group>
  );
}
