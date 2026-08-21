"use client";

import { type Vec3 } from "../stations";
import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "../materials";
import { useLoungeTvTexture } from "../screens/tv";
import { bookDesign, Books, type BookPlacement } from "./books";
import { Macbook } from "./macbook";
import { Remote } from "./remote";
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

export const SOFA_Z = 1.05;
export const TABLE_Z = -0.2;
/**
 * The unit under the television. Exported as a footprint because it is one end of the only
 * clear stretch of the back wall, and `scene/plant.tsx` stands in what is left of it.
 */
export const TV_CONSOLE = { width: 1.9, height: 0.4, depth: 0.4, centerZ: -1.2 } as const;
export const TV_WALL_Z = -1.35;
export const TV_CENTER_Y = 1.5;

const UPHOLSTERY = { color: "#16202a", roughness: 0.85, metalness: 0.05 } as const;
const FRAME = { color: "#0c1116", roughness: 0.6, metalness: 0.35 } as const;
const SURFACE = { color: "#12181f", roughness: 0.55, metalness: 0.3 } as const;

const RUG_CENTER_Z = 0.2;

function LoungeRug(): ReactElement {
  return (
    <group position={[0, 0, RUG_CENTER_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[3.6, 3.0]} />
        <meshStandardMaterial color="#0c141b" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[1.28, 1.4, 48]} />
        <meshStandardMaterial color="#1d4a56" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

const WIDTH = 2.2;
const DEPTH = 0.95;
const SEAT_TOP = 0.42;
const SEAT_X = [-0.7, 0, 0.7] as const;
const FOOT_X = [-0.95, 0.95] as const;
const FOOT_Z = [-0.36, 0.36] as const;

function LoungeSofa(): ReactElement {
  return (
    <group position={[0, 0, SOFA_Z]}>
      <RoundedBox
        args={[WIDTH, 0.34, DEPTH]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.27, 0]}
        castShadow
      >
        <meshStandardMaterial {...UPHOLSTERY} />
      </RoundedBox>

      {SEAT_X.map((x) => (
        <RoundedBox
          key={x}
          args={[0.66, 0.16, 0.78]}
          radius={0.06}
          smoothness={3}
          position={[x, SEAT_TOP, 0]}
          castShadow
        >
          <meshStandardMaterial {...UPHOLSTERY} />
        </RoundedBox>
      ))}

      <RoundedBox
        args={[WIDTH, 0.6, 0.2]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.62, 0.4]}
        castShadow
      >
        <meshStandardMaterial {...UPHOLSTERY} />
      </RoundedBox>

      {SEAT_X.map((x) => (
        <RoundedBox
          key={x}
          args={[0.62, 0.42, 0.14]}
          radius={0.07}
          smoothness={3}
          position={[x, 0.62, 0.28]}
          rotation={[0.12, 0, 0]}
        >
          <meshStandardMaterial color="#1c2a36" roughness={0.85} metalness={0.05} />
        </RoundedBox>
      ))}

      {[-WIDTH / 2 + 0.12, WIDTH / 2 - 0.12].map((x) => (
        <RoundedBox
          key={x}
          args={[0.22, 0.5, DEPTH]}
          radius={0.07}
          smoothness={3}
          position={[x, 0.46, 0]}
          castShadow
        >
          <meshStandardMaterial {...UPHOLSTERY} />
        </RoundedBox>
      ))}

      {FOOT_X.map((x) =>
        FOOT_Z.map((z) => (
          <mesh key={`${x},${z}`} position={[x, 0.05, z]}>
            <cylinderGeometry args={[0.03, 0.025, 0.1, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}
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
 * far enough right that its 35 cm footprint stays on the glass inlay and clear of the books.
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

const TOP_Y = 0.34;
const TOP_THICKNESS = 0.06;
/** The face everything on the table stands on, exported because two specs read it back. */
export const TABLE_TOP_Y = TOP_Y + TOP_THICKNESS / 2;
const LEG_X = 0.5;
const LEG_Z = 0.28;

function LoungeCoffeeTable(): ReactElement {
  return (
    <group position={[0, 0, TABLE_Z]}>
      <RoundedBox
        args={[1.3, TOP_THICKNESS, 0.7]}
        radius={0.02}
        smoothness={3}
        position={[0, TOP_Y, 0]}
        castShadow
      >
        <meshStandardMaterial {...SURFACE} />
      </RoundedBox>

      <mesh position={[0, TOP_Y + 0.026, 0.352]}>
        <boxGeometry args={[1.2, 0.005, 0.005]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>

      {[-LEG_X, LEG_X].map((x) =>
        [-LEG_Z, LEG_Z].map((z) => (
          <mesh key={`${x},${z}`} position={[x, TOP_Y / 2 - 0.02, z]}>
            <cylinderGeometry args={[0.022, 0.022, TOP_Y - 0.06, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}

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
      <LoungeSofa />
      <LoungeCoffeeTable />
      <LoungeTv />
      <LoungeLamp />
    </group>
  );
}
