export type ExploreAxis = "forward" | "back" | "left" | "right";
export type ExploreKeyAction = ExploreAxis | "exit";

const KEY_ACTIONS: Record<string, ExploreKeyAction> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Escape: "exit",
};

export function keyToAction(code: string): ExploreKeyAction | null {
  return KEY_ACTIONS[code] ?? null;
}

export type ExploreInputState = {
  forward: number;
  strafe: number;
  yaw: number;
  pitch: number;
  dragging: boolean;
};

export function neutralExploreState(): ExploreInputState {
  return { forward: 0, strafe: 0, yaw: 0, pitch: 0, dragging: false };
}

export function axesFromKeys(held: ReadonlySet<ExploreAxis>): {
  forward: number;
  strafe: number;
} {
  const forward = (held.has("forward") ? 1 : 0) - (held.has("back") ? 1 : 0);
  const strafe = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
  return { forward, strafe };
}
