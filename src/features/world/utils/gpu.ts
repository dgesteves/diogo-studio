/**
 * Chrome falls back to a CPU rasterizer (SwiftShader) whenever the GPU is unavailable or
 * blocklisted — old drivers, VMs, headless CI, some enterprise fleets. It reports itself
 * through the unmasked renderer string, so the decision to stop paying for an expensive
 * scene can be made before the first frame is ever drawn, rather than after the visitor
 * has sat through one.
 */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function isSoftwareRenderer(renderer: string | null): boolean {
  return renderer !== null && SOFTWARE_RENDERERS.test(renderer);
}

export function readRendererName(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): string | null {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const unmasked = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL as number)
    : gl.getParameter(gl.RENDERER);

  return typeof unmasked === "string" ? unmasked : null;
}

let probed: boolean | null = null;

/**
 * Probes a throwaway context so the answer is known *before* the scene mounts. Asking
 * from inside the canvas is too late: the first frames are the most expensive of the
 * session, and on a CPU rasterizer they have been measured at ~5s each — long enough to
 * drop clicks and keystrokes while the scene works out that it cannot cope.
 */
export function detectSoftwareRenderer(): boolean {
  if (probed !== null) return probed;
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  probed = gl ? isSoftwareRenderer(readRendererName(gl)) : false;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();

  return probed;
}
