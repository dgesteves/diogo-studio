import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * A CSS animation that sets `opacity` in its keyframes says nothing about what the
 * element looks like when the animation is not applying — and the default is `1`. Any
 * frame painted before the animation takes effect, which is every fresh mount, shows the
 * element at full opacity.
 *
 * That is not theoretical: it flashed the boot screen's sun at 1.6x its brightest
 * animated value and would have shown `.boot-crt` — a full-screen white grid at
 * `mix-blend-mode: overlay` whose `0%` is `0.035` — at 28x. It also decides the resting
 * state under `prefers-reduced-motion`, where this stylesheet cuts every animation to
 * 0.001ms and the element then reverts to its static value.
 *
 * So: if a rule's animation touches opacity, the rule either declares its own resting
 * opacity or uses a `both`/`backwards` fill mode, which applies the first keyframe up
 * front and makes the static value unreachable.
 */

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

/** Every `@keyframes` block, as `name` -> the properties its keyframes set. */
function keyframeProperties(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  const pattern = /@keyframes\s+([\w-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const [, name = ""] = match;
    // Walk braces from the opening one to find the block's real end.
    let depth = 0;
    let i = pattern.lastIndex - 1;
    const start = i;
    do {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    } while (depth > 0 && i < css.length);
    const properties = new Set<string>();
    for (const [, property] of css.slice(start, i).matchAll(/(?:^|[\s;{])([\w-]+)\s*:/g)) {
      if (property !== undefined) properties.add(property);
    }
    found.set(name, properties);
  }
  return found;
}

/** `name` -> whether any keyframe in it sets `opacity`. */
function keyframesTouchingOpacity(): Set<string> {
  const found = new Set<string>();
  for (const [name, properties] of keyframeProperties()) {
    if (properties.has("opacity")) found.add(name);
  }
  return found;
}

/** Every rule that names an animation, with the declarations in its own block. */
function rulesWithAnimations(): { selector: string; body: string; animation: string }[] {
  const rules: { selector: string; body: string; animation: string }[] = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const [, rawSelector = "", body = ""] = match;
    const animation = /(^|[\s;])animation\s*:\s*([\w-]+)/.exec(body)?.[2];
    if (animation === undefined) continue;
    const selector = rawSelector.trim().split("\n").at(-1)?.trim() ?? "";
    rules.push({ selector, body, animation });
  }
  return rules;
}

describe("globals.css", () => {
  it("gives every opacity-animated rule a resting opacity", () => {
    const animated = keyframesTouchingOpacity();
    expect(animated.size).toBeGreaterThan(0);

    const offenders = rulesWithAnimations()
      .filter((rule) => animated.has(rule.animation))
      .filter((rule) => !/(^|[\s;])opacity\s*:/.test(rule.body))
      .filter((rule) => !/\b(both|backwards)\b/.test(rule.body))
      .map((rule) => `${rule.selector} (animation: ${rule.animation})`);

    expect(offenders).toEqual([]);
  });

  /**
   * `opacity` and `transform` are the two properties the compositor can animate on its own.
   * Everything else — `background-position`, `background-size`, a custom property feeding a
   * gradient — is a *paint* animation: the browser redraws the element on the main thread on
   * every frame the animation runs, for as long as it runs.
   *
   * That is what made this boot screen strobe. Traced with `Tracing.start` at 2048x1032 on a
   * DPR-2 display, four rules were repainting every frame — `.scene-grid` (twice: the gate's
   * backdrop and `WorldFallback` behind it, 9.2 megapixels each and invalidating with an
   * unbounded clip), `.boot-motes` (a full viewport), `.boot-fill` and `.boot-cta-frame`.
   * Around 35 megapixels a frame, scaling with the viewport, which is why it showed on wide
   * screens and hid behind an open DevTools panel. When a raster misses its deadline the
   * compositor draws the layers that *are* ready over the ones that are not, so the sun and
   * the horizon rule painted at the wrong moment of their pulse and the preference row did
   * not paint at all. 1118 paint records in three seconds became 12.
   *
   * A discrete timing function is the exception and is checked rather than assumed: `steps()`
   * changes the value a fixed number of times per cycle, not once per frame, so `.boot-glitch`
   * may animate `clip-path`.
   */
  it("animates nothing the compositor would have to repaint for", () => {
    const COMPOSITED = new Set(["opacity", "transform", "translate", "rotate", "scale"]);
    const properties = keyframeProperties();
    expect(properties.size).toBeGreaterThan(0);

    const offenders = rulesWithAnimations()
      .filter((rule) => !/\bsteps\(/.test(rule.body))
      .flatMap((rule) =>
        [...(properties.get(rule.animation) ?? [])]
          .filter((property) => !COMPOSITED.has(property))
          .map(
            (property) => `${rule.selector} animates ${property} (@keyframes ${rule.animation})`,
          ),
      );

    expect(offenders).toEqual([]);
  });
});
