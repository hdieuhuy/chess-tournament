import { Move } from "../types";

// Lấy tất cả các nước đi hợp lệ cho người chơi hiện tại
// Luật Checkers: Nếu có nước nhảy (ăn quân), bắt buộc phải thực hiện.
export const getValidMoves = (
  board: (string | null)[][],
  isBlackTurn: boolean,
  multiJumpPiece: [number, number] | null = null,
): Move[] => {
  const moves: Move[] = [];
  const jumps: Move[] = [];

  const playerPiece = isBlackTurn ? "b" : "r";
  const playerKing = isBlackTurn ? "B" : "R";
  const enemyPiece = isBlackTurn ? "r" : "b";
  const enemyKing = isBlackTurn ? "R" : "B";

  // Quân Đen đi lên (row -1), Quân Đỏ đi xuống (row +1)
  const directionsMan = isBlackTurn
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
  const directionsKing = [
    [1, -1],
    [1, 1],
    [-1, -1],
    [-1, 1],
  ];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (
        multiJumpPiece &&
        (r !== multiJumpPiece[0] || c !== multiJumpPiece[1])
      ) {
        continue;
      }

      const p = board[r][c];
      if (p === playerPiece || p === playerKing) {
        const dirs = p === playerKing ? directionsKing : directionsMan;
        for (const [dr, dc] of dirs) {
          // Nước đi thông thường
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!board[nr][nc] && !multiJumpPiece) {
              moves.push({ from: [r, c], to: [nr, nc], jumped: null });
            }
          }

          // Nước nhảy (ăn quân)
          const jr = r + dr * 2;
          const jc = c + dc * 2;
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
            if (!board[jr][jc]) {
              const jumpedPiece = board[nr][nc];
              if (jumpedPiece === enemyPiece || jumpedPiece === enemyKing) {
                jumps.push({ from: [r, c], to: [jr, jc], jumped: [nr, nc] });
              }
            }
          }
        }
      }
    }
  }

  // Bắt buộc ăn quân nếu có thể
  return jumps.length > 0 ? jumps : moves;
};
