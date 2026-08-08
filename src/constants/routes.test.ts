import { describe, expect, it } from "vitest";
import { asInternalHref, isRoutePath, routes } from "./routes";

describe("isRoutePath", () => {
  it("accepts every declared route and nothing else", () => {
    for (const path of Object.values(routes)) {
      expect(isRoutePath(path)).toBe(true);
    }
    expect(isRoutePath("/nope")).toBe(false);
    expect(isRoutePath("/work/")).toBe(false);
    expect(isRoutePath("")).toBe(false);
  });
});

describe("asInternalHref", () => {
  it("passes through a real route", () => {
    expect(asInternalHref(routes.work)).toBe(routes.work);
    expect(asInternalHref(routes.home)).toBe(routes.home);
  });

  it("keeps a fragment on a real route", () => {
    expect(asInternalHref("/about#philosophy")).toBe("/about#philosophy");
    expect(asInternalHref("/about#")).toBe("/about#");
  });

  it("rejects an internal-looking href that is not a route", () => {
    expect(asInternalHref("/not-a-page")).toBeNull();
    expect(asInternalHref("/work/2024")).toBeNull();
  });

  it("rejects absolute, protocol-relative and scheme hrefs", () => {
    expect(asInternalHref("https://example.com/about")).toBeNull();
    expect(asInternalHref("//example.com/about")).toBeNull();
    expect(asInternalHref("javascript:alert(1)")).toBeNull();
    expect(asInternalHref("mailto:hi@example.com")).toBeNull();
  });

  it("rejects a bare fragment, which is not a route on its own", () => {
    expect(asInternalHref("#content")).toBeNull();
  });

  it("rejects a query string, since no route declares one", () => {
    expect(asInternalHref("/work?tab=all")).toBeNull();
  });
});
