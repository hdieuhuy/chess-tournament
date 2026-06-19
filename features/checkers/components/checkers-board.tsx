"use client";

import { useCheckers } from "../contexts/checkers-context";
import { FaCrown } from "react-icons/fa";

interface CheckersBoardProps {
  isDarkMode: boolean;
  isDisabled: boolean;
}

export function CheckersBoard({ isDarkMode, isDisabled }: CheckersBoardProps) {
  const {
    board,
    selectedPos,
    lastMove,
    validMoves,
    multiJumpPiece,
    winner,
    isBlackTurn,
    player1Name,
    player2Name,
    playerName,
    handleCellClick,
  } = useCheckers();

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const shouldFlip = isPlayer2; // Flips board if playing as Red

  return (
    <div className="flex w-full flex-col items-center justify-center p-2 sm:p-4 h-full relative">
      <div
        className={`transition-opacity ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        <div className="relative pl-5 pb-5 sm:pl-6 sm:pb-6">
          <div className="absolute top-0 bottom-5 sm:bottom-6 left-0 flex w-5 sm:w-6 flex-col text-xs sm:text-sm font-bold text-zinc-500 select-none">
            {(shouldFlip
              ? [1, 2, 3, 4, 5, 6, 7, 8]
              : [8, 7, 6, 5, 4, 3, 2, 1]
            ).map((n) => (
              <div
                key={n}
                className="flex flex-1 items-center justify-center"
              >
                {n}
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-5 sm:left-6 right-0 flex h-5 sm:h-6 text-xs sm:text-sm font-bold text-zinc-500 select-none">
            {(shouldFlip
              ? ["H", "G", "F", "E", "D", "C", "B", "A"]
              : ["A", "B", "C", "D", "E", "F", "G", "H"]
            ).map((l) => (
              <div
                key={l}
                className="flex flex-1 items-center justify-center"
              >
                {l}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-8 grid-rows-8 w-[88vw] sm:w-[80vw] md:w-[70vh] max-w-[720px] aspect-square border-4 border-[#8B5A2B] shadow-2xl">
            {(shouldFlip ? [...board].reverse() : board).map((row, mappedR) => {
              const r = shouldFlip ? 7 - mappedR : mappedR;
              return (shouldFlip ? [...row].reverse() : row).map((piece, mappedC) => {
                const c = shouldFlip ? 7 - mappedC : mappedC;

                const isLight = (r + c) % 2 === 0;
                const bgClass = isLight ? "bg-[#F0D9B5]" : "bg-[#B58863]";

                const isSelected = selectedPos?.[0] === r && selectedPos?.[1] === c;
                const isLastMove =
                  (lastMove?.from[0] === r && lastMove?.from[1] === c) ||
                  (lastMove?.to[0] === r && lastMove?.to[1] === c);

                const validMove =
                  selectedPos &&
                  validMoves.find(
                    (m) =>
                      m.from[0] === selectedPos[0] &&
                      m.from[1] === selectedPos[1] &&
                      m.to[0] === r &&
                      m.to[1] === c,
                  );

                const isSelectable =
                  !winner &&
                  piece &&
                  ((isBlackTurn &&
                    isPlayer1 &&
                    (piece === "b" || piece === "B")) ||
                    (!isBlackTurn &&
                      isPlayer2 &&
                      (piece === "r" || piece === "R"))) &&
                  (!multiJumpPiece ||
                    (multiJumpPiece[0] === r && multiJumpPiece[1] === c)) &&
                  validMoves.some((m) => m.from[0] === r && m.from[1] === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative w-full h-full flex items-center justify-center ${isSelectable ? "cursor-pointer" : ""} ${bgClass}`}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-400/50 z-10" />
                    )}
                    {isLastMove && !isSelected && (
                      <div className="absolute inset-0 bg-yellow-400/40 z-10" />
                    )}
                    {validMove && (
                      <div className="w-[30%] h-[30%] bg-black/20 rounded-full z-20 pointer-events-none" />
                    )}
                    {piece && (
                      <div
                        className={`relative z-30 w-[80%] h-[80%] flex items-center justify-center ${isSelectable && !isSelected ? "hover:scale-105 transition-transform" : ""}`}
                      >
                        {/* Quân cờ cơ bản */}
                        <div
                          className={`absolute inset-0 rounded-full shadow-md border-4 ${
                            piece.toLowerCase() === "r"
                              ? "bg-red-600 border-red-800"
                              : "bg-zinc-800 border-zinc-950"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 rounded-full border-2 m-1 ${
                              piece.toLowerCase() === "r"
                                ? "border-red-500"
                                : "border-zinc-700"
                            }`}
                          />
                        </div>

                        {/* Nếu là Vua, chồng thêm một quân cờ nữa lên trên */}
                        {(piece === "R" || piece === "B") && (
                          <div
                            className={`absolute inset-0 rounded-full shadow-lg border-4 -translate-y-2 ${
                              piece.toLowerCase() === "r"
                                ? "bg-red-600 border-red-800"
                                : "bg-zinc-800 border-zinc-950"
                            }`}
                          >
                            <div
                              className={`absolute inset-0 rounded-full border-2 m-1 ${
                                piece.toLowerCase() === "r"
                                  ? "border-red-500"
                                  : "border-zinc-700"
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FaCrown
                                className={
                                  piece === "R"
                                    ? "text-yellow-400 text-xl drop-shadow-md"
                                    : "text-yellow-500 text-xl drop-shadow-md"
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
