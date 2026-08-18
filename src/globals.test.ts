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

/** `name` -> whether any keyframe in it sets `opacity`. */
function keyframesTouchingOpacity(): Set<string> {
  const found = new Set<string>();
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
    if (/(^|[\s;{])opacity\s*:/.test(css.slice(start, i))) found.add(name);
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
});
