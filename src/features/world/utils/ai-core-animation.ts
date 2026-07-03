import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight } from "three";

export type AiCoreParts = {
  bob: Group | null;
  core: Mesh | null;
  shell: Mesh | null;
  ringA: Mesh | null;
  ringB: Mesh | null;
  glow: Mesh | null;
  light: PointLight | null;
  label: HTMLSpanElement | null;
};

const BOB_SPEED = 1.3;
const BOB_HEIGHT = 0.06;
const PULSE_SPEED = 2.4;
const LABEL_IDLE_OPACITY = 0.28;

export function animateAiCore(parts: AiCoreParts, t: number, a: number): void {
  const pulse = Math.sin(t * PULSE_SPEED);

  if (parts.bob) parts.bob.position.y = Math.sin(t * BOB_SPEED) * BOB_HEIGHT;
  if (parts.core) {
    parts.core.rotation.y = t * 0.6;
    const material = parts.core.material as MeshStandardMaterial;
    material.emissiveIntensity = 1.9 + pulse * 0.45 + a * 1.3;
  }
  if (parts.shell) {
    parts.shell.rotation.y = -t * 0.25;
    parts.shell.rotation.x = Math.sin(t * 0.5) * 0.2;
  }
  if (parts.ringA) parts.ringA.rotation.z = t * 0.8;
  if (parts.ringB) parts.ringB.rotation.z = -t * 0.55;
  if (parts.light) parts.light.intensity = 1.15 + pulse * 0.25 + a * 1.5;
  if (parts.glow) {
    (parts.glow.material as MeshBasicMaterial).opacity = 0.16 + a * 0.3;
    parts.glow.scale.setScalar(1 + pulse * 0.04 + a * 0.25);
  }
  if (parts.label) {
    parts.label.style.opacity = String(LABEL_IDLE_OPACITY + a * (1 - LABEL_IDLE_OPACITY));
    parts.label.style.transform = `translateY(${(1 - a) * 6}px)`;
  }
}
