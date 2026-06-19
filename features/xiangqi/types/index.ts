export interface Move {
  from: [number, number];
  to: [number, number];
}

export interface XiangqiHistory {
  board: (string | null)[][];
  isRedTurn: boolean;
  turnIndex: number;
  winner: string | null;
  lastMove: Move | null;
  captures: { r: string[]; b: string[] };
  player1Time: number;
  player2Time: number;
}

export interface XiangqiContextValue {
  roomId: string | null;
  playerName: string;
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  player3Name: string | null;
  player4Name: string | null;
  spectators: string[];
  
  board: (string | null)[][];
  isRedTurn: boolean;
  winner: string | null;
  lastMove: Move | null;
  captures: { r: string[]; b: string[] };
  gameMode: "1v1" | "2v2";
  chessVariant: "standard" | "coup";
  turnIndex: number;
  history: XiangqiHistory[];
  undoRequestedBy: string | null;
  gameStarted: boolean;
  readyPlayers: string[];
  player1Time: number;
  player2Time: number;
  
  // Local state for UI
  isPlayer1: boolean;
  isPlayer2: boolean;
  isSpectator: boolean;
  selectedPos: [number, number] | null;
  validMoves: [number, number][];
  inCheck: "r" | "b" | null;
  reviewIndex: number | null;
  isInReview: boolean;
  displayState: {
    board: (string | null)[][];
    isRedTurn: boolean;
    lastMove: Move | null;
  };
  initialTime: number;

  // Actions
  handleCellClick: (r: number, c: number) => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (slot: number) => void;
  handleBecomeSpectator: () => void;
  handleChangeGameMode: (mode: "1v1" | "2v2") => void;
  handleChangeVariant: (variant: "standard" | "coup") => void;
  handleTimeChange: (seconds: number) => void;
  handleStartClick: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleResign: () => void;
  setReviewIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedPos: React.Dispatch<React.SetStateAction<[number, number] | null>>;
}
