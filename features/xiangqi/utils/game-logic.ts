import { INITIAL_BOARD } from "../constants";

export const getFakeType = (r: number, c: number) => {
  if ((r === 0 || r === 9) && (c === 0 || c === 8)) return "r";
  if ((r === 0 || r === 9) && (c === 1 || c === 7)) return "n";
  if ((r === 0 || r === 9) && (c === 2 || c === 6)) return "b";
  if ((r === 0 || r === 9) && (c === 3 || c === 5)) return "a";
  if ((r === 2 || r === 7) && (c === 1 || c === 7)) return "c";
  if ((r === 3 || r === 6) && c % 2 === 0) return "p";
  return "p";
};

export const shuffleCoupBoard = () => {
  const redPieces = [
    "R", "R", "N", "N", "B", "B", "A", "A", "C", "C", "P", "P", "P", "P", "P",
  ];
  const blackPieces = [
    "r", "r", "n", "n", "b", "b", "a", "a", "c", "c", "p", "p", "p", "p", "p",
  ];

  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  shuffle(redPieces);
  shuffle(blackPieces);

  const b = INITIAL_BOARD.map((row) => [...row]);
  let rIdx = 0,
    bIdx = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = b[r][c];
      if (p && p !== "K" && p !== "k") {
        if (p === p.toUpperCase()) b[r][c] = "?" + redPieces[rIdx++];
        else b[r][c] = "?" + blackPieces[bIdx++];
      }
    }
  }
  return b;
};

export const getPiecesBetween = (
  board: (string | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
) => {
  let count = 0;
  if (r1 === r2) {
    const min = Math.min(c1, c2);
    const max = Math.max(c1, c2);
    for (let c = min + 1; c < max; c++) if (board[r1][c]) count++;
  } else if (c1 === c2) {
    const min = Math.min(r1, r2);
    const max = Math.max(r1, r2);
    for (let r = min + 1; r < max; r++) if (board[r][c1]) count++;
  }
  return count;
};

export const canPieceMoveBasic = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  chessVariant: "standard" | "coup",
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  const isFaceDown = piece.startsWith("?");
  const isRed = isFaceDown
    ? piece[1] === piece[1].toUpperCase()
    : piece === piece.toUpperCase();

  const target = board[tr][tc];
  if (target) {
    const targetIsFaceDown = target.startsWith("?");
    const targetIsRed = targetIsFaceDown
      ? target[1] === target[1].toUpperCase()
      : target === target.toUpperCase();
    if (isRed === targetIsRed) return false; // Không ăn quân mình
  }

  const pType = isFaceDown
    ? getFakeType(fr, fc)
    : piece.replace("?", "").toLowerCase();
  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (pType === "k") {
    if (adr + adc !== 1) return false;
    if (tc < 3 || tc > 5) return false;
    if (isRed && tr < 7) return false;
    if (!isRed && tr > 2) return false;
  } else if (pType === "a") {
    if (adr !== 1 || adc !== 1) return false;
    if (chessVariant !== "coup" || isFaceDown) {
      if (tc < 3 || tc > 5) return false;
      if (isRed && tr < 7) return false;
      if (!isRed && tr > 2) return false;
    }
  } else if (pType === "b") {
    if (adr !== 2 || adc !== 2) return false;
    if (chessVariant !== "coup" || isFaceDown) {
      if (isRed && tr < 5) return false; // Không qua sông
      if (!isRed && tr > 4) return false;
    }
    if (board[fr + dr / 2][fc + dc / 2]) return false; // Cản mắt tượng
  } else if (pType === "n") {
    if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
    if (adr === 2 && board[fr + dr / 2][fc]) return false; // Cản chân mã
    if (adc === 2 && board[fr][fc + dc / 2]) return false;
  } else if (pType === "r") {
    if (adr !== 0 && adc !== 0) return false;
    if (getPiecesBetween(board, fr, fc, tr, tc) > 0) return false;
  } else if (pType === "c") {
    if (adr !== 0 && adc !== 0) return false;
    const count = getPiecesBetween(board, fr, fc, tr, tc);
    if (target) {
      if (count !== 1) return false; // Ăn cần đúng 1 ngòi
    } else {
      if (count > 0) return false; // Đi không được vướng
    }
  } else if (pType === "p") {
    if (isRed) {
      if (dr > 0) return false; // Không đi lùi
      if (fr >= 5) {
        if (dr !== -1 || dc !== 0) return false;
      } else {
        if (dr === -1 && dc === 0) return true;
        if (dr === 0 && adc === 1) return true; // Sang ngang
        return false;
      }
    } else {
      if (dr < 0) return false;
      if (fr <= 4) {
        if (dr !== 1 || dc !== 0) return false;
      } else {
        if (dr === 1 && dc === 0) return true;
        if (dr === 0 && adc === 1) return true;
        return false;
      }
    }
  }
  return true;
};

