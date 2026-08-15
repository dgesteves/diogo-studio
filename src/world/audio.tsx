"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  useSyncExternalStore,
} from "react";
import { useReducedMotionPreference } from "@/reduced-motion";
import { usePathname } from "next/navigation";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "./store";

/**
 * The room's sound: the engine that loads and plays the cues, the provider that owns whether
 * sound is on at all, and the component that turns world events into cues. Nothing plays
 * before the visitor answers the boot gate.
 */

export const AUDIO_STORAGE_KEY = "studio-audio-enabled";

export const AMBIENT_SRC = "/audio/music/ambient.mp3";

const SFX_SRC = {
  hover: "/audio/sfx/hover.mp3",
  select: "/audio/sfx/select.mp3",
  confirm: "/audio/sfx/confirm.mp3",
  whoosh: "/audio/sfx/whoosh.mp3",
} as const;

type SfxName = keyof typeof SFX_SRC;

export const AMBIENT_VOLUME = 0.35;
export const SFX_VOLUME = 0.45;
export const FADE_SECONDS = 1.2;

export type AudioEngine = {
  start: () => Promise<void>;
  stop: () => void;
  play: (name: SfxName) => void;
};

type Graph = {
  ambient: HTMLAudioElement;
  sfx: Record<SfxName, HTMLAudioElement>;
};

export function createAudioEngine(): AudioEngine {
  let graph: Graph | null = null;
  let fadeId: number | null = null;

  function ensure(): Graph {
    if (graph) return graph;
    const ambient = new Audio(AMBIENT_SRC);
    ambient.loop = true;
    ambient.preload = "auto";
    ambient.volume = 0;

    const sfx: Record<SfxName, HTMLAudioElement> = {
      hover: new Audio(SFX_SRC.hover),
      select: new Audio(SFX_SRC.select),
      confirm: new Audio(SFX_SRC.confirm),
      whoosh: new Audio(SFX_SRC.whoosh),
    };
    for (const el of Object.values(sfx)) {
      el.preload = "auto";
      el.volume = SFX_VOLUME;
    }

    graph = { ambient, sfx };
    return graph;
  }

  function clearFade(): void {
    if (fadeId === null) return;
    window.clearInterval(fadeId);
    fadeId = null;
  }

  function fadeAmbient(target: number, onDone?: () => void): void {
    const { ambient } = ensure();
    clearFade();
    const steps = Math.max(1, Math.round(FADE_SECONDS * 60));
    const from = ambient.volume;
    let step = 0;
    fadeId = window.setInterval(() => {
      step += 1;
      ambient.volume = Math.min(1, Math.max(0, from + (target - from) * (step / steps)));
      if (step >= steps) {
        clearFade();
        onDone?.();
      }
    }, 1000 / 60);
  }

  return {
    async start() {
      const { ambient } = ensure();
      try {
        await ambient.play();
      } catch {
        return;
      }
      fadeAmbient(AMBIENT_VOLUME);
    },
    stop() {
      if (!graph) return;
      const { ambient } = graph;
      fadeAmbient(0, () => ambient.pause());
    },
    play(name) {
      if (!graph) return;
      const el = graph.sfx[name];
      el.currentTime = 0;
      void el.play().catch(() => {});
    },
  };
}

type AudioContextValue = {
  enabled: boolean;
  enable: () => Promise<void>;
  toggle: () => void;
  play: (name: SfxName) => void;
};

const AudioStateContext = createContext<AudioContextValue | null>(null);

function persist(enabled: boolean): void {
  try {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

function readStored(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AudioProvider({ children }: { children: ReactNode }): ReactElement {
  const { reducedMotion } = useReducedMotionPreference();
  const [enabled, setEnabled] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);

  // Stable identity required for the one-time gesture listeners in the effect below.
  const enable = useCallback(async (): Promise<void> => {
    engineRef.current ??= createAudioEngine();
    await engineRef.current.start();
    setEnabled(true);
    persist(true);
    engineRef.current.play("confirm");
  }, []);

  function disable(): void {
    engineRef.current?.stop();
    setEnabled(false);
    persist(false);
  }

  function toggle(): void {
    if (enabled) disable();
    else void enable();
  }

  function play(name: SfxName): void {
    if (enabled) engineRef.current?.play(name);
  }

  useEffect(() => {
    if (reducedMotion || !readStored()) return;
    function resumeOnce(): void {
      void enable();
      window.removeEventListener("pointerdown", resumeOnce);
      window.removeEventListener("keydown", resumeOnce);
    }
    window.addEventListener("pointerdown", resumeOnce, { once: true });
    window.addEventListener("keydown", resumeOnce, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resumeOnce);
      window.removeEventListener("keydown", resumeOnce);
    };
  }, [reducedMotion, enable]);

  return (
    <AudioStateContext.Provider value={{ enabled, enable, toggle, play }}>
      {children}
    </AudioStateContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioStateContext);
  if (!value) throw new Error("useAudio must be used within <AudioProvider>.");
  return value;
}

export function WorldAudio(): null {
  const { play } = useAudio();
  const pathname = usePathname();
  const hovered = useSyncExternalStore(
    subscribeWorld,
    getWorldSnapshot,
    getWorldServerSnapshot,
  ).hovered;

  const previousHover = useRef(hovered);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (hovered && hovered !== previousHover.current) play("hover");
    previousHover.current = hovered;
  }, [hovered, play]);

  useEffect(() => {
    if (pathname !== previousPath.current) {
      play("whoosh");
      previousPath.current = pathname;
    }
  }, [pathname, play]);

  return null;
}
