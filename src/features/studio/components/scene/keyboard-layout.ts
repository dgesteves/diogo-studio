const ROW_WIDTHS: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

const ROW_LABELS: readonly (readonly string[])[] = [
  ["esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "prt", "del"],
  ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "bsp"],
  ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "enter"],
  ["shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "shift", "^"],
  ["ctrl", "alt", "cmd", "", "cmd", "fn", "<", "v"],
];

const KEY_SHADES = ["#151c22", "#171f26", "#131a20", "#182028"] as const;

const UNIT = 0.0452;
const GAP = 0.0042;
const ROW_PITCH = 0.0318;
const ROW_SPAN_UNITS = 15;
const ROW_COUNT = ROW_WIDTHS.length;
const ROW_TILT = 0.018;

export const KEYCAP_HEIGHT = 0.0055;
export const KEYCAP_DEPTH = ROW_PITCH - GAP;
export const KEY_FIELD_WIDTH = ROW_SPAN_UNITS * UNIT;
export const KEY_FIELD_DEPTH = (ROW_COUNT - 1) * ROW_PITCH + KEYCAP_DEPTH;

export type Keycap = {
  id: string;
  x: number;
  z: number;
  width: number;
  tilt: number;
  shade: string;
  label: string;
};

function buildKeycaps(): readonly Keycap[] {
  const caps: Keycap[] = [];
  const firstRowZ = -((ROW_COUNT - 1) * ROW_PITCH) / 2;
  const centerRow = (ROW_COUNT - 1) / 2;

  ROW_WIDTHS.forEach((widths, row) => {
    let cursor = -KEY_FIELD_WIDTH / 2;

    widths.forEach((widthUnits, column) => {
      const span = widthUnits * UNIT;
      caps.push({
        id: `${row}:${column}`,
        x: cursor + span / 2,
        z: firstRowZ + row * ROW_PITCH,
        width: span - GAP,
        tilt: (centerRow - row) * ROW_TILT,
        shade: KEY_SHADES[(row * 7 + column * 3) % KEY_SHADES.length] ?? KEY_SHADES[0],
        label: ROW_LABELS[row]?.[column] ?? "",
      });
      cursor += span;
    });
  });

  return caps;
}

export const KEYCAPS = buildKeycaps();
