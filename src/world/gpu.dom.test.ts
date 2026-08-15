import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The probe that runs before the canvas chunk mounts, so the world can start at a lower
 * tier instead of making the visitor sit through the most expensive frames of the session
 * first. `isSoftwareRenderer` — the string rule it decides with — is a node spec; what
 * needs a document is how the answer is obtained and what it costs.
 */

const UNMASKED_RENDERER_WEBGL = 0x9246;
const RENDERER = 0x1f01;

type GlStub = {
  gl: WebGL2RenderingContext;
  loseContextCalls: number;
  contexts: string[];
};

function stubWebGL({
  unmasked,
  masked = "WebKit WebGL",
  debugInfo = true,
  available = true,
}: {
  unmasked?: string;
  masked?: string | null;
  debugInfo?: boolean;
  available?: boolean;
}): GlStub {
  const stub: GlStub = { gl: null as never, loseContextCalls: 0, contexts: [] };

  const gl = {
    RENDERER,
    getExtension(name: string): unknown {
      if (name === "WEBGL_debug_renderer_info") {
        return debugInfo ? { UNMASKED_RENDERER_WEBGL } : null;
      }
      if (name === "WEBGL_lose_context") {
        return {
          loseContext: () => {
            stub.loseContextCalls += 1;
          },
        };
      }
      return null;
    },
    getParameter(parameter: number): unknown {
      return parameter === UNMASKED_RENDERER_WEBGL ? unmasked : masked;
    },
  };

  stub.gl = gl as unknown as WebGL2RenderingContext;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((id: string) => {
    stub.contexts.push(id);
    return available && id !== "2d" ? stub.gl : null;
  }) as HTMLCanvasElement["getContext"]);

  return stub;
}

async function detect(): Promise<boolean> {
  vi.resetModules();
  const { detectSoftwareRenderer } = await import("./gpu");
  return detectSoftwareRenderer();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("detectSoftwareRenderer", () => {
  it("reads the unmasked renderer, which is where a CPU rasterizer names itself", async () => {
    stubWebGL({ unmasked: "Google SwiftShader", masked: "WebKit WebGL" });

    expect(await detect()).toBe(true);
  });

  it("leaves a real GPU at full quality", async () => {
    stubWebGL({ unmasked: "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro)" });

    expect(await detect()).toBe(false);
  });

  it("falls back to the masked renderer when the debug extension is withheld", async () => {
    // Firefox with `privacy.resistFingerprinting`, and Safari, both refuse the extension.
    stubWebGL({ debugInfo: false, masked: "llvmpipe (LLVM 15.0.7, 256 bits)" });

    expect(await detect()).toBe(true);
  });

  it("treats a renderer name it cannot read as hardware", async () => {
    stubWebGL({ debugInfo: false, masked: null });

    expect(await detect()).toBe(false);
  });

  it("does not degrade the world when WebGL is unavailable altogether", async () => {
    // Nothing to downgrade: `WorldStage` shows the fallback instead of a canvas.
    const stub = stubWebGL({ available: false });

    expect(await detect()).toBe(false);
    expect(stub.contexts).toEqual(["webgl2", "webgl"]);
  });

  it("hands the throwaway context back, so the world's own canvas can still get one", async () => {
    const stub = stubWebGL({ unmasked: "Google SwiftShader" });

    await detect();

    expect(stub.loseContextCalls).toBe(1);
  });

  it("probes once and reuses the answer for the rest of the session", async () => {
    const stub = stubWebGL({ unmasked: "Google SwiftShader" });
    vi.resetModules();
    const { detectSoftwareRenderer } = await import("./gpu");

    expect(detectSoftwareRenderer()).toBe(true);
    expect(detectSoftwareRenderer()).toBe(true);

    expect(stub.contexts).toEqual(["webgl2"]);
  });
});
