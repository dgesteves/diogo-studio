"use client";

import {
  type ReactElement,
  useState,
  type RefObject,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useProgress } from "@react-three/drei";
import {
  Activity,
  ArrowRight,
  Check,
  Construction,
  EyeOff,
  MoonStar,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { siteConfig } from "@/content/profile";
import { useAudio } from "./audio";
import { useInspectorOverlay } from "@/telemetry/store";
import { useIsClient } from "@/hooks/use-is-client";
import { useReducedMotionPreference } from "@/reduced-motion";
import { cn } from "@/utils/cn";
import { getBootServerSnapshot, getBootSnapshot, setBootProgress, subscribeBoot } from "./store";

/**
 * The gate a first-time visitor sees while the scene compiles: a splash the server renders,
 * a progress log, the three preferences that have to be answered before any sound plays, and
 * the sequence that decides how long all of it stays up.
 *
 * Fifteen files before this, every one of which had exactly one consumer — its parent. There
 * is no seam inside a boot screen: it runs once, in one order, and nothing else ever mounts a
 * piece of it.
 *
 * The signal it displays is not here. `world/store.ts` owns it, because the canvas publishes
 * progress and readiness and a store that cannot be imported without pulling in a DOM overlay
 * stops being usable as a store — which is exactly what happened when it lived here.
 */

/**
 * The boot handoff: how far the world has loaded, whether it is ready, whether this visitor
 * has already sat through it once, and the server-rendered splash that has to disappear when
 * the client sequence takes over.
 *
 * Separate from `store.ts` because it is a different lifecycle — it runs once, at startup,
 * and nothing reads it afterwards.
 */

export const BOOT_SESSION_KEY = "studio-booted";
export const BOOT_SPLASH_ID = "boot-splash";

export function hasBootedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBootedThisSession(): void {
  try {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function hideBootSplash(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(BOOT_SPLASH_ID);
  if (el) el.style.display = "none";
}

export const BOOT_MIN_MS = 1100;
export const BOOT_MAX_MS = 12_000;
export const BOOT_EXIT_MS = 700;

export const BOOT_STEPS = [
  "Initializing render pipeline",
  "Compiling WebGL shaders",
  "Loading workstation geometry",
  "Streaming studio textures",
  "Calibrating neon & volumetrics",
  "Wiring ambient audio bus",
  "Spinning up ambient systems",
  "Mounting interface layer",
] as const;

export const BOOT_READY_LABEL = "Studio ready";

const BOOT_ROLE_LINE = "Staff · Principal · Founding Engineer";

const BOOT_WIP_BADGE = "Alpha · Work in progress";

const BOOT_WIP_MESSAGE =
  "Welcome to my new portfolio an immersive, interactive 3D world. It is still in its early stages, so expect placeholder content and rough edges while I build it out.";

function BootBackdrop(): ReactElement {
  return (
    <div aria-hidden="true" className="boot-scene absolute inset-0 overflow-hidden">
      <div className="scene-aurora absolute inset-x-0 top-0 h-[58%]" />
      <div className="boot-sun absolute top-[12%] left-1/2 size-[min(76vw,440px)] -translate-x-1/2 rounded-full">
        <div className="boot-sun-grilles absolute inset-0 rounded-full" />
      </div>
      <div className="scene-grid absolute inset-x-[-50%] bottom-[-35vh] h-[260vh]" />
      <div className="scene-horizon absolute inset-x-0 bottom-[42%] h-px" />
      <div className="boot-scan-beam absolute inset-x-0 top-0 h-40" />
      <div className="boot-motes absolute inset-0 opacity-40" />
      <div className="boot-readability absolute inset-0" />
      <div className="scene-scanlines absolute inset-0 opacity-50" />
      <div className="boot-crt absolute inset-0" />
      <div className="scene-vignette absolute inset-0" />
    </div>
  );
}

function BootWordmark(): ReactElement {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-3">
      <p
        data-text={siteConfig.name}
        className="boot-glitch boot-neon boot-neon-in text-brand-cyan-bright font-mono text-xl font-semibold tracking-[0.3em] whitespace-nowrap uppercase sm:text-3xl sm:tracking-[0.34em]"
      >
        {siteConfig.name}
      </p>
      <span className="bg-brand-cyan/60 h-px w-40 shadow-[0_0_14px_var(--brand-cyan)] sm:w-48" />
      <p className="text-brand-cyan/85 font-mono text-[9px] tracking-[0.42em] uppercase sm:text-[10px]">
        {BOOT_ROLE_LINE}
      </p>
    </div>
  );
}

const CORNER = "border-brand-cyan/30 absolute size-5";
const LABEL = "text-brand-cyan/40 absolute font-mono text-[9px] tracking-[0.3em] uppercase";

function BootHud(): ReactElement {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <span className="boot-hud-sweep absolute inset-x-0 top-0 h-28" />
      <span className={cn(CORNER, "top-5 left-5 border-t border-l")} />
      <span className={cn(CORNER, "top-5 right-5 border-t border-r")} />
      <span className={cn(CORNER, "bottom-5 left-5 border-b border-l")} />
      <span className={cn(CORNER, "right-5 bottom-5 border-r border-b")} />
      <span className={cn(LABEL, "top-6 left-14 flex items-center gap-1.5")}>
        <span className="bg-brand-magenta boot-caret size-1.5 rounded-full shadow-[0_0_8px_var(--brand-magenta)]" />
        SYS · BOOT
      </span>
      <span className={cn(LABEL, "top-6 right-14")}>RENDER · WEBGL2</span>
      <span className={cn(LABEL, "bottom-6 left-14")}>NODE · LISBON</span>
      <span className={cn(LABEL, "right-14 bottom-6")}>38.7°N · 9.1°W</span>
    </div>
  );
}

type BootLogProps = {
  pct: number;
  ready: boolean;
};

function BootLog({ pct, ready }: BootLogProps): ReactElement {
  const total = BOOT_STEPS.length;

  return (
    <ul
      aria-hidden="true"
      className="w-full max-w-xs space-y-2 font-mono text-[10px] tracking-wide sm:text-[11px]"
    >
      {BOOT_STEPS.map((label, index) => {
        const done = ready || pct >= ((index + 1) / total) * 100;
        const active = !done && pct >= (index / total) * 100;

        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 transition-colors duration-300",
              done ? "text-brand-cyan-bright" : active ? "text-white/90" : "text-white/45",
            )}
          >
            <span className="flex w-3 justify-center">
              {done ? (
                <Check className="size-3" />
              ) : (
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-current",
                    active && "bg-brand-cyan animate-pulse",
                  )}
                />
              )}
            </span>
            <span className="tabular text-brand-magenta/60 text-[9px]">
              {`0x${(index + 1).toString(16).toUpperCase().padStart(2, "0")}`}
            </span>
            <span className="flex-1 text-left">
              {label}
              {active && <span className="boot-caret text-brand-cyan ml-1">_</span>}
            </span>
            <span className="text-[9px] opacity-70">{done ? "OK" : active ? "··" : ""}</span>
          </li>
        );
      })}
    </ul>
  );
}

