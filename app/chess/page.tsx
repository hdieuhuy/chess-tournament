"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { GameRulesModal } from "@/components/game-rules-modal";
import { Modal } from "@/components/Modal";
import { ChessProvider, useChess } from "@/features/chess/contexts/chess-context";
import { ChessSidebar } from "@/features/chess/components/chess-sidebar";
import { ChessBoard } from "@/features/chess/components/chess-board";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import confetti from "canvas-confetti";
import { PIECE_IMAGES } from "@/features/chess/constants";

export default function ChessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChessGameWrapper />
    </Suspense>
  );
}

function ChessGameWrapper() {
  const {
    roomId,
    playerName,
    isCreator,
    showNameModal,
    hasInitialized,
    handleJoinRoom,
    requestedRole,
    setRequestedRole,
  } = useLobbyInit("Chess");

  const [isDarkMode, setIsDarkMode] = useState(true);

  if (!hasInitialized && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <JoinRoomModal
          isOpen={showNameModal}
          gameName="Chess"
          initialName={playerName || ""}
          hasRoomId={!!roomId}
          requestedRole={requestedRole}
          onRoleChange={setRequestedRole}
          onSubmit={handleJoinRoom}
        />
      </div>
    );
  }

  if (!roomId || !playerName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        Đang khởi tạo phòng chơi...
      </div>
    );
  }

  return (
    <ChessProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole}
      isCreator={isCreator}
      hasInitialized={hasInitialized}
    >
      <ChessGameContent />
    </ChessProvider>
  );
}

function ChessGameContent() {
  const {
    playerName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    player1Time,
    player2Time,
    isWhiteTurn,
    winner,
    history,
    displayState,
    gameStarted,
    isSpectator,
    gameMode,
    turnIndex,
    isInReview,
    reviewIndex,
    setReviewIndex,
    undoRequestedBy,
    handleAcceptUndo,
    handleRejectUndo,
    roomId,
    captures,
  } = useChess();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    showNameModal,
    setShowNameModal,
    hasInitialized,
    requestedRole,
    setRequestedRole,
    handleJoinRoom,
    isCreator,
  } = useLobbyInit("Chess");

  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("chessTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("chessTheme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (winner) {
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
      };
      const interval = setInterval(frame, 250);
      setTimeout(() => clearInterval(interval), 3000);
      return () => clearInterval(interval);
    }
  }, [winner]);

  return (
    <main
      className={`flex h-[100dvh] flex-col items-center justify-center p-4 lg:p-6 transition-colors duration-300 overflow-hidden ${isDarkMode ? "bg-slate-900" : "bg-zinc-50"}`}
    >
      {/* Floating Buttons: Settings & Theme */}
      {hasInitialized && (
        <GlobalActionMenu
          playerName={playerName || ""}
          onRenameClick={() => setShowNameModal(true)}
          hasThemeToggle={true}
          isDarkMode={isDarkMode}
          onThemeToggle={toggleTheme}
          onShowRules={() => setShowRulesModal(true)}
        />
      )}

      <GameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        gameId="chess"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Cờ Vua"
        initialName={playerName || ""}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        <div className="w-full h-full overflow-hidden">
          <ChessSidebar isDarkMode={isDarkMode} />
        </div>
        <div className="flex w-full h-full overflow-y-auto overflow-x-hidden p-4">
          <div className="flex flex-col items-center justify-center relative w-full min-h-full max-w-[600px] mx-auto">
            {/* Player 2 (Top) */}
            <div className={`flex w-full justify-between items-end mb-4 transition-opacity ${!player2Name ? "opacity-50" : "opacity-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-md ${isDarkMode ? "bg-slate-800 text-white" : "bg-zinc-800 text-white"}`}>
                  {player2Name ? player2Name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {gameMode === "2v2" ? `Đội Đen (${player2Name || "..."} & ${player4Name || "..."})` : player2Name || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>Đen</span>
                    {captures.b.length > 0 && (
                      <div className="flex items-center gap-0.5 ml-2">
                        {captures.b.map((piece, idx) => (
                          <img key={idx} src={PIECE_IMAGES[piece]} alt={piece} className="w-4 h-4 opacity-80" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}>
                {formatTime(player2Time)}
              </div>
            </div>

            {/* Board */}
            <ChessBoard
              isDarkMode={isDarkMode}
              isDisabled={!gameStarted || showNameModal || (!!winner && !isInReview)}
            />

            {/* Player 1 (Bottom) */}
            <div className={`flex w-full justify-between items-start mt-4 transition-opacity ${!player1Name ? "opacity-50" : "opacity-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-zinc-200 text-zinc-800"}`}>
                  {player1Name ? player1Name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {gameMode === "2v2" ? `Đội Trắng (${player1Name || "..."} & ${player3Name || "..."})` : player1Name || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>Trắng</span>
                    {captures.w.length > 0 && (
                      <div className="flex items-center gap-0.5 ml-2">
                        {captures.w.map((piece, idx) => (
                          <img key={idx} src={PIECE_IMAGES[piece]} alt={piece} className="w-4 h-4 opacity-80" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}>
                {formatTime(player1Time)}
              </div>
            </div>

            {/* Status Text & Review Controls */}
            {isInReview ? (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 px-4 py-2 rounded-full shadow-2xl border z-[100] bg-slate-900/95 border-slate-700 backdrop-blur-md">
                <button
                  onClick={() =>
                    setReviewIndex((prev) =>
                      prev !== null ? Math.max(0, prev - 1) : 0
                    )
                  }
                  disabled={reviewIndex === 0}
                  className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-slate-700 hover:bg-slate-600 text-white"
                  title="Trước"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-indigo-400 text-xs uppercase tracking-wider">Đang xem lại</span>
                  <span className="font-medium text-sm text-slate-200">
                    Nước đi {reviewIndex} / {history.length}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setReviewIndex((prev) =>
                      prev !== null
                        ? Math.min(history.length, prev + 1)
                        : 0
                    )
                  }
                  disabled={(reviewIndex ?? 0) >= history.length}
                  className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-slate-700 hover:bg-slate-600 text-white"
                  title="Sau"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setReviewIndex(null)}
                  className="ml-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-sm"
                  title="Thoát xem lại"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center mt-6 flex flex-col justify-center">
                <p className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
                  {winner === "Draw"
                    ? "🤝 Hòa cờ!"
                    : winner
                    ? `🎉 Chiến thắng: ${
                        winner === "W"
                          ? gameMode === "2v2"
                            ? "Đội Trắng"
                            : player1Name
                          : gameMode === "2v2"
                          ? "Đội Đen"
                          : player2Name
                      }!`
                    : gameStarted ? `Lượt đi: ${
                        gameMode === "2v2"
                          ? turnIndex === 0
                            ? player1Name
                            : turnIndex === 1
                            ? player2Name
                            : turnIndex === 2
                            ? player3Name
                            : player4Name
                          : displayState.isWhiteTurn
                          ? "Trắng"
                          : "Đen"
                      }` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
