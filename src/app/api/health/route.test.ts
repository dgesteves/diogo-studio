import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("answers 200 with JSON", async () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("reports the process as ok, with an uptime and a parseable timestamp", async () => {
    const body = (await GET().json()) as { status: string; uptime: number; timestamp: string };

    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it("exposes nothing beyond those three fields — the endpoint is unauthenticated", async () => {
    expect(Object.keys((await GET().json()) as object)).toEqual(["status", "uptime", "timestamp"]);
  });
});
