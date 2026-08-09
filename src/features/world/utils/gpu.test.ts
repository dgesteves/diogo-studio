import { describe, expect, it } from "vitest";
import { isSoftwareRenderer } from "./gpu";

/**
 * A false positive here freezes the world for a visitor whose GPU is perfectly capable,
 * which is a far worse failure than a false negative — the frame-budget watchdog still
 * catches anything this misses.
 */
describe("isSoftwareRenderer", () => {
  it.each([
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)",
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "Mesa/X.org, llvmpipe (LLVM 15.0.7, 256 bits)",
    "Google SwiftShader",
    "Microsoft Basic Render Driver",
  ])("flags %s", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(true);
  });

  it.each([
    "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)",
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (AMD, AMD Radeon Pro 5500M OpenGL Engine, OpenGL 4.1)",
    "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "Mali-G78",
    "Adreno (TM) 740",
  ])("leaves %s alone", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(false);
  });

  it("treats an unreadable renderer as hardware rather than punishing it", () => {
    expect(isSoftwareRenderer(null)).toBe(false);
  });
});
