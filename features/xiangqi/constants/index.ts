export const INITIAL_BOARD: (string | null)[][] = [
  ["r", "n", "b", "a", "k", "a", "b", "n", "r"],
  [null, null, null, null, null, null, null, null, null],
  [null, "c", null, null, null, null, null, "c", null],
  ["p", null, "p", null, "p", null, "p", null, "p"],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["P", null, "P", null, "P", null, "P", null, "P"],
  [null, "C", null, null, null, null, null, "C", null],
  [null, null, null, null, null, null, null, null, null],
  ["R", "N", "B", "A", "K", "A", "B", "N", "R"],
];

export const INITIAL_TIME = 600; // 10 phút tính bằng giây

export const piecesMap: Record<string, { text: string; color: string }> = {
  R: { text: "車", color: "text-red-600" },
  N: { text: "馬", color: "text-red-600" },
  B: { text: "相", color: "text-red-600" },
  A: { text: "仕", color: "text-red-600" },
  K: { text: "帥", color: "text-red-600" },
  C: { text: "炮", color: "text-red-600" },
  P: { text: "兵", color: "text-red-600" },
  r: { text: "車", color: "text-zinc-900" },
  n: { text: "馬", color: "text-zinc-900" },
  b: { text: "象", color: "text-zinc-900" },
  a: { text: "士", color: "text-zinc-900" },
  k: { text: "將", color: "text-zinc-900" },
  c: { text: "砲", color: "text-zinc-900" },
  p: { text: "卒", color: "text-zinc-900" },
};

export const PIECE_VALUES: Record<string, number> = {
  R: 9,
  r: 9,
  C: 8,
  c: 8,
  N: 7,
  n: 7,
  B: 6,
  b: 6,
  A: 5,
  a: 5,
  P: 4,
  p: 4,
  K: 0,
  k: 0,
};
