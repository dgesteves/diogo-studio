/**
 * Start at the cheapest resolution and let `PerformanceMonitor` earn the extra
 * pixels. Booting at the ceiling meant the most expensive frames of the whole
 * session (scene construction + shader warm-up) also rendered the most pixels.
 */
export const DPR_MIN = 1;
export const DPR_MAX = 1.5;

/**
 * Below `DPR_MIN`, used only once `WorldQualityGuard` has proven the device cannot hold
 * a frame rate. A quarter of the pixels is worth more than the sharpness at that point.
 */
export const DPR_DEGRADED = 0.5;

/** MIP levels for the bloom chain; each level costs a down- and an up-pass. */
export const BLOOM_LEVELS = 6;

export function dprForFactor(factor: number): number {
  const dpr = DPR_MIN + (DPR_MAX - DPR_MIN) * factor;
  return Math.round(dpr * 10) / 10;
}
