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
  Network,
  Notebook,
  Send,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { caseStudies, essays } from "#content";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { primaryNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { CommandMenuAsk } from "./command-menu-ask";
import { type CommandMenuMode, useCommandMenu } from "./command-menu-context";

/**
 * Global ⌘K Command Menu — Phase 4 ships the Ask mode alongside Navigate.
 *
 * Navigate mode (Phase 1): cmdk-driven list with pages, case studies,
 * essays, theme, and profile links.
 *
 * Ask mode (Phase 4): plain form + streamed answer from `/api/chat`, with
 * citation chips that deep-link into `/work/[slug]#anchor`. The agent is
 * strictly grounded to the indexed corpus and refuses anything else.
 *
 * Mode is local UI state. The two views share the dialog shell but render
 * fully independent input + body subtrees — cmdk only governs the
 * Navigate list, not the Ask form, so the Ask input behaves like a plain
 * text field (no arrow-key list nav, no fuzzy filtering).
 */

export function CommandMenu() {
  const { open, setOpen, mode, setMode } = useCommandMenu();
  // Bumped each time the dialog opens — child components key off it to
  // re-focus their inputs and reset any transient state. Driven from the
  // Radix `onOpenChange` event below so we don't sync state-from-state in
  // an effect (which trips the react-you-might-not-need-an-effect rule).
  const [openTick, setOpenTick] = useState(0);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setOpenTick((n) => n + 1);
      setOpen(next);
    },
    [setOpen],
  );

  // ⌘1 / ⌘2 to flip modes — discoverable from the footer hints.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "1") {
        e.preventDefault();
        setMode("navigate");
      } else if (e.key === "2") {
        e.preventDefault();
        setMode("ask");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setMode]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-background/70 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="border-border-strong bg-surface data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 fixed top-[18%] left-1/2 z-50 flex w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-lg border shadow-2xl shadow-black/20"
        >
          <VisuallyHidden>
            <Dialog.Title>
              {mode === "ask" ? "Ask the Inspector agent" : "Command menu"}
            </Dialog.Title>
          </VisuallyHidden>

          {mode === "navigate" ? (
            <NavigateView onClose={close} />
          ) : (
            <CommandMenuAsk onNavigate={close} openTick={openTick} />
          )}

          <Footer mode={mode} setMode={setMode} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------------------------------------------------------------------------
 * Navigate view — the Phase 1 list, refactored into its own component so
 * the mode switch is symmetric.
 * ------------------------------------------------------------------------- */

function NavigateView({ onClose }: { onClose: () => void }) {
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

/* ---------------------------------------------------------------------------
 * Footer — mode switch + keyboard hint.
 * ------------------------------------------------------------------------- */

function Footer({
  mode,
  setMode,
}: {
  mode: CommandMenuMode;
  setMode: (m: CommandMenuMode) => void;
}) {
  return (
    <div className="border-border bg-surface-muted/40 text-subtle-foreground flex items-center justify-between border-t px-3 py-2 font-mono text-[10px] tracking-wider uppercase">
      <div
        role="tablist"
        aria-label="Command menu mode"
        className="border-border bg-surface flex items-center rounded-md border p-0.5"
      >
        <ModeTab
          active={mode === "navigate"}
          onClick={() => setMode("navigate")}
          shortcut="1"
          icon={<Sparkles className="size-3" aria-hidden="true" />}
          label="Navigate"
        />
        <ModeTab
          active={mode === "ask"}
          onClick={() => setMode("ask")}
          shortcut="2"
          icon={<Network className="size-3" aria-hidden="true" />}
          label="Ask"
        />
      </div>
      <span className="hidden sm:inline" aria-hidden="true">
        ⌘1 / ⌘2 to switch
      </span>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  shortcut,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  shortcut: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1.5 rounded px-2 py-1 text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
        active ? "bg-foreground text-background" : "text-subtle-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "border-border ml-1 hidden rounded border px-1 sm:inline",
          active ? "border-background/40 text-background/80" : "text-subtle-foreground",
        )}
        aria-hidden="true"
      >
        ⌘{shortcut}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Navigate-mode utilities
 * ------------------------------------------------------------------------- */

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
