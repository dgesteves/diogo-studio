export const AUDIO_STORAGE_KEY = "studio-audio-enabled";

export const AMBIENT_SRC = "/audio/music/ambient.mp3";

export const SFX_SRC = {
  hover: "/audio/sfx/hover.mp3",
  select: "/audio/sfx/select.mp3",
  confirm: "/audio/sfx/confirm.mp3",
  whoosh: "/audio/sfx/whoosh.mp3",
} as const;

export type SfxName = keyof typeof SFX_SRC;

export const AMBIENT_VOLUME = 0.35;
export const SFX_VOLUME = 0.45;
export const FADE_SECONDS = 1.2;
