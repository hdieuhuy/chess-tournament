import React, { useState, useEffect } from "react";
import { useGomoku } from "../contexts/gomoku-context";
import { BOARD_SIZE } from "../constants";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GomokuBoardProps {
  isDarkMode: boolean;
  isDisabled: boolean;
}

export function GomokuBoard({ isDarkMode, isDisabled }: GomokuBoardProps) {
  const { board, winningCells, lastMove, winner, isBlackNext, handleCellClick } = useGomoku();
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset selected cell when turn changes or a game ends
  useEffect(() => {
    setSelectedCell(null);
  }, [isBlackNext, winner]);

  const onCellTap = (rowIndex: number, colIndex: number) => {
    if (isDisabled) return;
    if (board[rowIndex][colIndex]) return;

    if (isMobile) {
      if (selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex) {
        handleCellClick(rowIndex, colIndex);
        setSelectedCell(null);
      } else {
        setSelectedCell([rowIndex, colIndex]);
      }
    } else {
      handleCellClick(rowIndex, colIndex);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full items-center justify-center p-2 sm:p-4 pb-16 lg:pb-4 overflow-hidden">
      {/* Board Wrapper - Scales automatically to fit height/width */}
      <div
        className={`relative aspect-square w-full max-h-full max-w-full rounded-sm shadow-2xl transition-all flex ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"} ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        style={{ maxWidth: "min(100%, 72vh)" }}
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
                const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => onCellTap(rowIndex, colIndex)}
                    className={`relative flex items-center justify-center cursor-pointer group ${isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-white hover:bg-slate-50"} transition-colors ${isLastMove && !isWinningCell ? (isDarkMode ? "!bg-yellow-900/40" : "!bg-yellow-100") : ""} ${isWinningCell ? (isDarkMode ? "!bg-red-900/60" : "!bg-red-100") : ""}`}
                  >
                    {/* Selection preview / target */}
                    {isSelected && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center animate-pulse">
                        <div className="w-[85%] h-[85%] rounded-full border-2 border-indigo-500 bg-indigo-500/20" />
                      </div>
                    )}

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

      {/* Mobile Confirm Action Bar */}
      <AnimatePresence>
        {isMobile && selectedCell && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl shadow-2xl border backdrop-blur-md z-30 whitespace-nowrap ${isDarkMode ? "bg-slate-800/95 border-slate-700 text-slate-200" : "bg-white/95 border-zinc-200 text-zinc-800"}`}
          >
            <span className="text-xs sm:text-sm font-semibold">
              Ô đã chọn: <span className="text-indigo-500 font-bold">{String.fromCharCode(65 + selectedCell[0])}{selectedCell[1] + 1}</span>
            </span>
            <button
              onClick={() => {
                handleCellClick(selectedCell[0], selectedCell[1]);
                setSelectedCell(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-lg shadow-md transition-all text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Xác nhận đi
            </button>
            <button
              onClick={() => setSelectedCell(null)}
              className={`flex items-center justify-center p-1.5 rounded-lg border transition-all active:scale-95 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
