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
        className={`relative aspect-square w-full max-h-full max-w-full rounded-sm shadow-2xl transition-all flex ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"} ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
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
            className={`grid w-full h-full gap-px border transition-colors ${isDarkMode ? "bg-slate-600 border-slate-600" : "bg-slate-300 border-slate-300"}`}
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
                    className={`relative flex items-center justify-center cursor-pointer group ${isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-white hover:bg-slate-50"} transition-colors ${isLastMove && !isWinningCell ? (isDarkMode ? "!bg-yellow-900/40" : "!bg-yellow-100") : ""} ${isWinningCell ? (isDarkMode ? "!bg-red-900/60" : "!bg-red-100") : ""}`}
                  >



                    {/* Piece (Stone -> X / O) */}
                    {cell && (
                      <div
                        className={`absolute flex items-center justify-center w-full h-full z-10 transition-transform duration-200`}
                      >
                        {cell === "B" ? (
                          <svg viewBox="0 0 24 24" className={`w-[85%] h-[85%] text-red-600 ${isDarkMode ? "drop-shadow-[0_0_3px_rgba(220,38,38,0.5)]" : "drop-shadow-sm"}`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                            <line x1="4" y1="4" x2="20" y2="20" />
                            <line x1="20" y1="4" x2="4" y2="20" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className={`w-[85%] h-[85%] text-emerald-500 ${isDarkMode ? "drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]" : "drop-shadow-sm"}`} fill="none" stroke="currentColor" strokeWidth="3.5">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        )}
                      </div>
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
