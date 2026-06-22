import { Cell } from "./types";

// Mảng 12 phần tử đại diện cho bàn cờ Ô Ăn Quan
// 0 -> 4: 5 ô Dân của Người chơi 1
// 5: Ô Quan bên phải (Quan 1)
// 6 -> 10: 5 ô Dân của Người chơi 2
// 11: Ô Quan bên trái (Quan 2)
export const INITIAL_BOARD: Cell[] = [
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 0, quan: 1 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 0, quan: 1 },
];

export const createInitialBoard = (): Cell[] => INITIAL_BOARD.map((c) => ({ ...c }));

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
