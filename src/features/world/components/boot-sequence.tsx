"use client";

import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import { useAudio } from "@/features/audio";
import { useIsClient } from "@/hooks/use-is-client";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import {
  getBootServerSnapshot,
  getBootSnapshot,
  hasBootedThisSession,
  hideBootSplash,
  markBootedThisSession,
  subscribeBoot,
} from "@/stores/boot-store";
import { BOOT_EXIT_MS, BOOT_MAX_MS, BOOT_MIN_MS } from "../constants/boot";
import { BootOverlay } from "./boot-overlay";

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
