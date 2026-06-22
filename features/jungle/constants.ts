import React from "react";
import {
  GiSeatedMouse,
  GiCat,
  GiWolfHead,
  GiSittingDog,
  GiTigerHead,
  GiTiger,
  GiLion,
  GiElephant,
} from "react-icons/gi";
import { FaPaw } from "react-icons/fa6";
import { BoardState } from "./types";

export const INITIAL_TIME = 600; // 10 minutes

// 9 rows x 7 cols
// Uppercase (Red - Player 1), Lowercase (Blue - Player 2)
// L: Lion, T: Tiger, D: Dog, C: Cat, R: Rat, P: Panther, W: Wolf, E: Elephant
export const INITIAL_BOARD: BoardState = [
  ["l", null, null, null, null, null, "t"], // 0
  [null, "d", null, null, null, "c", null], // 1
  ["r", null, "p", null, "w", null, "e"], // 2
  [null, null, null, null, null, null, null], // 3
  [null, null, null, null, null, null, null], // 4
  [null, null, null, null, null, null, null], // 5
  ["E", null, "W", null, "P", null, "R"], // 6
  [null, "C", null, null, null, "D", null], // 7
  ["T", null, null, null, null, null, "L"], // 8
];

export const piecesMap: Record<string, { bg: string; color: string; label: string }> = {
  R: { bg: "bg-red-100", color: "text-red-700", label: "Chuột" },
  C: { bg: "bg-red-100", color: "text-red-700", label: "Mèo" },
  W: { bg: "bg-red-100", color: "text-red-700", label: "Sói" },
  D: { bg: "bg-red-100", color: "text-red-700", label: "Chó" },
  P: { bg: "bg-red-100", color: "text-red-700", label: "Báo" },
  T: { bg: "bg-red-100", color: "text-red-700", label: "Cọp" },
  L: { bg: "bg-red-100", color: "text-red-700", label: "Sư tử" },
  E: { bg: "bg-red-100", color: "text-red-700", label: "Voi" },

  r: { bg: "bg-blue-100", color: "text-blue-700", label: "Chuột" },
  c: { bg: "bg-blue-100", color: "text-blue-700", label: "Mèo" },
  w: { bg: "bg-blue-100", color: "text-blue-700", label: "Sói" },
  d: { bg: "bg-blue-100", color: "text-blue-700", label: "Chó" },
  p: { bg: "bg-blue-100", color: "text-blue-700", label: "Báo" },
  t: { bg: "bg-blue-100", color: "text-blue-700", label: "Cọp" },
  l: { bg: "bg-blue-100", color: "text-blue-700", label: "Sư tử" },
  e: { bg: "bg-blue-100", color: "text-blue-700", label: "Voi" },
};

export const getPieceIcon = (piece: string) => {
  const p = piece.toLowerCase();
  switch (p) {
    case "r":
      return React.createElement(GiSeatedMouse);
    case "c":
      return React.createElement(GiCat);
    case "d":
      return React.createElement(GiSittingDog);
    case "w":
      return React.createElement(GiWolfHead);
    case "p":
      return React.createElement(FaPaw);
    case "t":
      return React.createElement(GiTiger);
    case "l":
      return React.createElement(GiLion);
    case "e":
      return React.createElement(GiElephant);
    default:
      return null;
  }
};

const rankMap: Record<string, number> = {
  r: 1,
  c: 2,
  d: 3,
  w: 4,
  p: 5,
  t: 6,
  l: 7,
  e: 8,
};

export const getRank = (piece: string) => rankMap[piece.toLowerCase()];

export const isWater = (r: number, c: number) =>
  r >= 3 && r <= 5 && (c === 1 || c === 2 || c === 4 || c === 5);

export const isTrap = (r: number, c: number, isRed: boolean) => {
  if (isRed) {
    // Red trap (protecting red den at 8,3)
    return (r === 8 && (c === 2 || c === 4)) || (r === 7 && c === 3);
  } else {
    // Blue trap (protecting blue den at 0,3)
    return (r === 0 && (c === 2 || c === 4)) || (r === 1 && c === 3);
  }
};

export const canCapture = (
  attacker: string,
  defender: string,
  rTarget: number,
  cTarget: number,
  isRedAttacker: boolean,
) => {
  // If enemy is in our trap, any piece can capture it
  if (isTrap(rTarget, cTarget, isRedAttacker)) return true;

  const rankA = getRank(attacker);
  const rankD = getRank(defender);

  // Mouse captures Elephant
  if (rankA === 1 && rankD === 8) return true;
  // Elephant cannot capture Mouse
  if (rankA === 8 && rankD === 1) return false;

  // Higher or equal rank can capture
  return rankA >= rankD;
};

export const isValidMove = (
  board: BoardState,
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  currentTurn: "r" | "b",
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  const isRed = piece === piece.toUpperCase();
  if ((isRed && currentTurn === "b") || (!isRed && currentTurn === "r"))
    return false;

  // Cannot enter own Den
  const isOwnDen = isRed ? tr === 8 && tc === 3 : tr === 0 && tc === 3;
  if (isOwnDen) return false;

  const target = board[tr][tc];
  if (target) {
    const targetIsRed = target === target.toUpperCase();
    if (isRed === targetIsRed) return false; // Cannot capture own piece

    // Mouse cannot capture piece on land if Mouse is in water, and vice versa
    if (getRank(piece) === 1) {
      if (isWater(fr, fc) !== isWater(tr, tc)) return false;
    }

    if (!canCapture(piece, target, tr, tc, isRed)) return false;
  }

  const dr = tr - fr;
  const dc = tc - fc;

  if (Math.abs(dr) + Math.abs(dc) === 1) {
    // Normal 1-step move
    if (isWater(tr, tc) && getRank(piece) !== 1) return false; // Only mouse can enter water
    return true;
  } else {
    // Jump over river
    const rank = getRank(piece);
    if (rank !== 6 && rank !== 7) return false; // Only Lion and Tiger

    if (dc === 0) {
      if (Math.abs(dr) !== 4) return false; // Must jump exactly over 3 water cells
      const dir = Math.sign(dr);
      for (let i = 1; i <= 3; i++) {
        const checkR = fr + dir * i;
        if (!isWater(checkR, fc)) return false;
        if (board[checkR][fc] !== null) return false; // Blocked by mouse
      }
      return true;
    } else if (dr === 0) {
      if (Math.abs(dc) !== 3) return false; // Must jump exactly over 2 water cells
      const dir = Math.sign(dc);
      for (let i = 1; i <= 2; i++) {
        const checkC = fc + dir * i;
        if (!isWater(fr, checkC)) return false;
        if (board[fr][checkC] !== null) return false; // Blocked by mouse
      }
      return true;
    }
  }
  return false;
};
