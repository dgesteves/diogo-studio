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

export const BOOT_ROLE_LINE = "Staff · Principal · Founding Engineer";