export const isKingInCheck = (
  board: (string | null)[][],
  isRed: boolean,
  chessVariant: "standard" | "coup",
) => {
  let kr = -1;
  let kc = -1;
  const kChar = isRed ? "K" : "k";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === kChar) {
        kr = r;
        kc = c;
        break;
      }
    }
    if (kr !== -1) break;
  }
  if (kr === -1) return false;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p) {
        const pIsFaceDown = p.startsWith("?");
        const pIsRed = pIsFaceDown
          ? p[1] === p[1].toUpperCase()
          : p === p.toUpperCase();
        if (pIsRed !== isRed) {
          if (canPieceMoveBasic(board, r, c, kr, kc, chessVariant)) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

export const isValidMove = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  currentTurn: "r" | "b",
  chessVariant: "standard" | "coup",
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  const isFaceDown = piece.startsWith("?");
  const isRed = isFaceDown
    ? piece[1] === piece[1].toUpperCase()
    : piece === piece.toUpperCase();

  if ((isRed && currentTurn === "b") || (!isRed && currentTurn === "r"))
    return false;

  if (!canPieceMoveBasic(board, fr, fc, tr, tc, chessVariant)) return false;

  // 1. Thử đi để kiểm tra xem tướng của mình có bị uy hiếp hay lộ mặt không
  const targetPiece = board[tr][tc];
  const flippedPiece = isFaceDown ? piece[1] : piece;

  const tempBoard = board.map((row) => [...row]);
  tempBoard[tr][tc] = flippedPiece;
  tempBoard[fr][fc] = null;

  let kPos: [number, number] | null = null;
  let KPos: [number, number] | null = null;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (tempBoard[r][c] === "k") kPos = [r, c];
      if (tempBoard[r][c] === "K") KPos = [r, c];
    }
    if (kPos && KPos) break;
  }

  let isValid = true;

  // Kiểm tra "lộ mặt tướng"
  if (kPos && KPos && kPos[1] === KPos[1]) {
    if (getPiecesBetween(tempBoard, kPos[0], kPos[1], KPos[0], KPos[1]) === 0) {
      isValid = false; // Lỗi 2 tướng nhìn thấy nhau
    }
  }

  // 2. Kiểm tra xem nước đi này có khiến tướng mình bị chiếu bí bởi đối thủ không
  if (isValid) {
    const myKPos = isRed ? KPos : kPos;
    if (myKPos) {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const p = tempBoard[r][c];
          if (p) {
            const pIsFaceDown = p.startsWith("?");
            const pIsRed = pIsFaceDown
              ? p[1] === p[1].toUpperCase()
              : p === p.toUpperCase();
            if (pIsRed !== isRed) {
              if (
                canPieceMoveBasic(
                  tempBoard,
                  r,
                  c,
                  myKPos[0],
                  myKPos[1],
                  chessVariant,
                )
              ) {
                isValid = false; // Nước cờ tự sát (bị chiếu)
                break;
              }
            }
          }
        }
        if (!isValid) break;
      }
    }
  }

  return isValid;
};

export const hasValidMoves = (
  board: (string | null)[][],
  isRedTurn: boolean,
  chessVariant: "standard" | "coup",
) => {
  const currentTurn = isRedTurn ? "r" : "b";
  for (let fr = 0; fr < 10; fr++) {
    for (let fc = 0; fc < 9; fc++) {
      const piece = board[fr][fc];
      if (piece) {
        const isFaceDown = piece.startsWith("?");
        const isRed = isFaceDown
          ? piece[1] === piece[1].toUpperCase()
          : piece === piece.toUpperCase();
        
        if (isRed === isRedTurn) {
          for (let tr = 0; tr < 10; tr++) {
            for (let tc = 0; tc < 9; tc++) {
              if (isValidMove(board, fr, fc, tr, tc, currentTurn, chessVariant)) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
};
