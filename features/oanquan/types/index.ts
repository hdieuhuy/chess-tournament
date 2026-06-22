export type Cell = { 
  stones: number; 
  quan: number; 
};

export type GamePhase = "waiting" | "playing" | "ended";

export type AnimationState = {
  isAnimating: boolean;
  dropIndex: number | null;
  captureIndices: number[];
  selectedCell: number | null;
};
