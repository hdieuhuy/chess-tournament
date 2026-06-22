export type Piece = string | null;

export type BoardState = Piece[][];

export type Move = {
  from: [number, number];
  to: [number, number];
};

export type GamePhase = "waiting" | "playing" | "ended";

export interface JungleGameState {
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  player3Name: string | null;
  player4Name: string | null;
  spectators: string[];
  board: BoardState;
  isRedTurn: boolean;
  turnIndex: number; // 0: P1(Red), 1: P2(Blue), 2: P3(Red), 3: P4(Blue)
  winner: string | null;
  lastMove: Move | null;
  history: any[];
  undoRequestedBy: string | null;
  gameStarted: boolean;
  readyPlayers: string[];
  player1Time: number; // Red Team Time
  player2Time: number; // Blue Team Time
  gameMode: "1v1" | "2v2";
  initialTime: number;
}
