import { BufferGeometry, Float32BufferAttribute } from "three";

import { mouseNormal, mousePoint } from "./mouse-shell";

const LENGTH_SEGMENTS = 96;
const SECTION_SEGMENTS = 52;

export function buildGeometry(
  positions: readonly number[],
  normals: readonly number[],
  indices: readonly number[],
): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex([...indices]);
  return geometry;
}

export function clustered(step: number, count: number): number {
  return 0.5 - 0.5 * Math.cos((Math.PI * step) / count);
}

export function createMouseShellGeometry(): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const stride = SECTION_SEGMENTS + 1;

  for (let row = 0; row <= LENGTH_SEGMENTS; row += 1) {
    const t = clustered(row, LENGTH_SEGMENTS);
    for (let column = 0; column <= SECTION_SEGMENTS; column += 1) {
      const v = clustered(column, SECTION_SEGMENTS);
      const point = mousePoint(t, v);
      const normal = mouseNormal(t, v);
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  for (let row = 0; row < LENGTH_SEGMENTS; row += 1) {
    for (let column = 0; column < SECTION_SEGMENTS; column += 1) {
      const here = row * stride + column;
      const ahead = here + stride;
      indices.push(here, ahead + 1, ahead, here, here + 1, ahead + 1);
    }
  }

  appendSole(positions, normals, indices);
  return buildGeometry(positions, normals, indices);
}

function appendSole(positions: number[], normals: number[], indices: number[]): void {
  const first = positions.length / 3;

  for (let row = 0; row <= LENGTH_SEGMENTS; row += 1) {
    const right = mousePoint(clustered(row, LENGTH_SEGMENTS), 0);
    const left = mousePoint(clustered(row, LENGTH_SEGMENTS), 1);
    positions.push(right.x, right.y, right.z, left.x, left.y, left.z);
    normals.push(0, -1, 0, 0, -1, 0);
  }

  for (let row = 0; row < LENGTH_SEGMENTS; row += 1) {
    const right = first + row * 2;
    indices.push(right, right + 3, right + 1, right, right + 2, right + 3);
  }
}
