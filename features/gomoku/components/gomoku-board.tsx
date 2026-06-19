import React from "react";
import { useGomoku } from "../contexts/gomoku-context";
import { BOARD_SIZE } from "../constants";

interface GomokuBoardProps {
  isDarkMode: boolean;
  isDisabled: boolean;
}

export function GomokuBoard({ isDarkMode, isDisabled }: GomokuBoardProps) {
  const { board, winningCells, lastMove, winner, handleCellClick } = useGomoku();

  return (
    <div className="flex w-full h-full items-center justify-center p-2 sm:p-4">
      {/* Board Wrapper - Scales automatically to fit height/width */}
      <div
        className={`relative aspect-square w-full max-h-full max-w-full rounded-sm shadow-xl transition-all flex ${isDarkMode ? "bg-slate-800" : "bg-white"} ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        style={{ maxWidth: "min(100%, 85vh)" }}
      >
        <div className="absolute inset-4 sm:inset-6">
          {/* Tọa độ hàng dọc (Chữ A-Y) */}
          <div className={`absolute top-0 bottom-0 -left-4 sm:-left-6 flex w-4 sm:w-6 flex-col text-[8px] sm:text-[10px] font-bold select-none ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <div key={`row-label-${i}`} className="flex flex-1 items-center justify-center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>

          {/* Tọa độ hàng ngang (Số 1-25) */}
          <div className={`absolute -bottom-4 sm:-bottom-6 left-0 right-0 flex h-4 sm:h-6 text-[8px] sm:text-[10px] font-bold select-none ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <div key={`col-label-${i}`} className="flex flex-1 items-center justify-center">
                {i + 1}
              </div>
            ))}
          </div>

          <div
            className={`grid w-full h-full gap-0 border transition-colors ${isDarkMode ? "border-slate-600" : "border-zinc-800"}`}
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWinningCell = winningCells.some(
                  ([r, c]) => r === rowIndex && c === colIndex,
                );
                const isLastMove = lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`flex items-center justify-center border cursor-pointer transition-colors ${isDarkMode ? "border-slate-600/40" : "border-zinc-800/40"} ${
                      !cell && !winner
                        ? isDarkMode
                          ? "hover:bg-white/10"
                          : "hover:bg-black/10"
                        : ""
                    } ${isWinningCell ? "bg-red-400/50" : isLastMove ? (isDarkMode ? "bg-yellow-400/30" : "bg-yellow-200") : ""}`}
                  >
                    {cell && (
                      <span
                        className={`font-bold leading-none ${
                          cell === "B"
                            ? isDarkMode ? "text-green-400" : "text-green-600"
                            : isDarkMode ? "text-red-400" : "text-red-500"
                        }`}
                        style={{ fontSize: "min(3vw, 3vh, 1.25rem)" }}
                      >
                        {cell === "B" ? "X" : "O"}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
