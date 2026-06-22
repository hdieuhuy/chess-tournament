import React, { useEffect } from "react";
import { useJungle } from "../contexts/jungle-context";
import { piecesMap, getPieceIcon, isValidMove } from "../constants";
import confetti from "canvas-confetti";

export function JungleBoard() {
  const {
    board,
    isRedTurn,
    turnIndex,
    winner,
    handleCellClick,
    gamePhase,
    playerName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    selectedPos,
    lastMove,
    player1Time,
    player2Time,
    gameMode,
  } = useJungle();

  const isPlayer2 = playerName === player2Name;
  const isPlayer4 = playerName === player4Name;
  
  // Viewer rotation: If Player 2 or 4 (Blue team), flip the board so their pieces are at the bottom
  const isViewInverted = isPlayer2 || isPlayer4;

  useEffect(() => {
    if (winner) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          zIndex: 9999,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          zIndex: 9999,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [winner]);

  const redTeamNames = gameMode === "2v2" ? [player1Name, player3Name].filter(Boolean) : [player1Name].filter(Boolean);
  const blueTeamNames = gameMode === "2v2" ? [player2Name, player4Name].filter(Boolean) : [player2Name].filter(Boolean);

  const topTeamNames = isViewInverted ? redTeamNames : blueTeamNames;
  const bottomTeamNames = isViewInverted ? blueTeamNames : redTeamNames;

  const topPlayerRole = isViewInverted ? "Đội Đỏ (Đi trước)" : "Đội Xanh (Đi sau)";
  const bottomPlayerRole = isViewInverted ? "Đội Xanh (Đi sau)" : "Đội Đỏ (Đi trước)";

  const topPlayerTime = isViewInverted ? player1Time : player2Time;
  const bottomPlayerTime = isViewInverted ? player2Time : player1Time;

  // turnIndex: 0=P1(Red), 1=P2(Blue), 2=P3(Red), 3=P4(Blue)
  const isRedTeamTurn = gameMode === "2v2" ? (turnIndex === 0 || turnIndex === 2) : isRedTurn;
  const isBlueTeamTurn = gameMode === "2v2" ? (turnIndex === 1 || turnIndex === 3) : !isRedTurn;

  const isTopPlayerTurn = isViewInverted ? isRedTeamTurn : isBlueTeamTurn;
  const isBottomPlayerTurn = isViewInverted ? isBlueTeamTurn : isRedTeamTurn;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const activeTopPlayerName = isViewInverted
    ? (gameMode === "2v2" ? (turnIndex === 0 ? player1Name : player3Name) : player1Name)
    : (gameMode === "2v2" ? (turnIndex === 1 ? player2Name : player4Name) : player2Name);

  const activeBottomPlayerName = isViewInverted
    ? (gameMode === "2v2" ? (turnIndex === 1 ? player2Name : player4Name) : player2Name)
    : (gameMode === "2v2" ? (turnIndex === 0 ? player1Name : player3Name) : player1Name);

  return (
    <div className="flex w-full flex-col items-center justify-center h-full pb-4 sm:pb-10">
      
      {/* Top Team (Opponent) */}
      <div className={`flex w-full max-w-[400px] justify-between items-end mb-3 transition-opacity ${gamePhase === "waiting" ? "opacity-50" : "opacity-100"}`}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs sm:text-sm font-semibold opacity-80 ${isViewInverted ? "text-red-600" : "text-blue-600"}`}>
              {topPlayerRole}
            </span>
          </div>
          <div className="flex gap-2">
            {topTeamNames.map((name, i) => {
              const isActive = isTopPlayerTurn && gamePhase === "playing" && activeTopPlayerName === name;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold shadow-md text-white ${isViewInverted ? "bg-red-600" : "bg-blue-600"} ${isActive ? "ring-2 ring-yellow-400 shadow-yellow-400/50 scale-110 transition-transform" : ""}`}>
                    {name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className={`font-bold text-sm sm:text-base text-zinc-900 ${isActive ? "text-yellow-600" : ""}`}>
                    {name || "Đang chờ..."}
                  </span>
                </div>
              );
            })}
            {topTeamNames.length === 0 && (
              <span className="font-bold text-sm sm:text-base text-zinc-500">Đang chờ...</span>
            )}
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-mono font-medium tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-white border-zinc-200 text-zinc-900 shadow-sm ${isTopPlayerTurn && gamePhase === "playing" ? "bg-yellow-50 border-yellow-300" : ""}`}>
          {formatTime(topPlayerTime)}
        </div>
      </div>

      {/* Jungle Board */}
      <div
        className={`p-1.5 sm:p-2 md:p-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 sm:border-[6px] border-[#3E2723] bg-[#5D4037] transition-all duration-500 ${
          gamePhase === "waiting" ? "opacity-70 grayscale-[0.2]" : "opacity-100"
        }`}
      >
        <div
          className="grid w-[95vw] max-w-[400px] aspect-[7/9] gap-[2px] bg-[#3E2723] rounded-md overflow-hidden"
          style={{
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridTemplateRows: "repeat(9, minmax(0, 1fr))",
          }}
        >
          {(() => {
            const shouldFlip = isViewInverted;
            return (shouldFlip ? [...board].reverse() : board).map(
              (row, mappedR) => {
                const r = shouldFlip ? 8 - mappedR : mappedR;
                return (shouldFlip ? [...row].reverse() : row).map(
                  (piece, mappedC) => {
                    const c = shouldFlip ? 6 - mappedC : mappedC;
                    const isSelected =
                      selectedPos?.[0] === r && selectedPos?.[1] === c;
                    const isLastMove =
                      (lastMove?.from[0] === r &&
                        lastMove?.from[1] === c) ||
                      (lastMove?.to[0] === r && lastMove?.to[1] === c);
                    const canMoveTo =
                      selectedPos &&
                      !piece &&
                      isValidMove(
                        board,
                        selectedPos[0],
                        selectedPos[1],
                        r,
                        c,
                        isRedTurn ? "r" : "b",
                      );
                    const canCapture =
                      selectedPos &&
                      piece &&
                      isValidMove(
                        board,
                        selectedPos[0],
                        selectedPos[1],
                        r,
                        c,
                        isRedTurn ? "r" : "b",
                      );

                    // Cell Backgrounds
                    let cellBg = "bg-[#81C784]"; // Grass
                    let label = "";
                    if (
                      r >= 3 &&
                      r <= 5 &&
                      (c === 1 || c === 2 || c === 4 || c === 5)
                    ) {
                      cellBg = "bg-[#4FC3F7]"; // River
                    } else if (
                      (r === 0 && c === 3) ||
                      (r === 8 && c === 3)
                    ) {
                      cellBg = "bg-[#D32F2F]"; // Den
                      label = "Hang";
                    } else if (
                      (r === 0 && (c === 2 || c === 4)) ||
                      (r === 1 && c === 3) ||
                      (r === 8 && (c === 2 || c === 4)) ||
                      (r === 7 && c === 3)
                    ) {
                      cellBg =
                        "bg-[#FFB300] border-2 border-dashed border-[#FF6F00]"; // Trap
                      label = "Bẫy";
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`relative flex flex-col items-center justify-center cursor-pointer overflow-hidden ${cellBg} ${!piece && !winner ? "hover:brightness-90" : ""}`}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {isLastMove && !isSelected && (
                          <div className="absolute inset-0 bg-yellow-400/50 z-[5] pointer-events-none" />
                        )}

                        {label && !piece && (
                          <span className="absolute z-10 text-xs sm:text-sm font-bold text-black/50 select-none pointer-events-none drop-shadow-sm">
                            {label}
                          </span>
                        )}

                        {piece && (
                          <div
                            className={`
                              relative z-20 flex flex-col items-center justify-center 
                              w-[85%] h-[85%] rounded-full 
                              border-2 ${isLastMove ? "border-yellow-500" : "border-black/20"} 
                              shadow-[0_4px_8px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)]
                              ${piecesMap[piece].bg} ${piecesMap[piece].color}
                              ${isSelected ? "ring-4 ring-yellow-400 brightness-110" : ""}
                              ${canCapture ? "ring-4 ring-red-500/80" : ""}
                              transition-all duration-200
                            `}
                          >
                            <span className="text-[16px] sm:text-[20px] md:text-2xl leading-none flex items-center justify-center drop-shadow-md">
                              {getPieceIcon(piece)}
                            </span>
                            <span className="text-[9px] sm:text-[11px] font-bold leading-none mt-0.5 select-none opacity-90">
                              {piecesMap[piece].label}
                            </span>
                          </div>
                        )}

                        {!piece && canMoveTo && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500/80 rounded-full z-20 shadow-sm" />
                        )}
                      </div>
                    );
                  },
                );
              },
            );
          })()}
        </div>
      </div>

      {/* Bottom Team (Me) */}
      <div className={`flex w-full max-w-[400px] justify-between items-start mt-3 sm:mt-4 transition-opacity ${gamePhase === "waiting" ? "opacity-50" : "opacity-100"}`}>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            {bottomTeamNames.map((name, i) => {
              const isActive = isBottomPlayerTurn && gamePhase === "playing" && activeBottomPlayerName === name;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold shadow-md text-white ${isViewInverted ? "bg-blue-600" : "bg-red-600"} ${isActive ? "ring-2 ring-yellow-400 shadow-yellow-400/50 scale-110 transition-transform" : ""}`}>
                    {name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className={`font-bold text-sm sm:text-base text-zinc-900 ${isActive ? "text-yellow-600" : ""}`}>
                    {name || "Đang chờ..."}
                    {playerName === name && " (Bạn)"}
                  </span>
                </div>
              );
            })}
            {bottomTeamNames.length === 0 && (
              <span className="font-bold text-sm sm:text-base text-zinc-500">Đang chờ...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs sm:text-sm font-semibold opacity-80 ${isViewInverted ? "text-blue-600" : "text-red-600"}`}>
              {bottomPlayerRole}
            </span>
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-mono font-medium tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-white border-zinc-200 text-zinc-900 shadow-sm ${isBottomPlayerTurn && gamePhase === "playing" ? "bg-yellow-50 border-yellow-300" : ""}`}>
          {formatTime(bottomPlayerTime)}
        </div>
      </div>

    </div>
  );
}