type BootProgressProps = {
  pct: number;
  step: string;
  ready: boolean;
};

function BootProgress({ pct, step, ready }: BootProgressProps): ReactElement {
  return (
    <div className="w-full">
      <div className="boot-progress-track relative h-2 w-full overflow-hidden rounded-full border border-white/15 bg-white/5">
        <div
          className="boot-fill absolute inset-y-0 left-0 overflow-hidden rounded-full shadow-[0_0_18px_var(--brand-cyan)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="boot-sheen absolute inset-0" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
        <span className="flex items-center gap-2 text-white/70">
          <span
            className={cn(
              "size-1.5 rounded-full",
              ready ? "bg-brand-cyan" : "bg-brand-cyan/70 animate-pulse",
            )}
          />
          {step}
        </span>
        <span
          data-text={`${Math.round(pct)}%`}
          className="boot-glitch tabular text-brand-cyan-bright"
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

function BootWipNotice(): ReactElement {
  return (
    <div
      role="note"
      className="border-brand-magenta/35 bg-brand-ink/60 w-full max-w-xs border px-4 py-3 shadow-[0_0_20px_color-mix(in_srgb,var(--brand-magenta)_12%,transparent)] backdrop-blur-sm sm:max-w-sm"
    >
      <p className="text-brand-magenta flex items-center justify-center gap-2 font-mono text-[9px] font-semibold tracking-[0.32em] uppercase sm:text-[10px]">
        <Construction aria-hidden="true" className="size-3.5" />
        {BOOT_WIP_BADGE}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/60 sm:text-xs">
        {BOOT_WIP_MESSAGE}
      </p>
    </div>
  );
}

const SOUND_OPTIONS = [
  { value: "on", label: "Sound", Icon: Volume2 },
  { value: "off", label: "Muted", Icon: VolumeX },
];

type BootSoundToggleProps = {
  soundOn: boolean;
  onChange: (soundOn: boolean) => void;
};

function BootSoundToggle({ soundOn, onChange }: BootSoundToggleProps): ReactElement {
  return (
    <Segmented
      label="Sound preference"
      options={SOUND_OPTIONS}
      value={soundOn ? "on" : "off"}
      onChange={(value) => onChange(value === "on")}
    />
  );
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: MoonStar },
];

export function BootThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <Segmented
      label="Theme preference"
      options={THEME_OPTIONS}
      value={isClient ? resolvedTheme : undefined}
      onChange={setTheme}
    />
  );
}

