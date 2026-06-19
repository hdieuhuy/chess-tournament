export interface Move {
  from: [number, number];
  to: [number, number];
}

export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

export interface ChessHistory {
  board: (string | null)[][];
  isWhiteTurn: boolean;
  turnIndex: number;
  winner: string | null;
  castlingRights: CastlingRights;
  enPassantTarget: [number, number] | null;
  captures: { w: string[]; b: string[] };
  lastMove: Move | null;
  player1Time: number;
  player2Time: number;
}

export interface PromotionPending {
  r: number;
  c: number;
  fr: number;
  fc: number;
  board: (string | null)[][];
  epTarget: [number, number] | null;
  castlingRights: CastlingRights;
  captures: { w: string[]; b: string[] };
  color: "W" | "B";
}

export interface AnimatingMove {
  id: string;
  fr: number;
  fc: number;
  r: number;
  c: number;
}

export interface ChessState {
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  player3Name: string | null;
  player4Name: string | null;
  spectators: string[];
  board: (string | null)[][];
  isWhiteTurn: boolean;
  winner: string | null;
  castlingRights: CastlingRights;
  enPassantTarget: [number, number] | null;
  captures: { w: string[]; b: string[] };
  lastMove: Move | null;
  history: ChessHistory[];
  gameMode: "1v1" | "2v2";
  turnIndex: number; // 0: White 1, 1: Black 1, 2: White 2, 3: Black 2
  undoRequestedBy: string | null;
  gameStarted: boolean;
  readyPlayers: string[];
  player1Time: number;
  player2Time: number;
  initialTime: number;
}

export interface ChessContextValue extends ChessState {
  roomId: string | null;
  playerName: string;
  isSpectator: boolean;
  isPlayer1: boolean;
  isPlayer2: boolean;
  selectedPos: [number, number] | null;
  animatingMove: AnimatingMove | null;
  promotionPending: PromotionPending | null;
  reviewIndex: number | null;
  isInReview: boolean;
  displayState: ChessHistory | Pick<ChessState, "board" | "isWhiteTurn" | "turnIndex" | "winner" | "castlingRights" | "enPassantTarget" | "captures" | "lastMove" | "player1Time" | "player2Time">;

  handleCellClick: (r: number, c: number) => void;
  handlePromotionSelect: (piece: string) => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2 | 3 | 4) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleStartClick: () => void;
  handleResign: () => void;
  handleChangeGameMode: (mode: "1v1" | "2v2") => void;
  handleTimeChange: (newTimeSeconds: number) => void;
  setReviewIndex: (index: number | null | ((prev: number | null) => number | null)) => void;
}
