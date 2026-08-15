/**
 * The two brand hexes that have to exist in TypeScript rather than in CSS.
 *
 * They mirror `--brand-cyan` and `--brand-edge` in `globals.css`, which is where every DOM
 * surface reads them from. These copies exist for the three consumers that render pixels
 * outside a stylesheet's reach — the two `ImageResponse` icons and the portrait engine's
 * tint — plus `world/materials.ts`, which builds the room's three.js tokens on the accent.
 */
export const brand = {
  accent: "#22d3ee",
  edge: "#262b33",
} as const;
