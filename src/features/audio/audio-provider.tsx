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
} from "react";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { createAudioEngine, type AudioEngine } from "./audio-engine";
import { AUDIO_STORAGE_KEY, type SfxName } from "./constants";

type AudioContextValue = {
  enabled: boolean;
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
    <AudioStateContext.Provider value={{ enabled, toggle, play }}>
      {children}
    </AudioStateContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioStateContext);
  if (!value) throw new Error("useAudio must be used within <AudioProvider>.");
  return value;
}
