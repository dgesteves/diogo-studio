"use client";

import { type RouteKey, stationIndex } from "@/content/pages";
import { type Vec3, type WorldStation } from "@/world/stations";
import { WALL_SCREEN, WALL_SCREEN_Z } from "@/world/room";
import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  AdditiveBlending,
  type Mesh,
  type MeshBasicMaterial,
  Color,
  type PointLight,
} from "three";
import { type ReactElement, type Ref, useRef, useState, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { getStation, useHoveredStation } from "./stations";
import { registerHotspot, unregisterHotspot } from "./interact";

/**
 * What makes a piece of furniture a destination: the volume that is pickable, the glow under
 * it, the label above it, and the light that comes up when it is focused. One file because a
 * hotspot is one affordance — a reader looking for "why is the bookshelf clickable" should
 * not have to open six.
 */

export const FOCUS_FADE_RATE = 12;
export const FOCUS_LIGHT_INTENSITY = 1.4;
export const FOCUS_LIGHT_DISTANCE = 2.4;
export const FOCUS_GLOW_OPACITY = 0.6;
export const FOCUS_UNMOUNT_THRESHOLD = 0.012;

export type HotspotVolume =
  | { center: Vec3; size: Vec3; glow: "floor"; groundY: number }
  | { center: Vec3; size: Vec3; glow: "wall" };

const FLOOR_Y = 0.02;
const DESK_Y = 0.74;
const WALL_X = WALL_SCREEN.x;
const WALL_Y = WALL_SCREEN.y;
const WALL_SIZE = [0.12, 0.74, 0.58] as const satisfies Vec3;

export const furnitureHotspots = {
  about: { center: [0, 1.2, -0.34], size: [1.1, 0.7, 0.22], glow: "floor", groundY: FLOOR_Y },
  work: { center: [-1.044, 1.2, -0.262], size: [1.15, 0.7, 0.32], glow: "floor", groundY: FLOOR_Y },
  projects: {
    center: [1.044, 1.2, -0.262],
    size: [1.15, 0.7, 0.32],
    glow: "floor",
    groundY: FLOOR_Y,
  },
  writing: { center: [-2.18, 1.15, 3.7], size: [0.4, 2.3, 1.15], glow: "floor", groundY: FLOOR_Y },
  speaking: { center: [1.38, 0.9, -0.1], size: [0.3, 0.55, 0.3], glow: "floor", groundY: FLOOR_Y },
  openSource: {
    center: [3.6, 1.5, -2.25],
    size: [1.8, 1.1, 0.5],
    glow: "floor",
    groundY: FLOOR_Y,
  },
  lab: { center: [-1.8, 0.5, 1.4], size: [0.75, 1.05, 0.75], glow: "floor", groundY: FLOOR_Y },
  caseStudies: {
    center: [-0.6, 0.8, 0.34],
    size: [0.28, 0.16, 0.38],
    glow: "floor",
    groundY: DESK_Y,
  },
  now: { center: [0.95, 0.8, 0.3], size: [0.18, 0.2, 0.18], glow: "floor", groundY: DESK_Y },
  contact: {
    center: [-2.25, 1.05, 2.4],
    size: [0.16, 2.0, 0.95],
    glow: "floor",
    groundY: FLOOR_Y,
  },
  uses: { center: [0, 0.78, 0.32], size: [0.7, 0.16, 0.34], glow: "floor", groundY: DESK_Y },
  resume: { center: [WALL_X, WALL_Y, WALL_SCREEN_Z.resume], size: WALL_SIZE, glow: "wall" },
  timeline: { center: [WALL_X, WALL_Y, WALL_SCREEN_Z.timeline], size: WALL_SIZE, glow: "wall" },
  principles: { center: [WALL_X, WALL_Y, WALL_SCREEN_Z.principles], size: WALL_SIZE, glow: "wall" },
  stack: { center: [WALL_X, WALL_Y, WALL_SCREEN_Z.stack], size: WALL_SIZE, glow: "wall" },
  playground: { center: [WALL_X, WALL_Y, WALL_SCREEN_Z.playground], size: WALL_SIZE, glow: "wall" },
} as const satisfies Partial<Record<RouteKey, HotspotVolume>>;

type FurnitureRoute = keyof typeof furnitureHotspots;

export function isFurnitureRoute(slug: RouteKey): slug is FurnitureRoute {
  return slug in furnitureHotspots;
}

const TEXTURE_SIZE = 256;

let cached: CanvasTexture | null = null;

export function createRadialGlowTexture(): CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const half = TEXTURE_SIZE / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  cached = texture;
  return texture;
}

type NeonLabelProps = {
  position: [number, number, number];
  accent: string;
  label: string;
  ref?: Ref<HTMLSpanElement>;
};

export function NeonLabel({ position, accent, label, ref }: NeonLabelProps): ReactElement {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[0, 0]}>
      <span
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none font-mono text-[11px] font-medium tracking-[0.18em] whitespace-nowrap uppercase"
        style={{
          color: accent,
          textShadow: `0 0 10px ${accent}, 0 0 22px ${accent}`,
          opacity: 0,
          willChange: "opacity, transform",
        }}
      >
        {label}
      </span>
    </Html>
  );
}

type HotspotGlowProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  accent: string;
  ref?: Ref<Mesh>;
};

