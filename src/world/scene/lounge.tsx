"use client";

import { ROOM } from "../room";
import { type Vec3 } from "../stations";
import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { ExtrudeGeometry, Path, Shape, type BufferGeometry } from "three";
import { useDisposable } from "../gpu";
import { anodizedMetalMaterial, tableTopMaterial, worldColors } from "../materials";
import { useLoungeTvTexture } from "../screens/tv";
import { bookDesign, Books, type BookPlacement } from "./books";
import { Macbook } from "./macbook";
import { Remote } from "./remote";
import { createSlabBody, createSlabFace, FACE_UP, slabOutline, type SlabSpec } from "./slab";
import { createSledLoop, type SledSpec } from "./sled";
import { Sofa, SOFA } from "./sofa";
import { Soundbar, SOUNDBAR } from "./soundbar";

/**
 * The corner the room is not working in: rug, sofa, lamp, coffee table and the TV above the
 * soundbar. One file because they are placed against each other from one origin — every
 * position below is relative to `LOUNGE_ORIGIN`, so moving the corner means moving all of it.
 *
 * The TV's picture is not here. It is a canvas texture, which is a different mode of work,
 * and it lives in `world/screens/tv.ts`.
 */

export const LOUNGE_ORIGIN = [3.6, 0, -0.9] as const satisfies Vec3;
const LOUNGE_ROTATION_Y = 0;

/** The reveal between the sectional's outer arm and the wall it is pushed against. */
const SOFA_WALL_GAP = 0.02;
/**
 * Hard against the right wall rather than centered on the television, which is what leaves the
 * lounge an open floor instead of a corridor down either side of the sofa. Derived from the
 * room rather than typed, so a wider sectional stays against the wall instead of through it.
 */
const SOFA_X = ROOM.maxX - LOUNGE_ORIGIN[0] - SOFA_WALL_GAP - SOFA.width / 2;
/**
 * The sectional's back face, not its center: it is an L, so a center is a number no part of
 * it stands on. `scene/sofa.tsx` builds forward from here, toward the television at `-z`.
 *
 * Set away from the television rather than toward it. The lounge is a corner a visitor stands
 * in, not a row of seats packed against a screen, and pulling the sofa to the back of the rug
 * is what leaves the coffee table a walkway on both sides rather than a shin's width on one.
 * The rug behind it is the bound: the whole piece has to stay on it.
 */
export const SOFA_Z = 2.25;
/**
 * Set between the television it faces and the middle of the run of seats it serves, which are
 * not the same `x` now that the sofa stands against the wall. Its clearance from the chaise is
 * not this number's doing — see `lounge.dom.test.tsx`.
 */
const TABLE_X = -0.15;
export const TABLE_Z = 0.25;
/**
 * The unit under the television. Exported as a footprint because it is one end of the only
 * clear stretch of the back wall, and `scene/plant.tsx` stands in what is left of it.
 */
export const TV_CONSOLE = { width: 1.9, height: 0.4, depth: 0.4, centerZ: -1.2 } as const;
export const TV_WALL_Z = -1.35;
export const TV_CENTER_Y = 1.5;

const FRAME = { color: "#0c1116", roughness: 0.6, metalness: 0.35 } as const;
const SURFACE = { color: "#12181f", roughness: 0.55, metalness: 0.3 } as const;

/**
 * The rug is what the lounge *is* — the corner is otherwise the same floor as the desk's — so
 * it is given by its two edges rather than by a center. The far one stops short of the
 * television's cabinet; the near one is set by the sofa, which has to stand entirely on it and
 * is pulled well back from the screen so the coffee table has floor on both sides.
 */
const RUG = { width: 3.6, farZ: -1.3, nearZ: 2.55 } as const;
const RUG_DEPTH = RUG.nearZ - RUG.farZ;
const RUG_CENTER_Z = (RUG.nearZ + RUG.farZ) / 2;

