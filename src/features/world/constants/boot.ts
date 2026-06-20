export const BOOT_MIN_MS = 1100;
export const BOOT_MAX_MS = 12_000;
export const BOOT_EXIT_MS = 700;

export const BOOT_STEPS = [
  "Initializing render pipeline",
  "Loading workstation geometry",
  "Calibrating neon & volumetrics",
  "Spinning up ambient systems",
] as const;

export const BOOT_READY_LABEL = "Studio ready";
