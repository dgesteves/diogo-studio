"use client";

import { Command } from "cmdk";
import { Mail, Monitor, MoonStar, Sun } from "lucide-react";
import { type ReactElement } from "react";

import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { siteConfig } from "@/config/site";

import { Item } from "./command-menu-item";

type RunAction = (action: () => void) => void;

export function ThemeGroup({
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

export function ProfileGroup({ run }: { run: RunAction }): ReactElement {
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
