export const worldObjectKinds = [
  "monitor-left",
  "monitor-center",
  "monitor-right",
  "neon-sign",
  "bookshelf",
  "server-rack",
  "speaker-stack",
  "plant",
  "coffee",
  "door",
  "poster",
  "whiteboard",
  "arcade",
  "frame",
  "timeline-strip",
] as const;

export type WorldObjectKind = (typeof worldObjectKinds)[number];
