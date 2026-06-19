export type Move = {
  from: [number, number];
  to: [number, number];
  jumped: [number, number] | null;
};

export interface CheckersState {
  hostName: string | null;
  player1Name: string | null; // Black (Đen)
  player2Name: string | null; // Red (Đỏ)
  spectators: string[];
  board: (string | null)[][];
  isBlackTurn: boolean;
  winner: string | null;
  lastMove: { from: [number, number]; to: [number, number] } | null;
  multiJumpPiece: [number, number] | null;
  history: any[];
  undoRequestedBy: string | null;
  gameStarted: boolean;
  readyPlayers: string[];
  player1Time: number;
  player2Time: number;
}
