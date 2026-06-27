export function isWorldSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.tagName === "MAIN" || target.closest("[data-world-root]") !== null;
}

export type OrbitInputState = {
  azimuth: number;
  polar: number;
  zoom: number;
  dragging: boolean;
  lastInput: number;
  clientX: number;
  clientY: number;
  overWorld: boolean;
  clickSeq: number;
  clickX: number;
  clickY: number;
};

export function neutralOrbitState(): OrbitInputState {
  return {
    azimuth: 0,
    polar: 0,
    zoom: 1,
    dragging: false,
    lastInput: 0,
    clientX: -1,
    clientY: -1,
    overWorld: false,
    clickSeq: 0,
    clickX: 0,
    clickY: 0,
  };
}
