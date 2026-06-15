import type { Vec3, WorldStation } from "../types";

const SESSION_KEY = "world-intro-played";

export function consumeIntro(isHome: boolean): boolean {
  if (!isHome || typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function introStartPosition(station: WorldStation): Vec3 {
  const [x, y, z] = station.position;
  return [x * 1.5, y + 4.2, z * 1.9];
}
