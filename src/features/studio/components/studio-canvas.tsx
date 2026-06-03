"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  OrthographicCamera,
  Preload,
  RoundedBox,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { PerfReporter } from "@/components/r3f/perf-reporter";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";
import { useCenterScreenTexture, useLeftScreenTexture, useRightScreenTexture } from "./screens";

/**
 * Studio R3F canvas — desk + monitors + chair + desk props.
 *
 * Composition:
 *   - Orthographic camera at an isometric-ish angle.
 *   - A matte floor with a wireframe grid overlay.
 *   - A matte desk with four legs and a cyan accent strip along the front.
 *   - Three monitors in a slight arc, each showing a canvas-texture screen
 *     (terminal log / code editor / metrics dashboard) that picks up the
 *     bloom pass so the cyan text glows.
 *   - Desk props: detailed keyboard, mouse, coffee mug, plant in pot,
 *     a small notebook, and two flanking speakers.
 *   - An abstract chair silhouette in front of the desk.
 *
 * Perf budget (after the hero perf fixes):
 *   - dpr cap 1.25, AdaptiveDpr safety net
 *   - postprocessing: bloom + vignette only (no raymarched shaders here)
 *   - Geometry total: ~90 primitives, all static
 */

export function StudioCanvas({
  containerRef,
  onReady,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
    >
      <WebGLContextGuard />
      <PerfReporter />

      <OrthographicCamera
        makeDefault
        // Closer + tighter zoom so the rig fills more of the frame.
        position={[3.3, 2.6, 4.0]}
        zoom={180}
        near={0.1}
        far={50}
      />

      <Lighting />
      <CameraIdle containerRef={containerRef} />

      <Suspense fallback={null}>
        <GridFloor />
        <Desk />
        <Chair />
        <DeskProps />
        <Speakers />
        <MonitorRig />
      </Suspense>

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom intensity={0.65} luminanceThreshold={0.5} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.32} darkness={0.55} eskil={false} />
      </EffectComposer>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}

/* ---------------------------------------------------------------------------
 * Lighting
 * ------------------------------------------------------------------------- */

