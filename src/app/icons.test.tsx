import { describe, expect, it } from "vitest";
import AppleIcon, { contentType as appleType, size as appleSize } from "./apple-icon";
import Icon, { contentType as iconType, size as iconSize } from "./icon";

/**
 * The two favicons, rendered by satori at request time. They run here — `next/og` needs no
 * browser — so the thing worth asserting is the pair that has to agree: the `size` Next reads to
 * write the `<link>` tag, and the dimensions the image is actually rasterized at. Declaring 32×32
 * and painting 180×180 produces a valid page with a blurry icon and no error anywhere.
 *
 * `seo.spec.ts` fetches them through the hashed href the page emits, which is the part only a
 * real request can prove.
 */

/** A PNG starts with a fixed 8-byte signature; the IHDR chunk that follows carries its size. */
function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  expect([...bytes.slice(0, 8)]).toEqual(signature);

  const view = new DataView(bytes.buffer, bytes.byteOffset);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe.each([
  ["icon", Icon, iconSize, iconType],
  ["apple-icon", AppleIcon, appleSize, appleType],
])("%s", (_name, render, size, contentType) => {
  it("declares the PNG content type Next puts on the response", () => {
    expect(contentType).toBe("image/png");
  });

  it("rasterizes a PNG at exactly the size it declares", async () => {
    const response = render();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(contentType);

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(pngSize(bytes)).toEqual(size);
  });
});
