import type * as InspectorStore from "./inspector-overlay-store";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { click, press } from "@tests/interactions";
import {
  InspectorOverlayProvider,
  setInspectorOpen,
  useInspectorOverlay,
} from "./inspector-overlay-store";

/**
 * The Web-Vitals overlay is bound to Ctrl+` and persisted for the session, so a reload does
 * not close it mid-measurement. What matters here is the exact modifier match — Cmd+` cycles
 * macOS windows and must not be swallowed by a debug overlay — and that the persistence
 * both survives a reload and tolerates storage the browser refuses.
 */

const STORAGE_KEY = "studio-inspector-open";

type OverlayHook = () => { open: boolean };

function Probe({ useOverlay = useInspectorOverlay }: { useOverlay?: OverlayHook }): ReactElement {
  const { open } = useOverlay();
  return <p data-testid="state">{open ? "open" : "closed"}</p>;
}

function Controls(): ReactElement {
  const { setOpen, toggle } = useInspectorOverlay();
  return (
    <>
      <Probe />
      <button type="button" onClick={toggle}>
        Toggle the inspector
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Close the inspector
      </button>
    </>
  );
}

function renderOverlay(): UserEvent {
  const user = userEvent.setup();
  render(
    <InspectorOverlayProvider>
      <Controls />
    </InspectorOverlayProvider>,
  );
  return user;
}

function state(): string {
  return screen.getByTestId("state").textContent ?? "";
}

async function freshStore(): Promise<typeof InspectorStore> {
  // `hydrated` latches on the first read, and `resetStores()` has already tripped it on the
  // shared instance before any test here runs.
  vi.resetModules();
  return import("./inspector-overlay-store");
}

describe("inspector overlay store", () => {
  it("toggles on Ctrl+` and closes on Escape", async () => {
    const user = renderOverlay();

    await press(user, "{Control>}`{/Control}");
    expect(state()).toBe("open");

    await press(user, "{Escape}");
    expect(state()).toBe("closed");

    await press(user, "{Control>}`{/Control}");
    await press(user, "{Control>}`{/Control}");
    expect(state()).toBe("closed");
  });

  it("leaves Cmd+`, Alt+` and a bare backtick to the platform", async () => {
    const user = renderOverlay();

    await press(user, "{Meta>}`{/Meta}");
    await press(user, "{Alt>}`{/Alt}");
    await press(user, "`");

    expect(state()).toBe("closed");
  });

  it("stops listening once the provider unmounts", async () => {
    const user = renderOverlay();
    const { unmount } = render(
      <InspectorOverlayProvider>
        <p>second</p>
      </InspectorOverlayProvider>,
    );

    unmount();
    await press(user, "{Control>}`{/Control}");

    // The surviving provider still responds, so a listener left behind by the unmounted one
    // would toggle twice and land back on closed.
    expect(state()).toBe("open");
  });

  it("persists the visitor's choice in both directions", async () => {
    const user = renderOverlay();

    await click(user, /toggle the inspector/i);
    expect(state()).toBe("open");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe("1");

    await click(user, /close the inspector/i);
    expect(state()).toBe("closed");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe("0");
  });

  it("writes nothing when the state has not changed", () => {
    render(<Probe />);

    setInspectorOpen(false);

    // Closed is the initial state, so this must be a no-op rather than a write plus a
    // notification to every subscriber.
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores an overlay that was open before the reload", async () => {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    const store = await freshStore();

    render(<Probe useOverlay={store.useInspectorOverlay} />);

    expect(state()).toBe("open");
  });

  it("stays usable when sessionStorage is unavailable", async () => {
    const denied = new Error("The operation is insecure.");
    // The prototype, not the instance: jsdom's Storage is a proxy that turns an instance
    // property definition into a stored key, so an instance spy silently does nothing and
    // this test could not fail.
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw denied;
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw denied;
    });

    const store = await freshStore();
    render(<Probe useOverlay={store.useInspectorOverlay} />);
    expect(state()).toBe("closed");

    // Wrapped because it notifies the mounted probe: the point is that a failed write does
    // not stop the overlay from opening for this session.
    expect(() => act(() => store.toggleInspector())).not.toThrow();
    expect(state()).toBe("open");

    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("renders closed on the server, so no overlay ships in the HTML", () => {
    setInspectorOpen(true);

    expect(renderToStaticMarkup(<Probe />)).toContain("closed");
  });
});
