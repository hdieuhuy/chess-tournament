import React from "react";
import { useChess } from "../contexts/chess-context";
import { PIECE_IMAGES } from "../constants";
import { isLegalMove } from "../utils/game-logic";

export function ChessBoard({
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
    animatingMove,
    promotionPending,
    enPassantTarget,
    isWhiteTurn,
    castlingRights,
    handleCellClick,
    handlePromotionSelect,
  } = useChess();

  const shouldFlip = isPlayer2 || playerName === player4Name;
  const currentBoard = displayState.board;

  return (
    <div
      className={`transition-opacity ${isDisabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
    >
      <style>{`
        @keyframes slidePiece {
          0% { transform: translate(var(--start-x), var(--start-y)); }
          100% { transform: translate(0px, 0px); }
        }
        .animating-piece {
          animation: slidePiece 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
      <div className="relative pl-5 pb-5 sm:pl-6 sm:pb-6">
        {/* Tọa độ hàng dọc (1-8) */}
        <div className="absolute top-0 bottom-5 sm:bottom-6 left-0 flex w-5 sm:w-6 flex-col text-xs sm:text-sm font-bold text-zinc-500 select-none">
          {(shouldFlip
            ? [1, 2, 3, 4, 5, 6, 7, 8]
            : [8, 7, 6, 5, 4, 3, 2, 1]
          ).map((n) => (
            <div key={n} className="flex flex-1 items-center justify-center">
              {n}
            </div>
          ))}
        </div>

        {/* Tọa độ hàng ngang (A-H) */}
        <div className="absolute bottom-0 left-5 sm:left-6 right-0 flex h-5 sm:h-6 text-xs sm:text-sm font-bold text-zinc-500 select-none">
          {(shouldFlip
            ? ["H", "G", "F", "E", "D", "C", "B", "A"]
            : ["A", "B", "C", "D", "E", "F", "G", "H"]
          ).map((l) => (
            <div key={l} className="flex flex-1 items-center justify-center">
              {l}
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-8 grid-rows-8 w-[88vw] max-w-[600px] aspect-square border-4 border-[#8B5A2B] shadow-2xl">
          {/* Promotion Modal Overlay */}
          {promotionPending && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl flex gap-4">
                {["q", "r", "b", "n"].map((type) => {
                  const piece =
                    promotionPending.color === "W" ? type.toUpperCase() : type;
                  return (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromotionSelect(piece);
                      }}
                      className="w-14 h-14 sm:w-20 sm:h-20 hover:bg-blue-50 hover:scale-105 transition-all rounded-lg flex items-center justify-center border-2 border-transparent hover:border-blue-200 shadow-sm bg-zinc-50"
                    >
                      <img
                        src={PIECE_IMAGES[piece]}
                        alt={piece}
                        className="w-10 h-10 sm:w-16 sm:h-16"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {(() => {
            return (
              shouldFlip ? [...currentBoard].reverse() : currentBoard
            ).map((row, mappedR) => {
              const r = shouldFlip ? 7 - mappedR : mappedR;
              return (shouldFlip ? [...row].reverse() : row).map(
                (piece, mappedC) => {
                  const c = shouldFlip ? 7 - mappedC : mappedC;

                  const isLight = (r + c) % 2 === 0;
                  const bgClass = isLight ? "bg-[#F0D9B5]" : "bg-[#B58863]";

                  const isSelected =
                    !isInReview &&
                    selectedPos?.[0] === r &&
                    selectedPos?.[1] === c;
                  const isLastMove =
                    (displayState.lastMove?.from[0] === r &&
                      displayState.lastMove?.from[1] === c) ||
                    (displayState.lastMove?.to[0] === r &&
                      displayState.lastMove?.to[1] === c);
                  
                  // Chỉ cần tô màu nước đi hợp lệ khi đang chơi thực sự
                  let isValidTarget = false;
                  let canCapture = false;

                  if (!isInReview && selectedPos) {
                     isValidTarget = !piece && isLegalMove(
                        board,
                        selectedPos[0],
                        selectedPos[1],
                        r,
                        c,
                        enPassantTarget,
                        isWhiteTurn,
                        castlingRights
                      );
                     canCapture = !!piece && isLegalMove(
                        board,
                        selectedPos[0],
                        selectedPos[1],
                        r,
                        c,
                        enPassantTarget,
                        isWhiteTurn,
                        castlingRights
                      );
                  }

                  const isAnimatingThisPiece =
                    animatingMove &&
                    animatingMove.r === r &&
                    animatingMove.c === c;
                  let startX = 0,
                    startY = 0;
                  if (isAnimatingThisPiece) {
                    const visualFromR = shouldFlip
                      ? 7 - animatingMove.fr
                      : animatingMove.fr;
                    const visualFromC = shouldFlip
                      ? 7 - animatingMove.fc
                      : animatingMove.fc;
                    const visualToR = shouldFlip
                      ? 7 - animatingMove.r
                      : animatingMove.r;
                    const visualToC = shouldFlip
                      ? 7 - animatingMove.c
                      : animatingMove.c;
                    startX = (visualFromC - visualToC) * 100;
                    startY = (visualFromR - visualToR) * 100;
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center ${bgClass} cursor-pointer transition-colors ${
                        isSelected
                          ? "ring-4 ring-inset ring-blue-500 bg-blue-200"
                          : isLastMove
                            ? "bg-yellow-200/60"
                            : "hover:opacity-90"
                      }`}
                    >
                      {isValidTarget && (
                        <div className="absolute z-10 h-3 w-3 rounded-full bg-black/20" />
                      )}
                      {canCapture && (
                        <div className="absolute inset-0 z-10 rounded-full ring-4 ring-inset ring-black/20" />
                      )}
                      {piece && (
                        <div
                          className={`relative z-20 w-[80%] h-[80%] ${
                            isAnimatingThisPiece ? "animating-piece" : ""
                          }`}
                          style={
                            isAnimatingThisPiece
                              ? ({
                                  "--start-x": `${startX}%`,
                                  "--start-y": `${startY}%`,
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          <img
                            src={PIECE_IMAGES[piece]}
                            alt={piece}
                            className="w-full h-full drop-shadow-md"
                          />
                        </div>
                      )}
                    </div>
                  );
                }
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