function LoungeRug(): ReactElement {
  return (
    <group position={[0, 0, RUG_CENTER_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[RUG.width, RUG_DEPTH]} />
        <meshStandardMaterial color="#0c141b" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[1.28, 1.4, 48]} />
        <meshStandardMaterial color="#1d4a56" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

const BLADE_H = 1.62;
const BLADE_W = 0.08;
const BLADE_D = 0.05;
const BLADE_Y = 0.08 + BLADE_H / 2;
const STRIP_H = BLADE_H - 0.14;
const STRIP_W = BLADE_W - 0.034;
const STRIP_ZS = [BLADE_D / 2 + 0.001, -BLADE_D / 2 - 0.001] as const;

function LoungeLamp(): ReactElement {
  return (
    <group position={[1.5, 0, -1.05]} rotation={[0, -0.85, 0]}>
      <mesh position={[0, 0.016, 0]}>
        <cylinderGeometry args={[0.17, 0.19, 0.032, 28]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.052, 0.072, 0.062, 20]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>

      <RoundedBox
        args={[BLADE_W, BLADE_H, BLADE_D]}
        radius={0.022}
        smoothness={3}
        position={[0, BLADE_Y, 0]}
      >
        <meshStandardMaterial {...FRAME} />
      </RoundedBox>

      {STRIP_ZS.map((z) => (
        <mesh key={z} position={[0, BLADE_Y, z]}>
          <boxGeometry args={[STRIP_W, STRIP_H, 0.006]} />
          <meshBasicMaterial color={worldColors.coolLight} toneMapped={false} />
        </mesh>
      ))}

      <pointLight
        position={[0, BLADE_Y + 0.2, 0.14]}
        intensity={1.1}
        distance={3}
        decay={2}
        color={worldColors.coolLight}
      />
      <pointLight
        position={[0, 0.45, 0.14]}
        intensity={0.5}
        distance={2}
        decay={2}
        color={worldColors.coolLight}
      />
    </group>
  );
}

/**
 * The three books on the coffee table. They are bound in `books.tsx` like every other book
 * in the room, rather than being three more colored boxes: lying face up, what a visitor
 * standing in the room sees of them is the spines and the page edges, so those are the two
 * things the pose has to get right. The room is toward -x from here.
 */
const TABLE_BOOK_POSE = { kind: "flat", spine: "nx" } as const;

type StackedBook = { key: string; size: Vec3; y: number; turn: number; order: number };

const BOOK_STACK: readonly StackedBook[] = [
  { key: "lower", size: [0.24, 0.028, 0.32], y: 0.014, turn: 0.08, order: 3 },
  { key: "middle", size: [0.22, 0.024, 0.3], y: 0.04, turn: -0.14, order: 17 },
  { key: "upper", size: [0.2, 0.022, 0.28], y: 0.063, turn: 0.24, order: 28 },
];

const TABLE_BOOKS: readonly BookPlacement[] = BOOK_STACK.map((book): BookPlacement => ({
  key: book.key,
  position: [0, book.y, 0],
  size: book.size,
  rotation: [0, book.turn, 0],
  pose: TABLE_BOOK_POSE,
  design: bookDesign(book.order),
}));

type LoungeTableItemsProps = {
  topY: number;
};

/**
 * The laptop's corner of the table: turned toward the sofa rather than square to it, and set
 * far enough right that its 35 cm footprint stays on the inlaid panel and clear of the books.
 * `topY` is the inlay's own face, so the position below carries the two offsets that are the
 * laptop's own business and nothing else.
 */
const MACBOOK_TURN = -0.3;
const MACBOOK_OFFSET = { x: 0.28, z: -0.05 } as const;

function LoungeTableItems({ topY }: LoungeTableItemsProps): ReactElement {
  return (
    <group>
      <group position={[MACBOOK_OFFSET.x, topY, MACBOOK_OFFSET.z]} rotation={[0, MACBOOK_TURN, 0]}>
        <Macbook />
      </group>

      <group position={[-0.36, topY, 0.04]}>
        <Books books={TABLE_BOOKS} />
      </group>

      <group position={[0, topY, 0.2]} rotation={[0, 0.5, 0]}>
        <Remote />
      </group>
    </group>
  );
}

/**
 * The top is a slab, so its shape comes from `slab.ts` — the same primitive as the phone and
 * the tablet, at a hundred times the area.
 *
 * A `RoundedBox` is what it was, and a `RoundedBox` is a bar of soap: one radius rounds all
 * twelve edges alike, so the thing has no edge at all and reads as a slab of the same dark
 * plastic as everything else in the corner. What a high-end table has instead is a **flat side
 * with the edge broken** — a chamfer top and bottom, a couple of millimeters each — because
 * that chamfer is a line the light runs along, and it is the only reason a 5 cm top reads as a
 * 5 cm top rather than as a thickness. The corner is a squircle for the same reason it is on
 * the devices: the curvature carries into the straight edge instead of meeting it at a step.
 */
const TOP: SlabSpec = {
  width: 1.3,
  length: 0.7,
  thickness: 0.05,
  cornerRadius: 0.07,
  fillet: 0.01,
};

/** The underside, which is what the base has to reach and what the room measures against. */
const TOP_BOTTOM_Y = 0.32;
/**
 * The inlaid panel and the light are on opposite faces of the slab, and that is the whole
 * design. Above: a border of graphite, then a panel in the same finish as the desk, and
 * nothing lit at all — a lit line on a table top is a strip somebody stuck on, and it competes
 * with the two screens the table carries. Below: a channel of accent recessed under the
 * overhang, which puts the light on the rug instead of in the eye. The top then reads as
 * floating on its own glow, which is the effect a lounge table like this is bought for.
 *
 * The panel is `tableTopMaterial`, not the devices' `SLAB_GLASS`. Cover glass is near-black
 * because a phone's screen is off; on 0.9 m² of table it is not smoked glass but an unlit
 * hole, and from anywhere the desk is in frame the two surfaces read as different materials
 * rather than as one room. The border and the chamfer are what keep it a panel and not a
 * second desk.
 *
 * The step between the frame and the panel is tenths of a millimeter, and deliberately not a
 * hairline — `scene/phone.tsx` documents what this room's shallow depth buffer does to two
 * panels any closer than that.
 */
const INLAY_INSET = 0.021;
const INLAY_Y = TOP_BOTTOM_Y + TOP.thickness + 0.002;

/** The face everything on the table stands on, exported because two specs read it back. */
export const TABLE_TOP_Y = INLAY_Y;

/**
 * The channel: set back under the edge so the slab's own overhang hides the emitter, and
 * standing proud of the underside so the light has a wall to come off rather than a face
 * pointing at the floor. What a visitor sees from anywhere in the room is a line of accent
 * following the outline and the wash it throws down onto the rug — never the strip itself.
 *
 * It is thin on purpose. The room's bloom pass reads **area**, so a wide band of accent at
 * this size stops being a line and becomes a lamp — see the soundbar's grille, which lost its
 * perforations to exactly that.
 */
const CHANNEL_INSET = 0.014;
const CHANNEL_WIDTH = 0.006;
const CHANNEL_HEIGHT = 0.005;
const CHANNEL_Y = TOP_BOTTOM_Y - CHANNEL_HEIGHT;

function createChannel(): BufferGeometry {
  const band = new Shape().setFromPoints(slabOutline(TOP, CHANNEL_INSET));
  band.holes.push(new Path().setFromPoints(slabOutline(TOP, CHANNEL_INSET + CHANNEL_WIDTH)));
  return new ExtrudeGeometry(band, { depth: CHANNEL_HEIGHT, bevelEnabled: false });
}

/**
 * And the light it actually casts. Emissive geometry lights nothing in three.js — without
 * this the channel is a bright line on a table standing in its own shadow, which is a decal.
 * One point light, under the top and short of the floor, is the pool on the rug that makes
 * the glow read as a source. Kept dim and short-range: the lounge is lit by the television
 * and the lamp, and this is a table, not a third fixture.
 */
const UNDERGLOW = { y: TOP_BOTTOM_Y - 0.08, intensity: 0.55, distance: 1.5 } as const;

/**
 * The base is the same bent bar as the desk's, crossed instead of parallel — an X in plan,
 * two runners meeting under the middle of the table and rising to the underside near its four
 * corners.
 *
 * It is crossed so the two pieces are not the same piece of furniture at two sizes. A pair of
 * parallel loops is the desk's silhouette, and the desk is three meters of it across the same
 * room; repeated under a coffee table a quarter its length, the corner reads as a set. The X
 * says the same vocabulary — one section, one bend, one finish — in a different sentence, and
 * it is the shape that suits a top a visitor walks around rather than sits at.
 *
 * The feet are given as the corner one bar reaches, because that is what the shape actually
 * is; the bar's own length and the turn that lays it there both fall out of that corner.
 */
const FOOT = { x: 0.44, z: 0.26 } as const;
const SLED_TURN = Math.atan2(FOOT.z, FOOT.x);

const SLED: SledSpec = {
  width: 0.055,
  thickness: 0.014,
  halfRun: Math.hypot(FOOT.x, FOOT.z),
  bend: 0.07,
  rise: TOP_BOTTOM_Y,
};

/** The two turns are mirrored, which is what makes one bar into a crossing pair. */
const SLED_TURNS = [SLED_TURN, -SLED_TURN] as const;

function LoungeCoffeeTable(): ReactElement {
  const parts = useDisposable(() => ({
    top: createSlabBody(TOP),
    channel: createChannel(),
    inlay: createSlabFace(TOP, INLAY_INSET),
    loop: createSledLoop(SLED),
  }));

  return (
    <group position={[TABLE_X, 0, TABLE_Z]}>
      <mesh
        geometry={parts.top}
        position={[0, TOP_BOTTOM_Y + TOP.fillet, 0]}
        rotation={FACE_UP}
        castShadow
      >
        <meshStandardMaterial {...SURFACE} />
      </mesh>

      <mesh geometry={parts.channel} position={[0, CHANNEL_Y, 0]} rotation={FACE_UP}>
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, UNDERGLOW.y, 0]}
        intensity={UNDERGLOW.intensity}
        distance={UNDERGLOW.distance}
        decay={2}
        color={worldColors.accent}
      />

      <mesh geometry={parts.inlay} position={[0, INLAY_Y, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...tableTopMaterial} />
      </mesh>

      {SLED_TURNS.map((turn) => (
        <mesh key={turn} geometry={parts.loop} rotation={[0, turn, 0]} castShadow>
          <meshStandardMaterial {...anodizedMetalMaterial} />
        </mesh>
      ))}

      <LoungeTableItems topY={TABLE_TOP_Y + 0.001} />
    </group>
  );
}

const { width: CONSOLE_W, height: CONSOLE_H, depth: CONSOLE_D, centerZ: CONSOLE_Z } = TV_CONSOLE;
/** Set forward on the cabinet, clear of its front edge by a finger — where a bar is stood. */
const BAR_Z = CONSOLE_D / 2 - 0.03 - SOUNDBAR.depth / 2;
const TV_W = 1.7;
const TV_H = 0.98;
const TV_Z = TV_WALL_Z;

function LoungeTv(): ReactElement {
  const screen = useLoungeTvTexture();

  return (
    <group>
      <group position={[0, 0, CONSOLE_Z]}>
        <RoundedBox
          args={[CONSOLE_W, CONSOLE_H, CONSOLE_D]}
          radius={0.02}
          smoothness={3}
          position={[0, CONSOLE_H / 2 + 0.02, 0]}
          castShadow
        >
          <meshStandardMaterial {...SURFACE} />
        </RoundedBox>
        <mesh position={[0, 0.12, CONSOLE_D / 2 + 0.001]}>
          <boxGeometry args={[CONSOLE_W - 0.1, 0.01, 0.004]} />
          <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
        </mesh>
        <Soundbar topY={CONSOLE_H + 0.02} centerZ={BAR_Z} />
      </group>

      <group position={[0, TV_CENTER_Y, TV_Z]}>
        <RoundedBox args={[TV_W, TV_H, 0.05]} radius={0.012} smoothness={3} castShadow>
          <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[TV_W - 0.1, TV_H - 0.1]} />
          <meshStandardMaterial
            map={screen}
            emissive="#ffffff"
            emissiveMap={screen}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>

      <pointLight
        position={[0, TV_CENTER_Y, TV_Z + 0.9]}
        intensity={0.65}
        distance={3.6}
        decay={2}
        color={worldColors.accent}
      />
    </group>
  );
}

export function Lounge(): ReactElement {
  return (
    <group position={LOUNGE_ORIGIN} rotation={[0, LOUNGE_ROTATION_Y, 0]}>
      <LoungeRug />
      <group position={[SOFA_X, 0, SOFA_Z]}>
        <Sofa />
      </group>
      <LoungeCoffeeTable />
      <LoungeTv />
      <LoungeLamp />
    </group>
  );
}
