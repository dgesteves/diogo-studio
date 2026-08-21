"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/content/profile";

/**
 * The studio's own clock, to the minute — read by the two devices lying on the desk. Two
 * clocks in one room disagreeing is a defect rather than a detail, so the zone, the formats
 * and the tick live here rather than beside either screen.
 *
 * The terminal on the center monitor keeps its own pair of formatters, because it counts in
 * seconds and abbreviates its date; it reads the same `siteConfig.timeZone` this does.
 */

const STUDIO_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const STUDIO_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  weekday: "long",
  month: "long",
  day: "numeric",
});

/**
 * Checked twice a minute, and the check is what decides whether anything is repainted: a tick
 * landing inside the minute already drawn returns the timestamp it was given, which is the
 * same value, which is where React stops. Neither device shows seconds, and each of their
 * screens is well over a megabyte of texture — re-uploading one every second to redraw four
 * glyphs that did not move would be the whole cost of the object for none of its picture.
 */
const TICK_MS = 30_000;

export type StudioTime = {
  readonly clock: string;
  readonly date: string;
};

export function useStudioMinute(): StudioTime {
  const [minute, setMinute] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      // The minute is the state, so a tick inside the one already drawn stops here rather
      // than at a canvas: `set` on an unchanged string is what React bails out of.
      setMinute((last) =>
        STUDIO_CLOCK.format(last) === STUDIO_CLOCK.format(Date.now()) ? last : Date.now(),
      );
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return { clock: STUDIO_CLOCK.format(minute), date: STUDIO_DATE.format(minute) };
}
