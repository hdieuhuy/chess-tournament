export const getPiecesBetweenDiag = (
  board: (string | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
) => {
  let count = 0;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1 + dr;
  let c = c1 + dc;
  while (r !== r2 && c !== c2) {
    if (board[r][c]) count++;
    r += dr;
    c += dc;
  }
  return count;
};

export const canMoveBasic = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  epTarget: [number, number] | null,
  isWhiteTurn: boolean,
) => {
  const piece = board[fr][fc];
  if (!piece) return false;
  const isW = piece === piece.toUpperCase();
  if (isW !== isWhiteTurn) return false;
  const target = board[tr][tc];

  // Không thể ăn quân cùng màu
  if (target && (target === target.toUpperCase()) === isW) return false;

  const type = piece.toLowerCase();
  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (type === "p") {
    const dir = isW ? -1 : 1;
    const startRow = isW ? 6 : 1;
    // Tiến thẳng
    if (dc === 0) {
      if (dr === dir && !target) return true;
      if (dr === 2 * dir && fr === startRow && !target && !board[fr + dir][fc])
        return true;
    }
    // Ăn chéo (bao gồm cả ăn qua đường - en passant)
    else if (adc === 1 && dr === dir) {
      if (target) return true;
      if (epTarget && epTarget[0] === tr && epTarget[1] === tc) return true;
    }
    return false;
  }
  if (type === "n") {
    return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
  }
  if (type === "b") {
    if (adr !== adc) return false;
    return getPiecesBetweenDiag(board, fr, fc, tr, tc) === 0;
  }
  if (type === "r") {
    if (adr !== 0 && adc !== 0) return false;
    if (adr === 0) {
      const min = Math.min(fc, tc);
      const max = Math.max(fc, tc);
      for (let c = min + 1; c < max; c++) if (board[fr][c]) return false;
    } else {
      const min = Math.min(fr, tr);
      const max = Math.max(fr, tr);
      for (let r = min + 1; r < max; r++) if (board[r][fc]) return false;
    }
    return true;
  }
  if (type === "q") {
    if (adr === adc) return getPiecesBetweenDiag(board, fr, fc, tr, tc) === 0;
    if (adr === 0) {
      const min = Math.min(fc, tc);
      const max = Math.max(fc, tc);
      for (let c = min + 1; c < max; c++) if (board[fr][c]) return false;
      return true;
    }
    if (adc === 0) {
      const min = Math.min(fr, tr);
      const max = Math.max(fr, tr);
      for (let r = min + 1; r < max; r++) if (board[r][fc]) return false;
      return true;
    }
    return false;
  }
  if (type === "k") {
    if (adr <= 1 && adc <= 1) return true;
    return false;
  }
  return false;
};

export const isAttacked = (
  board: (string | null)[][],
  r: number,
  c: number,
  byWhite: boolean,
  epTarget: [number, number] | null,
) => {
  for (let ir = 0; ir < 8; ir++) {
    for (let ic = 0; ic < 8; ic++) {
      const p = board[ir][ic];
      if (p) {
        const pIsW = p === p.toUpperCase();
        if (pIsW === byWhite) {
          if (p.toLowerCase() === "p") {
            const dir = pIsW ? -1 : 1;
            if (r - ir === dir && Math.abs(c - ic) === 1) return true;
          } else if (p.toLowerCase() === "k") {
            if (Math.abs(r - ir) <= 1 && Math.abs(c - ic) <= 1) return true;
          } else {
            if (canMoveBasic(board, ir, ic, r, c, epTarget, byWhite))
              return true;
          }
        }
      }
    }
  }
  return false;
};

export const findKing = (board: (string | null)[][], isW: boolean) => {
  const kChar = isW ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kChar) return [r, c];
    }
  }
  return null;
};

export const isLegalMove = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  epTarget: [number, number] | null,
  isWhiteTurn: boolean,
  castlingRights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean },
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  // Luật Nhập thành (Castling)
  if (piece.toLowerCase() === "k" && Math.abs(tc - fc) === 2 && tr === fr) {
    if (isWhiteTurn) {
      if (fr !== 7 || fc !== 4) return false;
      if (tc === 6) {
        // Kingside
        if (!castlingRights.wK) return false;
        if (board[7][5] || board[7][6]) return false;
        if (isAttacked(board, 7, 4, false, epTarget)) return false;
        if (isAttacked(board, 7, 5, false, epTarget)) return false;
        if (isAttacked(board, 7, 6, false, epTarget)) return false;
        return true;
      } else if (tc === 2) {
        // Queenside
        if (!castlingRights.wQ) return false;
        if (board[7][1] || board[7][2] || board[7][3]) return false;
        if (isAttacked(board, 7, 4, false, epTarget)) return false;
        if (isAttacked(board, 7, 3, false, epTarget)) return false;
        if (isAttacked(board, 7, 2, false, epTarget)) return false;
        return true;
      }
    } else {
      if (fr !== 0 || fc !== 4) return false;
      if (tc === 6) {
        // Kingside
        if (!castlingRights.bK) return false;
        if (board[0][5] || board[0][6]) return false;
        if (isAttacked(board, 0, 4, true, epTarget)) return false;
        if (isAttacked(board, 0, 5, true, epTarget)) return false;
        if (isAttacked(board, 0, 6, true, epTarget)) return false;
        return true;
      } else if (tc === 2) {
        // Queenside
        if (!castlingRights.bQ) return false;
        if (board[0][1] || board[0][2] || board[0][3]) return false;
        if (isAttacked(board, 0, 4, true, epTarget)) return false;
        if (isAttacked(board, 0, 3, true, epTarget)) return false;
        if (isAttacked(board, 0, 2, true, epTarget)) return false;
        return true;
      }
    }
    return false;
  }

  if (!canMoveBasic(board, fr, fc, tr, tc, epTarget, isWhiteTurn)) return false;

  // Giả lập nước đi
  const tempBoard = board.map((row) => [...row]);
  tempBoard[tr][tc] = piece;
  tempBoard[fr][fc] = null;

  // Xóa Tốt bị ăn khi dùng luật Bắt Tốt Qua Đường (En Passant)
  if (
    piece.toLowerCase() === "p" &&
    Math.abs(tc - fc) === 1 &&
    !board[tr][tc]
  ) {
    tempBoard[fr][tc] = null;
  }

  // Tìm vua và đảm bảo tướng không bị chiếu sau khi đi
  const kPos = findKing(tempBoard, isWhiteTurn);
  if (kPos && isAttacked(tempBoard, kPos[0], kPos[1], !isWhiteTurn, epTarget)) {
    return false;
  }

  return true;
};
