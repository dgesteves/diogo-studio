"use client";

import { type ReactElement } from "react";
import { DESK_TOP_Y } from "../room";
import { CONTROL_DECK, ControlDeck } from "./control-deck";
import { MAC_STUDIO, MacStudio } from "./mac-studio";

/**
 * The two boxes behind the monitors — Mac Studio and control deck — and the row they stand in.
 * The layout is the reason this is one file: the cluster is a row, so moving either of them
 * means recomputing both.
 *
 * Neither is built here. The Mac Studio is a real machine whose shape is the thing being
 * reproduced; the control deck is a console with a face layout and a screen of its own. Each
 * owns its file — `scene/mac-studio.tsx` and `scene/control-deck.tsx` — and this row lays out
 * from the one width it takes from each.
 */

/** The row's nominal depth: what the boxes are centered on, not what any one of them measures. */
const HARDWARE_DEPTH = 0.27;
const HARDWARE_BACK_Z = -0.31;
const HARDWARE_CENTER_Z = HARDWARE_BACK_Z + HARDWARE_DEPTH / 2;
const HARDWARE_GAP = 0.04;

const CLUSTER_WIDTH = MAC_STUDIO.width + CONTROL_DECK.width + HARDWARE_GAP;
const CLUSTER_LEFT = -CLUSTER_WIDTH / 2;

const MAC_STUDIO_X = CLUSTER_LEFT + MAC_STUDIO.width / 2;
const DECK_X = CLUSTER_LEFT + CLUSTER_WIDTH - CONTROL_DECK.width / 2;

export function DeskHardware(): ReactElement {
  return (
    <group>
      <group position={[MAC_STUDIO_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
        <MacStudio />
      </group>
      <group position={[DECK_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
        <ControlDeck />
      </group>
    </group>
  );
}
