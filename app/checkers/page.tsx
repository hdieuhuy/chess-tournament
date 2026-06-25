"use client";

import { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { CheckersProvider, useCheckers } from "@/features/checkers/contexts/checkers-context";
import { CheckersBoard } from "@/features/checkers/components/checkers-board";
import { GameRulesModal } from "@/components/game-rules-modal";
import { CheckersSidebar } from "@/features/checkers/components/checkers-sidebar";
import confetti from "canvas-confetti";
import { User, Sun, Moon, Menu } from "lucide-react";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { Sheet } from "@/components/Sheet";

function CheckersGameContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    hasInitialized,
    playerName,
    roomId,
    requestedRole,
    setRequestedRole,
    showNameModal,
    setShowNameModal,
    isCheckingStorage,
    handleJoinRoom,
    isCreator,
  } = useLobbyInit("Checkers");

  useEffect(() => {
    const savedTheme = localStorage.getItem("checkersTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("checkersTheme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <CheckersProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole as "player" | "spectator"}
      hasInitialized={hasInitialized}
      isCreator={isCreator}
    >
      <CheckersLayout
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        showNameModal={showNameModal}
        setShowNameModal={setShowNameModal}
        hasInitialized={hasInitialized}
        roomId={roomId}
        requestedRole={requestedRole}
        setRequestedRole={setRequestedRole}
        handleJoinRoom={handleJoinRoom}
        playerName={playerName}
      />
    </CheckersProvider>
  );
}

function CheckersLayout({
  isDarkMode,
  toggleTheme,
  showNameModal,
  setShowNameModal,
  hasInitialized,
  roomId,
  requestedRole,
  setRequestedRole,
  handleJoinRoom,
  playerName,
}: any) {
  const { winner, gameStarted, isBlackTurn, player1Name, player2Name } = useCheckers();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (winner && winner !== "Draw") {
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

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winner]);

  const statusText = winner === "Draw"
    ? "🤝 Hòa cờ!"
    : winner
    ? `Thắng: ${winner === "B" ? player1Name : player2Name}`
    : gameStarted
    ? `Lượt đi: ${isBlackTurn ? `Đen (${player1Name || "..."})` : `Đỏ (${player2Name || "..."})`}`
    : "Chờ bắt đầu...";

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
        gameId="checkers"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Checkers"
        initialName={playerName}
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
              {statusText}
            </span>
          </div>
          <div className="flex items-center gap-3">
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
          <CheckersSidebar isDarkMode={isDarkMode} />
        </div>

        {/* Main Board Container */}
        <div className="flex-1 w-full h-full overflow-hidden p-4 flex items-center justify-center">
          <CheckersBoard isDarkMode={isDarkMode} isDisabled={!gameStarted || showNameModal} />
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <CheckersSidebar isDarkMode={isDarkMode} onReady={() => setIsSidebarOpen(false)} />
        </div>
      </Sheet>
    </main>
  );
}

export default function CheckersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn Cờ Đam...
        </div>
      }
    >
      <CheckersGameContent />
    </Suspense>
  );
}
