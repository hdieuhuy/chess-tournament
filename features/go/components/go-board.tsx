import React from "react";
import { useGo, BOARD_SIZE } from "../contexts/go-context";

// Helper SVG Grid
const X = (c: number) => `${(c + 0.5) * (100 / BOARD_SIZE)}%`;
const Y = (r: number) => `${(r + 0.5) * (100 / BOARD_SIZE)}%`;

interface GoBoardProps {
  isDarkMode?: boolean;
}

export function GoBoard({ isDarkMode = false }: GoBoardProps) {
  const { board, handleCellClick, lastMove, winner, gameStarted, isSpectator } =
    useGo();

  const isDisabled = !gameStarted || !!winner || isSpectator;

  return (
    <div
      className={`relative mx-auto w-full max-w-[600px] aspect-square bg-[#e3c498] border-4 border-[#8B5A2B] shadow-2xl p-1 sm:p-2 select-none overflow-hidden transition-opacity ${
        isDisabled ? "opacity-80" : "opacity-100"
      }`}
      style={{ maxWidth: "calc(min(600px, 90vw, 100vh - 250px))" }}
    >
      <div className="absolute inset-1 sm:inset-2 border-2 border-[#8B4513]">
        <svg className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: BOARD_SIZE }).map((_, r) => (
            <line
              key={`h${r}`}
              x1={X(0)}
              y1={Y(r)}
              x2={X(BOARD_SIZE - 1)}
              y2={Y(r)}
              stroke="#5C4033"
              strokeWidth="1.5"
            />
          ))}
          {Array.from({ length: BOARD_SIZE }).map((_, c) => (
            <line
              key={`v${c}`}
              x1={X(c)}
              y1={Y(0)}
              x2={X(c)}
              y2={Y(BOARD_SIZE - 1)}
              stroke="#5C4033"
              strokeWidth="1.5"
            />
          ))}
          {[3, 9, 15].map((r) =>
            [3, 9, 15].map((c) => (
              <circle
                key={`star-${r}-${c}`}
                cx={X(c)}
                cy={Y(r)}
                r="4"
                fill="#5C4033"
              />
            ))
          )}
        </svg>

        <div
          className="absolute inset-0 grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isLastMove =
                lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`relative flex items-center justify-center cursor-pointer w-full h-full rounded-full ${
                    !cell && !winner && gameStarted && !isSpectator
                      ? "hover:bg-black/20"
                      : ""
                  }`}
                >
                  {cell && (
                    <div
                      className={`w-[90%] h-[90%] rounded-full shadow-[1px_2px_4px_rgba(0,0,0,0.5)] ${
                        cell === "B"
                          ? "bg-zinc-900"
                          : "bg-zinc-100 border border-zinc-300"
                      }`}
                    />
                  )}
                  {/* Chấm đỏ/đen đánh dấu nước vừa đi */}
                  {isLastMove && (
                    <div
                      className={`absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                        cell === "B" ? "bg-white" : "bg-black"
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