const INSPECTOR_OPTIONS = [
  { value: "on", label: "Inspector", Icon: Activity },
  { value: "off", label: "Hidden", Icon: EyeOff },
];

type BootInspectorToggleProps = {
  inspectorOn: boolean;
  onChange: (inspectorOn: boolean) => void;
};

function BootInspectorToggle({ inspectorOn, onChange }: BootInspectorToggleProps): ReactElement {
  return (
    <Segmented
      label="Inspector preference"
      options={INSPECTOR_OPTIONS}
      value={inspectorOn ? "on" : "off"}
      onChange={(value) => onChange(value === "on")}
    />
  );
}

type BootActionsProps = {
  canEnter: boolean;
  primaryRef: RefObject<HTMLButtonElement | null>;
  onEnterWithSound: () => void;
  onEnterMuted: () => void;
};

function BootActions({
  canEnter,
  primaryRef,
  onEnterWithSound,
  onEnterMuted,
}: BootActionsProps): ReactElement {
  const [soundOn, setSoundOn] = useState(true);
  const [inspectorOn, setInspectorOn] = useState(true);
  const { setOpen: setInspectorOpen } = useInspectorOverlay();

  function handleEnter(withSound: boolean): void {
    setInspectorOpen(inspectorOn);
    if (withSound) onEnterWithSound();
    else onEnterMuted();
  }

  if (!canEnter) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleEnter(false)}
        className="focus-visible:ring-offset-brand-ink font-mono text-[10px] tracking-widest text-white/45 uppercase hover:bg-white/5 hover:text-white/80"
      >
        Skip intro
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <BootThemeToggle />
        <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        <BootSoundToggle soundOn={soundOn} onChange={setSoundOn} />
        <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        <BootInspectorToggle inspectorOn={inspectorOn} onChange={setInspectorOn} />
      </div>
      <div className="group relative inline-flex">
        <span
          aria-hidden="true"
          className="boot-cta-frame pointer-events-none absolute -inset-px"
        />
        <Button
          ref={primaryRef}
          type="button"
          onClick={() => handleEnter(soundOn)}
          className="boot-cta border-brand-cyan/50 bg-brand-ink/70 text-brand-cyan-bright hover:border-brand-cyan hover:bg-brand-cyan/15 active:bg-brand-cyan/20 relative h-11 gap-2 overflow-hidden rounded-none border px-9 font-mono text-[11px] font-semibold tracking-[0.22em] uppercase shadow-[0_0_26px_color-mix(in_srgb,var(--brand-cyan)_22%,transparent),inset_0_0_18px_color-mix(in_srgb,var(--brand-cyan)_14%,transparent)] backdrop-blur-sm [text-shadow:0_0_12px_var(--brand-cyan)] focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <span
            aria-hidden="true"
            className="via-brand-cyan/25 pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          />
          <span className="relative z-10 inline-flex items-center gap-2">
            Enter the studio
            <ArrowRight aria-hidden="true" />
          </span>
        </Button>
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -top-1 -left-1 size-2.5 border-t-2 border-l-2 transition-all duration-300 group-hover:-top-1.5 group-hover:-left-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -top-1 -right-1 size-2.5 border-t-2 border-r-2 transition-all duration-300 group-hover:-top-1.5 group-hover:-right-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -bottom-1 -left-1 size-2.5 border-b-2 border-l-2 transition-all duration-300 group-hover:-bottom-1.5 group-hover:-left-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -right-1 -bottom-1 size-2.5 border-r-2 border-b-2 transition-all duration-300 group-hover:-right-1.5 group-hover:-bottom-1.5"
        />
      </div>
    </div>
  );
}

