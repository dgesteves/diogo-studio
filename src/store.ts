/**
 * The one external-store factory. Every client signal in `src/` is built from this and read
 * through `useSyncExternalStore`; there is no store library, and adding one needs a
 * `docs/decisions.md` entry.
 *
 * `set` and `update` are separate rather than one overloaded setter, so nothing has to ask
 * whether a value is a reducer — a question that has no honest answer once `T` may itself be
 * a function.
 */

export type Store<T> = {
  get: () => T;
  /**
   * The value React renders on the server and hydrates against, which for every signal here
   * is the one it starts at — a store the server cannot observe has no other truthful answer.
   */
  getServer: () => T;
  set: (next: T) => void;
  update: (next: (prev: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  function commit(next: T): void {
    // Pointer moves, frame callbacks and media queries write these stores far more often than
    // they change them, so an unguarded emit re-renders the HUD on noise. Returning `prev`
    // from `update` is how a caller says "nothing moved".
    if (Object.is(next, value)) return;
    value = next;
    for (const listener of listeners) listener();
  }

  return {
    get: () => value,
    getServer: () => initial,
    set: commit,
    update: (next) => commit(next(value)),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
