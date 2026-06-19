export const BOARD_SIZE = 25;

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
