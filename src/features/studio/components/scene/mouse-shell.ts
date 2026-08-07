import { Vector3 } from "three";

const MOUSE_LENGTH = 0.112;
const MOUSE_WIDTH = 0.0635;
const MOUSE_HEIGHT = 0.024;

const PLAN_FLATNESS = 4.2;
const NOSE_NARROWING = 0.12;
const CREST_ROUNDING = 8;
const CREST_FALLOFF = 3;
const NOSE_HEIGHT = 0.11;
const CREST_START = 0.06;
const CREST_END = 0.74;
const NOSE_LIFT = 0.3;
const NOSE_LIFT_START = 0.18;
const NOSE_LIFT_END = 0.6;
const SECTION_NOSE = 2.4;
const SECTION_TAIL = 3.2;
const DERIVATIVE_STEP = 0.0015;

function smoothStep(from: number, to: number, value: number): number {
  const blend = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return blend * blend * (3 - 2 * blend);
}

function smootherStep(from: number, to: number, value: number): number {
  const blend = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return blend * blend * blend * (blend * (blend * 6 - 15) + 10);
}

function halfWidthAt(t: number): number {
  const along = Math.abs(2 * t - 1);
  const outline = Math.max(0, 1 - along ** PLAN_FLATNESS) ** (1 / PLAN_FLATNESS);
  return (MOUSE_WIDTH / 2) * outline * (1 - NOSE_NARROWING * (1 - t));
}

function heightAt(t: number): number {
  const along = Math.abs(2 * t - 1);
  const crest = Math.max(0, 1 - along ** CREST_ROUNDING) ** (1 / CREST_FALLOFF);
  const rise = NOSE_HEIGHT + (1 - NOSE_HEIGHT) * smoothStep(CREST_START, CREST_END, t);
  const bulge = NOSE_LIFT * (1 - smootherStep(NOSE_LIFT_START, NOSE_LIFT_END, t));
  return MOUSE_HEIGHT * crest * (rise + bulge);
}

export function mousePoint(t: number, v: number): Vector3 {
  const angle = v * Math.PI;
  const power = 2 / (SECTION_NOSE + (SECTION_TAIL - SECTION_NOSE) * smoothStep(0, 1, t));
  const cos = Math.cos(angle);

  return new Vector3(
    halfWidthAt(t) * Math.sign(cos) * Math.abs(cos) ** power,
    heightAt(t) * Math.abs(Math.sin(angle)) ** power,
    (t - 0.5) * MOUSE_LENGTH,
  );
}

export function mouseNormal(t: number, v: number): Vector3 {
  const safeT = Math.min(Math.max(t, DERIVATIVE_STEP), 1 - DERIVATIVE_STEP);
  const safeV = Math.min(Math.max(v, DERIVATIVE_STEP), 1 - DERIVATIVE_STEP);
  const alongLength = mousePoint(safeT + DERIVATIVE_STEP, safeV).sub(
    mousePoint(safeT - DERIVATIVE_STEP, safeV),
  );
  const alongSection = mousePoint(safeT, safeV + DERIVATIVE_STEP).sub(
    mousePoint(safeT, safeV - DERIVATIVE_STEP),
  );

  return alongSection.cross(alongLength).normalize();
}
