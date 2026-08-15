import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIsClient } from "./use-is-client";

function Probe(): ReactElement {
  return <p>{useIsClient() ? "client" : "server"}</p>;
}

describe("useIsClient", () => {
  it("renders the server branch during SSR and the client branch after mount", () => {
    // The whole point of the hook is that both renders agree at hydration time: it must
    // report false in the server pass, so a canvas-or-fallback decision cannot produce a
    // hydration mismatch. Asserting it any other way asserts nothing.
    expect(renderToStaticMarkup(<Probe />)).toBe("<p>server</p>");

    render(<Probe />);
    expect(screen.getByText("client")).toBeInTheDocument();
  });
});
