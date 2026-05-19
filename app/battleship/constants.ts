import { Ship } from "./types";

export const BOARD_SIZE = 10;
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export const getInitialShips = (): Ship[] => [
  { id: 0, size: 5, positions: [], orientation: "H", color: "bg-blue-500" },
  { id: 1, size: 4, positions: [], orientation: "H", color: "bg-cyan-500" },
  { id: 2, size: 3, positions: [], orientation: "H", color: "bg-green-500" },
  { id: 3, size: 3, positions: [], orientation: "H", color: "bg-yellow-500" },
  { id: 4, size: 2, positions: [], orientation: "H", color: "bg-purple-500" },
];
