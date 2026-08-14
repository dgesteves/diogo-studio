import { afterEach, describe, expect, it, vi } from "vitest";

import { setTestEnv } from "@tests/env";

import { getSiteUrl } from "./site-url";

vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }));

const DEPLOY_URL = "diogo-studio-git-main.vercel.app";
const PRODUCTION_URL = "diogo.studio";

afterEach(() => {
  setTestEnv();
});

describe("getSiteUrl() precedence", () => {
  it("prefers the explicit app url over anything Vercel injects", () => {
    setTestEnv({
      NEXT_PUBLIC_APP_URL: "https://diogo.studio",
      VERCEL_PROJECT_PRODUCTION_URL: PRODUCTION_URL,
      VERCEL_URL: DEPLOY_URL,
    });

    expect(getSiteUrl()).toBe("https://diogo.studio");
  });

  it("prefers the production domain over the per-deployment url", () => {
    setTestEnv({ VERCEL_PROJECT_PRODUCTION_URL: PRODUCTION_URL, VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${PRODUCTION_URL}`);
  });

  it("falls back to the per-deployment url on a preview build", () => {
    setTestEnv({ VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${DEPLOY_URL}`);
  });

  it("falls back to localhost when nothing is configured", () => {
    setTestEnv();

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("getSiteUrl() normalization", () => {
  it("adds https to a bare host, since Vercel supplies no protocol", () => {
    setTestEnv({ VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${DEPLOY_URL}`);
  });

  it("keeps an explicit protocol, including http for local work", () => {
    setTestEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:4000" });

    expect(getSiteUrl()).toBe("http://localhost:4000");
  });

  it("strips trailing slashes, so callers can concatenate a route safely", () => {
    setTestEnv({ NEXT_PUBLIC_APP_URL: "https://diogo.studio///" });

    expect(getSiteUrl()).toBe("https://diogo.studio");
  });

  it("never ends in a slash, whatever it was given", () => {
    for (const value of ["https://diogo.studio/", `${PRODUCTION_URL}/`, "https://a.b/c/"]) {
      setTestEnv({ NEXT_PUBLIC_APP_URL: value });
      expect(getSiteUrl().endsWith("/")).toBe(false);
    }
  });
});
