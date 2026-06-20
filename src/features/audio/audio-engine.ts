import {
  AMBIENT_SRC,
  AMBIENT_VOLUME,
  FADE_SECONDS,
  SFX_SRC,
  SFX_VOLUME,
  type SfxName,
} from "./constants";

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