type BootOverlayProps = {
  progress: number;
  canEnter: boolean;
  exiting: boolean;
  onEnterWithSound: () => void;
  onEnterMuted: () => void;
};

function BootOverlay({
  progress,
  canEnter,
  exiting,
  onEnterWithSound,
  onEnterMuted,
}: BootOverlayProps): ReactElement {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [faux, setFaux] = useState(8);

  useEffect(() => {
    if (canEnter) return;
    const id = window.setInterval(() => {
      setFaux((value) => (value < 92 ? value + Math.max(0.6, (92 - value) * 0.08) : value));
    }, 180);
    return () => window.clearInterval(id);
  }, [canEnter]);

  useEffect(() => {
    // Move focus for keyboard/screen-reader users without painting the focus
    // ring over the CTA's animated border; Tab still reveals it.
    if (canEnter) primaryRef.current?.focus({ focusVisible: false });
  }, [canEnter]);

  const pct = canEnter ? 100 : Math.min(96, Math.max(progress, faux));
  const stepIndex = Math.min(BOOT_STEPS.length - 1, Math.floor((pct / 100) * BOOT_STEPS.length));
  const step = canEnter ? BOOT_READY_LABEL : (BOOT_STEPS[stepIndex] ?? BOOT_STEPS[0]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onEnterMuted()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-6 pb-[8vh] outline-none",
            "transition-opacity duration-700 ease-out",
            exiting ? "opacity-0" : "opacity-100",
          )}
        >
          <BootBackdrop />
          <BootHud />

          <div
            className={cn(
              "relative flex w-full max-w-md flex-col items-center gap-8 text-center",
              !exiting && "world-intro-rise",
            )}
          >
            <Dialog.Title className="sr-only">
              Entering {siteConfig.name}&rsquo;s studio
            </Dialog.Title>

            <BootWordmark />

            <BootWipNotice />

            <BootLog pct={pct} ready={canEnter} />

            <BootProgress pct={pct} step={step} ready={canEnter} />

            <BootActions
              canEnter={canEnter}
              primaryRef={primaryRef}
              onEnterWithSound={onEnterWithSound}
              onEnterMuted={onEnterMuted}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const HIDE_IF_BOOTED = `try{if(sessionStorage.getItem('${BOOT_SESSION_KEY}')==='1'){var e=document.getElementById('${BOOT_SPLASH_ID}');if(e)e.style.display='none'}}catch(_){}`;

export function BootSplash(): ReactElement {
  return (
    <div
      id={BOOT_SPLASH_ID}
      aria-hidden="true"
      className="fixed inset-0 z-45 overflow-hidden"
      suppressHydrationWarning
    >
      <BootBackdrop />
      <noscript>
        <style>{`#${BOOT_SPLASH_ID}{display:none}`}</style>
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_BOOTED }} />
    </div>
  );
}

export function BootSequence(): ReactElement | null {
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();
  const { enable } = useAudio();
  const { progress, ready } = useSyncExternalStore(
    subscribeBoot,
    getBootSnapshot,
    getBootServerSnapshot,
  );

  const [exiting, setExiting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  const show = isClient && !reducedMotion && !finished && !hasBootedThisSession();

  useEffect(() => {
    if (isClient) hideBootSplash();
  }, [isClient]);

  useEffect(() => {
    if (!show) return;
    const minTimer = window.setTimeout(() => setMinElapsed(true), BOOT_MIN_MS);
    const maxTimer = window.setTimeout(() => setForceReady(true), BOOT_MAX_MS);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
    };
  }, [show]);

  function enter(withSound: boolean): void {
    if (exiting) return;
    if (withSound) void enable();
    setExiting(true);
    window.setTimeout(() => {
      markBootedThisSession();
      setFinished(true);
    }, BOOT_EXIT_MS);
  }

  if (!show) return null;

  return (
    <BootOverlay
      progress={progress}
      canEnter={(ready || forceReady) && minElapsed}
      exiting={exiting}
      onEnterWithSound={() => enter(true)}
      onEnterMuted={() => enter(false)}
    />
  );
}

export function BootProgressReporter(): null {
  const { progress } = useProgress();

  useEffect(() => {
    setBootProgress(progress);
  }, [progress]);

  return null;
}