function Lighting() {
  return (
    <>
      {/* Bright ambient so the matte black surfaces actually read as
          objects rather than silhouettes. */}
      <ambientLight intensity={0.55} />
      {/* Warm key light above-front. */}
      <directionalLight position={[3, 5, 3]} intensity={1.15} color="#f6efe1" />
      {/* Cyan fill from below-back simulating monitor bounce. */}
      <pointLight position={[0, 0.6, -1.2]} intensity={0.9} decay={2} color="#22d3ee" />
      {/* Soft rim from the right. */}
      <pointLight position={[2.4, 1.6, 0.6]} intensity={0.35} decay={2} color="#7dd3fc" />
      {/* Tiny under-desk glow from the front accent strip. */}
      <pointLight position={[0, 0.5, 0.65]} intensity={0.3} decay={2} color="#22d3ee" />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Camera idle — very slow drift + tiny scroll-driven dolly.
 * ------------------------------------------------------------------------- */

function CameraIdle({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const target = useRef(new THREE.Vector3());
  const base = useRef<THREE.Vector3 | null>(null);
  const scrollProgress = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    if (!base.current) base.current = camera.position.clone();
    if (!base.current) return;

    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const traveled = Math.max(0, -rect.top + viewportH * 0.4);
      const distance = Math.max(1, rect.height + viewportH * 0.4);
      scrollProgress.current = Math.min(1, Math.max(-0.2, traveled / distance));
    }

    const t = clock.elapsedTime;
    const orbit = Math.sin(t * 0.08) * 0.18;
    const orbitY = Math.cos(t * 0.06) * 0.08;
    const p = scrollProgress.current;

    target.current.set(
      base.current.x + orbit - p * 0.4,
      base.current.y + orbitY + p * 0.12,
      base.current.z + p * 0.2,
    );

    const lerp = 1 - Math.exp(-delta * 3);
    camera.position.lerp(target.current, lerp);
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}

/* ---------------------------------------------------------------------------
 * Floor — matte plane + two grid overlays for layered depth.
 * ------------------------------------------------------------------------- */

function GridFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#070b0e" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[16, 32, "#1a2530", "#0e1620"]} position={[0, 0.001, 0]} />
      <gridHelper args={[5, 20, "#1a2a36", "#0b141d"]} position={[0, 0.002, 0]} />
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Desk — rounded slab + four legs + a thin cyan accent strip.
 * ------------------------------------------------------------------------- */

function Desk() {
  return (
    <group position={[0, 0.5, 0]}>
      {/* Top */}
      <RoundedBox args={[2.6, 0.06, 1.1]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#0d1216" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      {/* Front accent strip — hovers just above the surface */}
      <mesh position={[0, 0.005, 0.555]}>
        <boxGeometry args={[2.4, 0.006, 0.006]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      {/* Legs */}
      {(
        [
          [-1.18, -0.45],
          [1.18, -0.45],
          [-1.18, 0.45],
          [1.18, 0.45],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.25, z]}>
          <cylinderGeometry args={[0.028, 0.028, 0.5, 10]} />
          <meshStandardMaterial color="#13181d" roughness={0.65} metalness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Chair — abstract silhouette.
 * ------------------------------------------------------------------------- */

function Chair() {
  return (
    <group position={[0, 0, 0.95]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.025, 24]} />
        <meshStandardMaterial color="#13181d" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.26, 12]} />
        <meshStandardMaterial color="#1c242b" roughness={0.5} metalness={0.5} />
      </mesh>
      <RoundedBox args={[0.5, 0.06, 0.46]} radius={0.03} smoothness={2} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.6, 0.06]} radius={0.05} smoothness={2} position={[0, 0.66, 0.22]}>
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Desk props — keyboard, mouse, coffee mug, plant, notebook.
 * The desk surface is at y = 0.53 (top of the desk slab).
 * ------------------------------------------------------------------------- */

const DESK_TOP_Y = 0.53;

function DeskProps() {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <CoffeeMug />
      <PlantPot />
      <Notebook />
    </group>
  );
}

function Keyboard() {
  // Wider, more detailed keyboard. Recessed dark "deck" suggests keys
  // without paying for 80+ mesh draw calls; a cyan strip across the back
  // sells the "backlit" detail.
  return (
    <group position={[-0.15, DESK_TOP_Y + 0.011, 0.3]}>
      {/* Body */}
      <RoundedBox args={[1.05, 0.022, 0.32]} radius={0.008} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      {/* Recessed key deck */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.98, 0.004, 0.26]} />
        <meshStandardMaterial color="#040608" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Suggested key rows — three thin horizontal lines lighter than the deck */}
      {[-0.08, -0.02, 0.04, 0.1].map((z, i) => (
        <mesh key={i} position={[0, 0.0144, z]}>
          <boxGeometry args={[0.92, 0.0015, 0.005]} />
          <meshStandardMaterial color="#1a2530" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* Backlit cyan strip across the rear edge of the deck */}
      <mesh position={[0, 0.0155, -0.13]}>
        <boxGeometry args={[0.92, 0.001, 0.005]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      {/* Spacebar suggestion */}
      <mesh position={[0, 0.0146, 0.105]}>
        <boxGeometry args={[0.36, 0.002, 0.026]} />
        <meshStandardMaterial color="#1a2530" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Mouse() {
  return (
    <group position={[0.72, DESK_TOP_Y + 0.013, 0.3]}>
      <RoundedBox args={[0.085, 0.026, 0.135]} radius={0.014} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      {/* Scroll wheel */}
      <mesh position={[0, 0.0145, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.022, 10]} />
        <meshStandardMaterial color="#1a2530" roughness={0.45} metalness={0.7} />
      </mesh>
      {/* Underside cyan LED hint */}
      <mesh position={[0, -0.012, 0.0]}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

function CoffeeMug() {
  return (
    <group position={[1.02, DESK_TOP_Y, 0.05]}>
      {/* Mug body */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.05, 0.044, 0.12, 24]} />
        <meshStandardMaterial color="#1a2a36" roughness={0.4} metalness={0.45} />
      </mesh>
      {/* Coffee surface */}
      <mesh position={[0, 0.119, 0]}>
        <cylinderGeometry args={[0.043, 0.043, 0.004, 24]} />
        <meshStandardMaterial color="#1a0c04" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Inner rim shadow */}
      <mesh position={[0, 0.121, 0]}>
        <torusGeometry args={[0.044, 0.005, 8, 24]} />
        <meshStandardMaterial color="#0a0608" roughness={0.7} metalness={0} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.058, 0.06, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.028, 0.0075, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#1a2a36" roughness={0.4} metalness={0.45} />
      </mesh>
    </group>
  );
}

function PlantPot() {
  // Slightly stylized — a terracotta-ish pot with three offset
  // icosahedron "leaves" for an abstract foliage silhouette.
  return (
    <group position={[-1.05, DESK_TOP_Y, 0.05]}>
      {/* Pot — slightly tapered */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.1, 20]} />
        <meshStandardMaterial color="#2a1c11" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.055, 0.005, 8, 20]} />
        <meshStandardMaterial color="#3a261a" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.097, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.005, 20]} />
        <meshStandardMaterial color="#0c0805" roughness={1} metalness={0} />
      </mesh>
      {/* Foliage — three offset clusters */}
      <mesh position={[0, 0.16, 0]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color="#1f4a32" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[-0.035, 0.18, 0.025]}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial color="#266a44" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.03, 0.185, -0.022]}>
        <icosahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial color="#1a4028" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

function Notebook() {
  return (
    <group position={[-0.72, DESK_TOP_Y + 0.008, 0.3]}>
      <RoundedBox args={[0.2, 0.012, 0.3]} radius={0.006} smoothness={2}>
        <meshStandardMaterial color="#13181d" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      {/* Subtle accent strip — like a brand band */}
      <mesh position={[0, 0.007, -0.12]}>
        <boxGeometry args={[0.05, 0.001, 0.026]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      {/* Pen on the notebook */}
      <mesh position={[0, 0.011, 0.05]} rotation={[0, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.16, 10]} />
        <meshStandardMaterial color="#1a2530" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Flanking speakers — two small towers behind the monitors.
 * ------------------------------------------------------------------------- */

function Speakers() {
  return (
    <>
      <Speaker position={[-1.45, DESK_TOP_Y + 0.16, -0.3]} />
      <Speaker position={[1.45, DESK_TOP_Y + 0.16, -0.3]} />
    </>
  );
}

function Speaker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <RoundedBox args={[0.14, 0.32, 0.14]} radius={0.012} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.6} metalness={0.4} />
      </RoundedBox>
      {/* Woofer cone */}
      <mesh position={[0, -0.04, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.044, 0.044, 0.006, 24]} />
        <meshStandardMaterial color="#040608" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.04, 0.073]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.04, 0.005, 8, 24]} />
        <meshStandardMaterial color="#1a2530" roughness={0.5} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.04, 0.076]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.003, 16]} />
        <meshStandardMaterial color="#22303a" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Tweeter */}
      <mesh position={[0, 0.09, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.005, 16]} />
        <meshStandardMaterial color="#040608" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Tiny cyan power LED at the bottom-right */}
      <mesh position={[0.045, -0.14, 0.072]}>
        <sphereGeometry args={[0.0035, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Monitor rig — three monitors in a gentle arc.
 * ------------------------------------------------------------------------- */

function MonitorRig() {
  const leftTexture = useLeftScreenTexture();
  const centerTexture = useCenterScreenTexture();
  const rightTexture = useRightScreenTexture();

  return (
    <>
      <Monitor
        position={[-1.05, 0.95, -0.18]}
        rotation={[0, 0.42, 0]}
        size="small"
        screenTexture={leftTexture}
      />
      <Monitor
        position={[0, 1.0, -0.35]}
        rotation={[0, 0, 0]}
        size="large"
        screenTexture={centerTexture}
      />
      <Monitor
        position={[1.05, 0.95, -0.18]}
        rotation={[0, -0.42, 0]}
        size="small"
        screenTexture={rightTexture}
      />
    </>
  );
}

type MonitorSize = "small" | "large";

const MONITOR_SIZES: Record<MonitorSize, { w: number; h: number; bezel: number; standH: number }> =
  {
    small: { w: 0.78, h: 0.5, bezel: 0.02, standH: 0.22 },
    large: { w: 1.05, h: 0.62, bezel: 0.022, standH: 0.22 },
  };

function Monitor({
  position,
  rotation = [0, 0, 0],
  size = "large",
  screenTexture,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: MonitorSize;
  screenTexture: THREE.Texture;
}) {
  const { w, h, bezel, standH } = MONITOR_SIZES[size];
  const innerW = w - bezel * 2;
  const innerH = h - bezel * 2;

  return (
    <group position={position} rotation={rotation}>
      {/* Bezel */}
      <RoundedBox args={[w, h, 0.04]} radius={0.012} smoothness={2}>
        <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
      </RoundedBox>
      {/* Screen surface with the canvas texture as both base color and
          emissive map. The bright cyan text on the texture lifts above
          the bloom threshold and glows naturally. */}
      <mesh position={[0, 0, 0.0215]}>
        <planeGeometry args={[innerW, innerH]} />
        <meshStandardMaterial
          map={screenTexture}
          emissive="#ffffff"
          emissiveMap={screenTexture}
          emissiveIntensity={1.05}
          toneMapped={false}
        />
      </mesh>
      {/* Stand pillar */}
      <mesh position={[0, -h / 2 - standH / 2, -0.02]}>
        <boxGeometry args={[0.06, standH, 0.04]} />
        <meshStandardMaterial color="#13181d" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Stand base */}
      <mesh position={[0, -h / 2 - standH - 0.01, -0.02]}>
        <cylinderGeometry args={[0.16, 0.16, 0.015, 18]} />
        <meshStandardMaterial color="#13181d" roughness={0.65} metalness={0.4} />
      </mesh>
    </group>
  );
}
