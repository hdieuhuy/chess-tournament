"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { GoProvider, useGo, KOMI } from "@/features/go/contexts/go-context";
import { GoSidebar } from "@/features/go/components/go-sidebar";
import { GoBoard } from "@/features/go/components/go-board";
import { GameRulesModal } from "@/components/game-rules-modal";
import confetti from "canvas-confetti";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { Menu } from "lucide-react";
import { Sheet } from "@/components/Sheet";

export default function GoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          Đang tải bàn cờ Vây...
        </div>
      }
    >
      <GoGameWrapper />
    </Suspense>
  );
}

function GoGameWrapper() {
  const {
    roomId,
    playerName,
    isCreator,
    showNameModal,
    hasInitialized,
    handleJoinRoom,
    requestedRole,
    setRequestedRole,
    setShowNameModal,
  } = useLobbyInit("Go");

  const [isDarkMode, setIsDarkMode] = useState(false); // Light mode mặc định

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  if (!hasInitialized && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <JoinRoomModal
          isOpen={showNameModal}
          gameName="Cờ Vây"
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
    <GoProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole}
      isCreator={isCreator}
      hasInitialized={hasInitialized}
    >
      <GoGameContent 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        setShowNameModal={setShowNameModal}
        hasInitialized={hasInitialized}
        showNameModal={showNameModal}
        playerName={playerName}
        roomId={roomId}
        requestedRole={requestedRole}
        setRequestedRole={setRequestedRole}
        handleJoinRoom={handleJoinRoom}
      />
    </GoProvider>
  );
}

function GoGameContent({ 
  isDarkMode, 
  toggleTheme,
  setShowNameModal,
  hasInitialized,
  showNameModal,
  playerName,
  roomId,
  requestedRole,
  setRequestedRole,
  handleJoinRoom
}: { 
  isDarkMode: boolean;
  toggleTheme: () => void;
  setShowNameModal: (show: boolean) => void;
  hasInitialized: boolean;
  showNameModal: boolean;
  playerName: string;
  roomId: string;
  requestedRole: "player" | "spectator";
  setRequestedRole: (role: "player" | "spectator") => void;
  handleJoinRoom: (name: string) => void;
}) {
  const {
    player1Name,
    player2Name,
    player1Time,
    player2Time,
    isBlackNext,
    winner,
    gameStarted,
    captures,
    finalScore,
  } = useGo();
  
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (winner && winner !== "Draw" && winner !== "End") {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [winner]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
        gameId="go"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Cờ Vây"
        initialName={playerName || ""}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="flex flex-col lg:grid w-full h-full max-h-full max-w-[1600px] flex-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 shadow-sm shrink-0">
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
              Phòng: {roomId}
            </span>
            <span className={`text-xs font-semibold mt-0.5 truncate ${winner ? "text-green-500" : isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              {winner === "Draw"
                ? "🤝 Hòa cờ!"
                : winner === "End"
                ? "🏁 Kết thúc ván đấu!"
                : winner
                ? `Thắng: ${winner === "B" ? player1Name : player2Name}`
                : gameStarted
                ? `Lượt đi: ${isBlackNext ? `Đen (${player1Name || "..."})` : `Trắng (${player2Name || "..."})`}`
                : "Chờ bắt đầu..."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {gameStarted && (
              <span className={`font-mono text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                {isBlackNext ? formatTime(player1Time) : formatTime(player2Time)}
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-lg border transition-colors ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:block w-full h-full overflow-hidden">
          <GoSidebar isDarkMode={isDarkMode} />
        </div>
        
        {/* Main Board Container */}
        <div className="flex-1 w-full h-full overflow-hidden p-4">
          <div className="flex flex-col items-center justify-center relative w-full h-full max-w-[600px] mx-auto pb-10">
            {/* Player 2 (Trắng - Đi sau) - Phía trên */}
            <div className={`flex w-full justify-between items-end mb-4 transition-opacity shrink-0 ${!player2Name ? "opacity-50" : "opacity-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-zinc-200 text-zinc-800"}`}>
                  {player2Name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {player2Name || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 font-bold ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>
                      Trắng
                    </span>
                    {gameStarted && <span className="text-xs px-2 py-0.5 bg-zinc-200 rounded text-zinc-700 font-medium border border-zinc-300">Tù binh: {captures.W}</span>}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-zinc-200 text-zinc-900"} ${!isBlackNext && !winner && gameStarted ? "ring-2 ring-blue-500 shadow-blue-200" : ""}`}>
                {formatTime(player2Time)}
              </div>
            </div>

            {/* Board */}
            <GoBoard isDarkMode={isDarkMode} />

            {/* Player 1 (Đen - Đi trước) - Phía dưới */}
            <div className={`flex w-full justify-between items-start mt-4 transition-opacity shrink-0 ${!player1Name ? "opacity-50" : "opacity-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-md bg-zinc-900 text-white`}>
                  {player1Name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {player1Name || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 font-bold ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>
                      Đen
                    </span>
                    {gameStarted && <span className="text-xs px-2 py-0.5 bg-zinc-200 rounded text-zinc-700 font-medium border border-zinc-300">Tù binh: {captures.B}</span>}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-zinc-200 text-zinc-900"} ${isBlackNext && !winner && gameStarted ? "ring-2 ring-blue-500 shadow-blue-200" : ""}`}>
                {formatTime(player1Time)}
              </div>
            </div>

            {/* Bảng điểm đếm đất (Luật Trung Quốc) */}
            {finalScore && (
              <div className="mt-8 flex flex-col w-full bg-amber-50/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200 shadow-lg">
                <h3 className="text-center font-bold text-lg mb-4 text-amber-900 uppercase tracking-widest">Kết Quả Chung Cuộc</h3>
                <div className="flex w-full justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <span className="block text-sm text-amber-700/80 font-bold uppercase mb-1">Đội Đen</span>
                    <span className="text-5xl font-black text-amber-950 drop-shadow-sm">{finalScore.black}</span>
                    <div className="text-xs text-amber-800/80 mt-2 bg-white/60 px-2 py-1 rounded-md shadow-sm inline-block font-medium">
                      {finalScore.blackTerritory} đất + {finalScore.blackStones} quân
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-300 px-6 italic">VS</div>
                  <div className="text-center flex-1">
                    <span className="block text-sm text-amber-700/80 font-bold uppercase mb-1">Đội Trắng</span>
                    <span className="text-5xl font-black text-amber-950 drop-shadow-sm">{finalScore.white}</span>
                    <div className="text-xs text-amber-800/80 mt-2 bg-white/60 px-2 py-1 rounded-md shadow-sm inline-block font-medium">
                      {finalScore.whiteTerritory} đất + {finalScore.whiteStones} quân + {KOMI} Komi
                    </div>
                  </div>
                </div>
                <p className="text-xs text-amber-700/60 font-medium text-center mt-2 border-t border-amber-200/60 pt-3">
                  Luật đếm đất (Trung Quốc): Tù binh đã bắt không tính vào điểm.<br/>Bên nào nhiều đất và quân trên bàn cờ hơn sẽ thắng.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <GoSidebar isDarkMode={isDarkMode} onReady={() => setIsSidebarOpen(false)} />
        </div>
      </Sheet>
    </main>
  );
}
