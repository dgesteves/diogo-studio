"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { siteConfig } from "@/config/site";

const SEQUENCE = "diogo";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

export function EasterEgg(): ReactElement | null {
  const { reducedMotion } = useReducedMotionPreference();
  const [active, setActive] = useState(false);
  const bufferRef = useRef("");
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1) return;
      if (isEditableTarget(event.target)) return;
      bufferRef.current = (bufferRef.current + event.key.toLowerCase()).slice(-SEQUENCE.length);
      if (bufferRef.current === SEQUENCE) {
        bufferRef.current = "";
        setActive(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!active) return;

    if (reducedMotion) {
      const timeout = window.setTimeout(() => setActive(false), 3200);
      return () => window.clearTimeout(timeout);
    }

    const el = glowRef.current;
    if (!el) {
      setActive(false);
      return;
    }
    const animation = el.animate(
      [
        { opacity: 0, transform: "scale(0.4)" },
        { opacity: 0.95, transform: "scale(1)", offset: 0.15 },
        { opacity: 0.95, transform: "scale(1.05)", offset: 0.8 },
        { opacity: 0, transform: "scale(1.5)" },
      ],
      { duration: 3400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    animation.onfinish = () => setActive(false);
    animation.oncancel = () => setActive(false);
    return () => animation.cancel();
  }, [active, reducedMotion]);

  if (!active) return null;

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-60 grid place-items-center"
      >
        <span className="border-accent/40 bg-surface text-accent rounded-full border px-4 py-2 font-mono text-xs tracking-wider uppercase shadow-lg">
          Hi, I&rsquo;m {siteConfig.name.split(" ")[0]}
        </span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-60 grid place-items-center overflow-hidden"
    >
      <div ref={glowRef} className="relative grid place-items-center" style={{ opacity: 0 }}>
        <div
          className="size-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent) 0%, transparent 60%)",
            boxShadow: "0 0 120px 40px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        />
        <span className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-sm tracking-[0.3em] uppercase">
          diogo.studio
        </span>
      </div>
    </div>
  );
}
