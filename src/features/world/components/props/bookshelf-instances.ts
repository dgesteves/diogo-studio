import { buildShelfBooks } from "./bookshelf-layout";

type BookInstance = {
  key: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
};

const BOOK_FRONT_X = 0.085;

const ROWS = [
  { baseY: 0.06, maxHeight: 0.36, seed: 1337 },
  { baseY: 0.52, maxHeight: 0.34, seed: 5081 },
  { baseY: 0.96, maxHeight: 0.34, seed: 9043 },
  { baseY: 1.4, maxHeight: 0.34, seed: 2671 },
  { baseY: 1.84, maxHeight: 0.38, seed: 6217 },
] as const;

export const SHELF_BOOKS: BookInstance[] = ROWS.flatMap((row) =>
  buildShelfBooks(row.seed, row.maxHeight).map(
    (book): BookInstance => ({
      key: `${row.seed}-${book.z.toFixed(3)}`,
      position: [BOOK_FRONT_X - book.depth / 2, row.baseY + book.height / 2, book.z],
      scale: [book.depth, book.height, book.thickness],
      rotation: [book.lean, 0, 0],
      color: book.color,
    }),
  ),
);
