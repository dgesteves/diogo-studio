"use client";

import { createContext, useContext, useSyncExternalStore, type ReactElement } from "react";

import {
  getLowPowerServerSnapshot,
  getLowPowerSnapshot,
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  getSystemServerSnapshot,
  getSystemSnapshot,
  persistOverride,
  subscribeLowPower,
  subscribeOverride,
  subscribeSystem,
} from "@/stores/reduced-motion-store";

type ReducedMotionContextValue = {
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  lowPower: boolean;
  override: boolean | null;
  setOverride: (value: boolean | null) => void;
};

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }): ReactElement {
  const systemReducedMotion = useSyncExternalStore(
    subscribeSystem,
    getSystemSnapshot,
    getSystemServerSnapshot,
  );

  const lowPower = useSyncExternalStore(
    subscribeLowPower,
    getLowPowerSnapshot,
    getLowPowerServerSnapshot,
  );

  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  function setOverride(value: boolean | null): void {
    persistOverride(value);
  }

  const value: ReducedMotionContextValue = {
    reducedMotion: override ?? (systemReducedMotion || lowPower),
    systemReducedMotion,
    lowPower,
    override,
    setOverride,
  };

  return <ReducedMotionContext.Provider value={value}>{children}</ReducedMotionContext.Provider>;
}

export function useReducedMotionPreference(): ReducedMotionContextValue {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
    return {
      reducedMotion: false,
      systemReducedMotion: false,
      lowPower: false,
      override: null,
      setOverride: () => {},
    };
  }
  return ctx;
}
