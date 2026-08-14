import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setTestEnv } from "@tests/env";
import { routes } from "@/content/pages";

import robots from "./robots";
import sitemap from "./sitemap";

const { cacheLife } = vi.hoisted(() => ({ cacheLife: vi.fn() }));

vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }));
// `cacheLife()` throws outside a Next build ("only available with the `cacheComponents`
// config"), so the profile is asserted through the mock rather than its effect.
vi.mock("next/cache", () => ({ cacheLife }));

const SITE_URL = "https://diogo.studio";

beforeEach(() => {
  setTestEnv({ NEXT_PUBLIC_APP_URL: SITE_URL });
});

afterEach(() => {
  setTestEnv();
  vi.clearAllMocks();
});

describe("sitemap", () => {
  it("lists every route exactly once, and nothing else", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const expected = Object.values(routes).map((path) => `${SITE_URL}${path}`);

    expect([...urls].sort()).toEqual([...expected].sort());
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("builds absolute urls on the configured site url", async () => {
    const entries = await sitemap();

    expect(entries.every((entry) => entry.url.startsWith(`${SITE_URL}/`))).toBe(true);
  });

  it("ranks the home page above the stations and crawls it more often", async () => {
    const entries = await sitemap();
    const home = entries.find((entry) => entry.url === `${SITE_URL}/`);

    expect(home).toMatchObject({ priority: 1, changeFrequency: "weekly" });
  });

  it("gives every station the same lower priority and cadence", async () => {
    const stations = (await sitemap()).filter((entry) => entry.url !== `${SITE_URL}/`);

    expect(stations.length).toBe(Object.values(routes).length - 1);
    expect(stations.every((entry) => entry.priority === 0.7)).toBe(true);
    expect(stations.every((entry) => entry.changeFrequency === "monthly")).toBe(true);
  });

  it("stamps one deploy-time timestamp across every entry", async () => {
    const stamps = new Set((await sitemap()).map((entry) => String(entry.lastModified)));

    expect(stamps.size).toBe(1);
  });

  it("stays statically rendered by caching for the longest profile", async () => {
    await sitemap();

    expect(cacheLife).toHaveBeenCalledWith("max");
  });
});

describe("robots", () => {
  it("lets every crawler read the site", () => {
    expect(robots().rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
  });

  it("points at the sitemap with an absolute url", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
