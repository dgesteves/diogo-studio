"use client";

import { Command } from "cmdk";
import { Briefcase, Home, Mail, Monitor, MoonStar, Notebook, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, type ReactElement } from "react";

import { caseStudies, essays } from "#content";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { primaryNav, siteConfig } from "@/config/site";

import { Item, iconForPage } from "./command-menu-item";

export function NavigateView({ onClose }: { onClose: () => void }): ReactElement {
  const router = useRouter();
  const { setTheme } = useTheme();

  const runAndClose = useCallback(
    (action: () => void) => {
      onClose();
      requestAnimationFrame(action);
    },
    [onClose],
  );

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
          No results. Try <span className="text-foreground font-medium">work</span>,{" "}
          <span className="text-foreground font-medium">writing</span>, or{" "}
          <span className="text-foreground font-medium">contact</span>.
        </Command.Empty>

        <Command.Group heading="Pages">
          <Item
            icon={<Home className="size-4" />}
            label="Home"
            hint="/"
            onSelect={() => runAndClose(() => router.push("/"))}
          />
          {primaryNav.map((item) => (
            <Item
              key={item.href}
              icon={iconForPage(item.href)}
              label={item.label}
              hint={item.href}
              onSelect={() => runAndClose(() => router.push(item.href))}
            />
          ))}
        </Command.Group>

        {caseStudies.filter((s) => !s.draft).length > 0 ? (
          <Command.Group heading="Case studies">
            {caseStudies
              .filter((s) => !s.draft)
              .sort((a, b) => a.order - b.order)
              .map((study) => (
                <Item
                  key={study.slug}
                  icon={<Briefcase className="size-4" />}
                  label={study.title}
                  hint={study.company}
                  onSelect={() => runAndClose(() => router.push(study.permalink))}
                />
              ))}
          </Command.Group>
        ) : null}

        {essays.filter((e) => !e.draft).length > 0 ? (
          <Command.Group heading="Essays">
            {essays
              .filter((e) => !e.draft)
              .sort((a, b) => a.order - b.order)
              .map((essay) => (
                <Item
                  key={essay.slug}
                  icon={<Notebook className="size-4" />}
                  label={essay.title}
                  hint={`${essay.metadata.readingTime} min read`}
                  onSelect={() => runAndClose(() => router.push(essay.permalink))}
                />
              ))}
          </Command.Group>
        ) : null}

        <Command.Group heading="Theme">
          <Item
            icon={<Sun className="size-4" />}
            label="Light theme"
            onSelect={() => runAndClose(() => setTheme("light"))}
          />
          <Item
            icon={<MoonStar className="size-4" />}
            label="Dark theme"
            onSelect={() => runAndClose(() => setTheme("dark"))}
          />
          <Item
            icon={<Monitor className="size-4" />}
            label="Follow system"
            onSelect={() => runAndClose(() => setTheme("system"))}
          />
        </Command.Group>

        <Command.Group heading="Profile">
          <Item
            icon={<LinkedinIcon className="size-4" />}
            label="LinkedIn"
            hint="linkedin.com/in/diogo-esteves"
            external
            onSelect={() =>
              runAndClose(() =>
                window.open(siteConfig.links.linkedin, "_blank", "noopener,noreferrer"),
              )
            }
          />
          <Item
            icon={<GithubIcon className="size-4" />}
            label="GitHub"
            hint="github.com/dgesteves"
            external
            onSelect={() =>
              runAndClose(() =>
                window.open(siteConfig.links.github, "_blank", "noopener,noreferrer"),
              )
            }
          />
          <Item
            icon={<Mail className="size-4" />}
            label="Email"
            hint={siteConfig.email}
            external
            onSelect={() =>
              runAndClose(() => {
                window.location.href = `mailto:${siteConfig.email}`;
              })
            }
          />
        </Command.Group>
      </Command.List>
    </Command>
  );
}
