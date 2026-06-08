const DEPRECATION_FRAGMENT = "Clock: This module has been deprecated";

const globalsWithFlag = globalThis as typeof globalThis & {
  __r3fClockDeprecationSilenced?: boolean;
};

if (typeof console !== "undefined" && !globalsWithFlag.__r3fClockDeprecationSilenced) {
  globalsWithFlag.__r3fClockDeprecationSilenced = true;
  /* eslint-disable no-console -- intentionally wrapping console.warn to drop one
     upstream deprecation: @react-three/fiber builds THREE.Clock internally (deprecated
     in three r183) and has not migrated to THREE.Timer yet. All other warnings pass. */
  const original = console.warn.bind(console);
  console.warn = (...args: unknown[]): void => {
    if (typeof args[0] === "string" && args[0].includes(DEPRECATION_FRAGMENT)) return;
    original(...args);
  };
  /* eslint-enable no-console */
}
