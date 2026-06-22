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
        className={`relative aspect-square w-full max-h-full max-w-full rounded-sm shadow-2xl transition-all flex ${isDarkMode ? "bg-[#332918]" : "bg-[#e5b76b]"} ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
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
            className={`grid w-full h-full gap-0 transition-colors`}
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
                    className={`relative flex items-center justify-center cursor-pointer group ${isWinningCell ? "bg-red-500/40" : ""}`}
                  >
                    {/* Background Intersection Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical line */}
                      <div className={`absolute left-1/2 w-[1px] -translate-x-1/2 ${isDarkMode ? "bg-black/60" : "bg-black/50"}
                        ${rowIndex === 0 ? "top-1/2 bottom-0" : rowIndex === BOARD_SIZE - 1 ? "top-0 bottom-1/2" : "top-0 bottom-0"}
                      `} />
                      {/* Horizontal line */}
                      <div className={`absolute top-1/2 h-[1px] -translate-y-1/2 ${isDarkMode ? "bg-black/60" : "bg-black/50"}
                        ${colIndex === 0 ? "left-1/2 right-0" : colIndex === BOARD_SIZE - 1 ? "left-0 right-1/2" : "left-0 right-0"}
                      `} />
                    </div>

                    {/* Hoshi (Star Points) */}
                    {[4, 12, 20].includes(rowIndex) && [4, 12, 20].includes(colIndex) && (
                      <div className={`absolute w-[4px] h-[4px] md:w-[6px] md:h-[6px] rounded-full ${isDarkMode ? "bg-black/80" : "bg-black/70"} z-0 pointer-events-none`} />
                    )}

                    {/* Highlight on hover for empty cell */}
                    {!cell && !winner && (
                      <div className={`absolute w-[70%] h-[70%] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0 ${isDarkMode ? "bg-white/20" : "bg-black/10"}`} />
                    )}

                    {/* Piece (Stone) */}
                    {cell && (
                      <div
                        className={`absolute w-[85%] h-[85%] rounded-full z-10 transition-transform duration-200 ${isLastMove ? "scale-105" : ""}`}
                        style={{
                          background: cell === "B" 
                            ? "radial-gradient(circle at 30% 30%, #555, #111)" 
                            : "radial-gradient(circle at 30% 30%, #fff, #bbb)",
                          boxShadow: "2px 2px 4px rgba(0,0,0,0.5)"
                        }}
                      >
                        {/* Last move indicator dot inside the piece */}
                        {isLastMove && (
                          <div className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${cell === "B" ? "bg-white/80" : "bg-red-500/80"}`} />
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
