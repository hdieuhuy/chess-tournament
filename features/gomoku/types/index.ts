export type GameMode = "1v1" | "2v2";

export interface GomokuState {
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  player3Name: string | null;
  player4Name: string | null;
  spectators: string[];
  board: (string | null)[][];
  isBlackNext: boolean;
  winner: string | null;
  winningCells: number[][];
  lastMove: [number, number] | null;
  history: any[];
  undoRequestedBy: string | null;
  gameStartTime: number | null;
  gameStarted: boolean;
  readyPlayers: string[];
  gameMode: GameMode;
  turnIndex: number;
}
