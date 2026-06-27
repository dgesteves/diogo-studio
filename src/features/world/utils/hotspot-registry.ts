import type { Object3D } from "three";

const objects = new Set<Object3D>();

export function registerHotspot(object: Object3D): void {
  objects.add(object);
}

export function unregisterHotspot(object: Object3D): void {
  objects.delete(object);
}

export function getHotspotObjects(): Object3D[] {
  return Array.from(objects);
}