export function HotspotGlow({
  position,
  rotation,
  size,
  accent,
  ref,
}: HotspotGlowProps): ReactElement {
  const texture = createRadialGlowTexture();
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        color={accent}
        transparent
        opacity={0.6}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

type HotspotFocusProps = {
  focus: boolean;
  accent: string;
  label: string;
  glowPosition: [number, number, number];
  glowRotation: [number, number, number];
  glowSize: number;
  labelPosition: [number, number, number];
};

export function HotspotFocus(props: HotspotFocusProps): ReactElement | null {
  const { focus, accent, label } = props;
  const [mounted, setMounted] = useState(focus);
  const amount = useRef(0);
  const glowRef = useRef<Mesh>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useFrame(({ clock }, delta) => {
    if (focus && !mounted) setMounted(true);
    amount.current += ((focus ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * FOCUS_FADE_RATE));
    const a = amount.current;

    const glow = glowRef.current;
    if (glow) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.03 * a;
      glow.scale.setScalar((0.88 + 0.12 * a) * pulse);
      (glow.material as MeshBasicMaterial).opacity = FOCUS_GLOW_OPACITY * a;
    }
    const span = labelRef.current;
    if (span) {
      span.style.opacity = String(a);
      span.style.transform = `translateY(${(1 - a) * 6}px)`;
    }

    if (!focus && a < FOCUS_UNMOUNT_THRESHOLD && mounted) setMounted(false);
  });

  if (!mounted) return null;

  return (
    <>
      <HotspotGlow
        ref={glowRef}
        position={props.glowPosition}
        rotation={props.glowRotation}
        size={props.glowSize}
        accent={accent}
      />
      <NeonLabel ref={labelRef} position={props.labelPosition} accent={accent} label={label} />
    </>
  );
}

/**
 * A hotspot's glow light is mounted here permanently rather than inside
 * `HotspotFocus`. Mounting a light on hover changes `NUM_POINT_LIGHTS`, which
 * rewrites every material's program key and forces three.js to relink every
 * shader in the scene (~47 programs) — and to drop them again on un-hover, so
 * the stall repeats on every single hover. Keeping the count constant and only
 * animating uniforms costs nothing.
 */
export function HotspotFocusLight({ slug }: { slug: RouteKey | null }): ReactElement {
  const lightRef = useRef<PointLight>(null);
  const amount = useRef(0);
  const accent = useRef(new Color());

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light) return;

    if (slug) {
      const station = getStation(slug);
      light.position.set(...station.anchor);
      accent.current.set(station.accent);
      light.color.copy(accent.current);
    }

    amount.current += ((slug ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * FOCUS_FADE_RATE));
    light.intensity = FOCUS_LIGHT_INTENSITY * amount.current;
  });

  return <pointLight ref={lightRef} intensity={0} distance={FOCUS_LIGHT_DISTANCE} decay={2} />;
}

const GLOW_SPREAD = 1.6;
const GLOW_PADDING = 0.18;
const WALL_GLOW_OFFSET = 0.02;
const LABEL_GAP = 0.16;

type FurnitureHotspotProps = {
  station: WorldStation;
  hotspot: HotspotVolume;
  label: string;
  active: boolean;
};

export function FurnitureHotspot({
  station,
  hotspot,
  label,
  active,
}: FurnitureHotspotProps): ReactElement {
  const meshRef = useRef<Mesh>(null);
  const hovered = useHoveredStation() === station.slug;
  const focus = hovered || active;
  const [cx, cy, cz] = hotspot.center;
  const [sx, sy, sz] = hotspot.size;
  const [ax, ay, az] = station.anchor;
  const isWall = hotspot.glow === "wall";
  const floorY = hotspot.glow === "wall" ? 0 : hotspot.groundY;
  const glowSize = (isWall ? Math.max(sy, sz) : Math.max(sx, sz)) * GLOW_SPREAD + GLOW_PADDING;
  const glowPosition: [number, number, number] = isWall
    ? [cx + WALL_GLOW_OFFSET, cy, cz]
    : [cx, floorY, cz];
  const glowRotation: [number, number, number] = isWall
    ? [0, WALL_SCREEN.rotationY, 0]
    : [-Math.PI / 2, 0, 0];
  const labelPosition: [number, number, number] = isWall
    ? [cx, cy + sy / 2 + LABEL_GAP, cz]
    : [ax, ay + 0.24, az];

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.userData.hotspotSlug = station.slug;
    registerHotspot(mesh);
    return () => unregisterHotspot(mesh);
  }, [station.slug]);

  return (
    <group>
      <mesh ref={meshRef} position={[cx, cy, cz]} visible={false}>
        <boxGeometry args={[sx, sy, sz]} />
      </mesh>

      <HotspotFocus
        focus={focus}
        accent={station.accent}
        label={label}
        glowPosition={glowPosition}
        glowRotation={glowRotation}
        glowSize={glowSize}
        labelPosition={labelPosition}
      />
    </group>
  );
}

export function WorldPortals({ active }: { active: RouteKey }): ReactElement {
  const hovered = useHoveredStation();

  return (
    <>
      <HotspotFocusLight slug={hovered} />
      <HotspotFocusLight slug={isFurnitureRoute(active) ? active : null} />

      {stationIndex.map((destination) => {
        if (!isFurnitureRoute(destination.slug)) return null;
        return (
          <FurnitureHotspot
            key={destination.slug}
            station={getStation(destination.slug)}
            hotspot={furnitureHotspots[destination.slug]}
            label={destination.label}
            active={active === destination.slug}
          />
        );
      })}
    </>
  );
}
