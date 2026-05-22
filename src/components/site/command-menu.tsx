"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command } from "cmdk";
import {
  ArrowUpRight,
  Briefcase,
  FileText,
  Home,
  Mail,
  Monitor,
  MoonStar,
  Send,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { primaryNav, siteConfig } from "@/lib/site-config";
import { useCommandMenu } from "./command-menu-context";

/**
 * Global ⌘K Command Menu — Phase 1 ships the Navigate mode only.
 *
 * Phase 4 will add an "Ask" mode that streams cited answers from the resume
 * and case-study index via the Vercel AI SDK.
 */
export function CommandMenu() {
  const { open, setOpen } = useCommandMenu();
  const router = useRouter();
  const { setTheme } = useTheme();

  const runAndClose = useCallback(
    (action: () => void) => {
      setOpen(false);
      // Defer to next frame so the dialog closes before navigation/theming —
      // avoids a brief visual jitter on slower devices.
      requestAnimationFrame(action);
    },
    [setOpen],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-background/70 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="border-border-strong bg-surface data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 fixed top-[20%] left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border shadow-2xl shadow-black/20"
        >
          <VisuallyHidden>
            <Dialog.Title>Command menu</Dialog.Title>
          </VisuallyHidden>

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

            <div className="border-border text-subtle-foreground flex items-center justify-between border-t px-3 py-2 font-mono text-[10px] tracking-wider uppercase">
              <span aria-current="step">Navigate</span>
              {/*
                "Ask" mode lands in Phase 4. We hint at it with a dashed-border
                chip instead of an opacity multiplier — `opacity-60` would
                fail WCAG AA contrast on small mono text.
              */}
              <span className="border-border text-subtle-foreground rounded border border-dashed px-1.5 py-px">
                Ask — Phase 4
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function iconForPage(href: string) {
  if (href.startsWith("/work")) return <Briefcase className="size-4" />;
  if (href.startsWith("/writing")) return <FileText className="size-4" />;
  if (href.startsWith("/about")) return <UserRound className="size-4" />;
  if (href.startsWith("/contact")) return <Send className="size-4" />;
  return <ArrowUpRight className="size-4" />;
}

type ItemProps = {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  external?: boolean;
  onSelect: () => void;
};

function Item({ icon, label, hint, external, onSelect }: ItemProps) {
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
