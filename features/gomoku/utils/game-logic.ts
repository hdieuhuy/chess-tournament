import { BOARD_SIZE } from "../constants";

export const checkWinner = (
  currentBoard: (string | null)[][],
  row: number,
  col: number,
  player: string,
) => {
  const directions = [
    [
      [0, 1],
      [0, -1],
    ], // Ngang
    [
      [1, 0],
      [-1, 0],
    ], // Dọc
    [
      [1, 1],
      [-1, -1],
    ], // Chéo chính
    [
      [1, -1],
      [-1, 1],
    ], // Chéo phụ
  ];

  for (const dir of directions) {
    let count = 1;
    const currentWinningCells = [[row, col]];
    let blocks = 0;

    for (const [dr, dc] of dir) {
      let r = row + dr;
      let c = col + dc;
      while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        currentBoard[r][c] === player
      ) {
        count++;
        currentWinningCells.push([r, c]);
        r += dr;
        c += dc;
      }

      // Kiểm tra xem đầu này có bị chặn không (bởi biên bàn cờ hoặc cờ đối thủ)
      if (
        r < 0 ||
        r >= BOARD_SIZE ||
        c < 0 ||
        c >= BOARD_SIZE ||
        (currentBoard[r][c] !== null && currentBoard[r][c] !== player)
      ) {
        blocks++;
      }
    }

    // Luật Overline: Phải có đúng 5 quân liên tiếp mới thắng (6 quân trở lên không tính)
    if (count === 5 && blocks < 2) {
      return currentWinningCells;
    }
  }
  return null;
};
