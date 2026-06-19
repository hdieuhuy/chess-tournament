import React from "react";
import { useXiangqi } from "../contexts/xiangqi-context";
import { piecesMap } from "../constants";

// Hàm tiện ích: tính tọa độ điểm giao trên bàn cờ cho SVG
const X = (c: number) => `${(c + 0.5) * (100 / 9)}%`;
const Y = (r: number) => `${(r + 0.5) * (100 / 10)}%`;

export function XiangqiBoard({
  isDarkMode,
  isDisabled,
}: {
  isDarkMode: boolean;
  isDisabled: boolean;
}) {
  const {
    board,
    displayState,
    isPlayer2,
    playerName,
    player4Name,
    isInReview,
    selectedPos,
    handleCellClick,
    validMoves,
    inCheck,
  } = useXiangqi();

  const shouldFlip = isPlayer2 || playerName === player4Name;
  const currentBoard = displayState.board;

  return (
    <div
      className={`transition-opacity ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
    >
      <div
        className="relative mx-auto max-w-[600px] w-[90vw] aspect-[9/10] bg-[#e3c498] border-2 sm:border-4 border-[#8B4513] shadow-xl p-1 sm:p-2 select-none overflow-hidden"
      >
        <div className="absolute inset-1 sm:inset-2 border-2 border-[#8B4513]">
          <svg className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#8B4513" strokeWidth="1.5">
              {/* Lưới nửa trên */}
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 8 }).map((_, c) => (
                  <rect
                    key={`top-${r}-${c}`}
                    x={X(c)}
                    y={Y(r)}
                    width={`${100 / 9}%`}
                    height={`${100 / 10}%`}
                    fill="none"
                  />
                )),
              )}
              {/* Lưới nửa dưới */}
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 8 }).map((_, c) => (
                  <rect
                    key={`bottom-${r}-${c}`}
                    x={X(c)}
                    y={Y(r + 5)}
                    width={`${100 / 9}%`}
                    height={`${100 / 10}%`}
                    fill="none"
                  />
                )),
              )}
              {/* Cửu cung trên */}
              <line x1={X(3)} y1={Y(0)} x2={X(5)} y2={Y(2)} />
              <line x1={X(5)} y1={Y(0)} x2={X(3)} y2={Y(2)} />
              {/* Cửu cung dưới */}
              <line x1={X(3)} y1={Y(7)} x2={X(5)} y2={Y(9)} />
              <line x1={X(5)} y1={Y(7)} x2={X(3)} y2={Y(9)} />
            </g>
          </svg>
        </div>

        {/* Chữ Sông (楚河 漢界) */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-10 sm:px-16 text-[#8B4513] font-bold text-xl sm:text-3xl opacity-50 tracking-[1em] sm:tracking-[2em] pointer-events-none">
          <span>楚河</span>
          <span>漢界</span>
        </div>

        {/* Tọa độ ngang */}
        <div className="absolute -bottom-5 sm:-bottom-7 left-0 right-0 flex h-5 sm:h-6 text-[10px] sm:text-xs font-bold text-zinc-500 justify-around ml-2">
          {(shouldFlip
            ? ["9", "8", "7", "6", "5", "4", "3", "2", "1"]
            : ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
          ).map((l, idx) => (
            <span key={l} style={{ left: X(idx) }} className="absolute -translate-x-1/2">
              {l}
            </span>
          ))}
        </div>

        {/* Bàn cờ & Quân cờ */}
        <div className="absolute inset-1 sm:inset-2 grid grid-cols-9 grid-rows-10">
          {(() => {
            return (
              shouldFlip ? [...currentBoard].reverse() : currentBoard
            ).map((row, mappedR) => {
              const r = shouldFlip ? 9 - mappedR : mappedR;
              return (shouldFlip ? [...row].reverse() : row).map(
                (piece, mappedC) => {
                  const c = shouldFlip ? 8 - mappedC : mappedC;
                  const isSelected =
                    !isInReview &&
                    selectedPos?.[0] === r &&
                    selectedPos?.[1] === c;
                  const isLastMove =
                    (displayState.lastMove?.from[0] === r &&
                      displayState.lastMove?.from[1] === c) ||
                    (displayState.lastMove?.to[0] === r &&
                      displayState.lastMove?.to[1] === c);
                  
                  const isValidMoveTarget = validMoves?.some(([vr, vc]) => vr === r && vc === c);
                  
                  let displayPiece = piece;
                  let isFaceDown = false;
                  if (piece && piece.startsWith("?")) {
                    isFaceDown = true;
                  }

                  const isKingInCheck = 
                    (inCheck === "r" && piece === "K") || 
                    (inCheck === "b" && piece === "k");

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer group`}
                    >
                      {/* Vùng highlight khi click hoặc là last move */}
                      {isSelected && (
                        <div className="absolute w-[80%] h-[80%] border-2 border-blue-500 rounded-full animate-pulse z-10 bg-blue-500/20" />
                      )}
                      {isLastMove && !isSelected && (
                        <div className="absolute w-[80%] h-[80%] border-2 border-yellow-400 rounded-full z-10 bg-yellow-400/20" />
                      )}
                      {isKingInCheck && (
                        <div className="absolute w-[90%] h-[90%] border-4 border-red-500 rounded-full animate-pulse z-10 bg-red-500/30" />
                      )}

                      {/* Hiển thị nước có thể đi / quân có thể ăn */}
                      {isValidMoveTarget && !piece && (
                        <div className="absolute w-[25%] h-[25%] rounded-full bg-blue-500/50 z-10" />
                      )}
                      {isValidMoveTarget && piece && (
                        <div className="absolute w-[90%] h-[90%] rounded-full border-4 border-red-500/60 z-30" />
                      )}

                      {/* Hover effect (Chỉ active khi đang chơi và click được) */}
                      {!isDisabled && !piece && !isValidMoveTarget && (
                        <div className="absolute w-[40%] h-[40%] rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      )}

                      {piece && (
                        <div
                          className={`w-[85%] h-[85%] rounded-full flex items-center justify-center shadow-md border-2 sm:border-[3px] border-[#b07b46] z-20 transition-transform ${
                            isSelected ? "scale-110" : ""
                          } ${
                            isFaceDown
                              ? "bg-[#d4a373] text-transparent"
                              : "bg-[#f5deb3] " +
                                piecesMap[displayPiece!]?.color
                          }`}
                        >
                          {!isFaceDown && (
                            <span className="text-xl sm:text-3xl font-bold font-serif leading-none drop-shadow-sm">
                              {piecesMap[displayPiece!]?.text}
                            </span>
                          )}
                          {isFaceDown && (
                            <span className="text-[#8B4513] opacity-30 text-xs sm:text-sm font-bold">
                              ?
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
