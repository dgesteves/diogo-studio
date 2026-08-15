import { describe, expect, it } from "vitest";
import { createStore } from "./store";

describe("createStore", () => {
  it("keeps each store's value to itself", () => {
    const a = createStore(0);
    const b = createStore(0);

    a.set(1);

    expect(a.get()).toBe(1);
    expect(b.get()).toBe(0);
  });

  it("reports the initial value as the server snapshot however far the client has moved", () => {
    const store = createStore({ mode: "night" });

    store.set({ mode: "day" });

    expect(store.get()).toEqual({ mode: "day" });
    expect(store.getServer()).toEqual({ mode: "night" });
  });

  it("notifies subscribers once per real change", () => {
    const store = createStore(false);
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });

    store.set(true);
    store.set(true);
    store.set(false);

    unsubscribe();
    store.set(true);

    expect(calls).toBe(2);
  });

  it("treats an update that returns the previous value as no change", () => {
    const store = createStore({ hovered: "about" });
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });

    // The guard every consumer relies on: a reducer that finds nothing to do returns `prev`,
    // and an identical object literal is still a change because it is a new reference.
    store.update((prev) => (prev.hovered === "about" ? prev : { hovered: "about" }));
    expect(calls).toBe(0);

    store.update((prev) => ({ ...prev }));
    expect(calls).toBe(1);
  });

  it("hands the current value to the updater", () => {
    const store = createStore(1);

    store.update((prev) => prev + 1);
    store.update((prev) => prev * 10);

    expect(store.get()).toBe(20);
  });

  it("stops notifying an unsubscribed listener without disturbing the others", () => {
    const store = createStore(0);
    const seen: string[] = [];
    const unsubscribeFirst = store.subscribe(() => seen.push("first"));
    store.subscribe(() => seen.push("second"));

    store.set(1);
    unsubscribeFirst();
    store.set(2);

    expect(seen).toEqual(["first", "second", "second"]);
  });
});
