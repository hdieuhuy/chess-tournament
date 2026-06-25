"use client";

import { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { GomokuProvider, useGomoku } from "@/features/gomoku/contexts/gomoku-context";
import { GomokuBoard } from "@/features/gomoku/components/gomoku-board";
import { GameRulesModal } from "@/components/game-rules-modal";
import { GomokuSidebar } from "@/features/gomoku/components/gomoku-sidebar";
import confetti from "canvas-confetti";
import { User, Sun, Moon, Menu } from "lucide-react";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { Sheet } from "@/components/Sheet";

function GomokuGameContent() {
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
  } = useLobbyInit("Gomoku");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gomokuTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("gomokuTheme", newMode ? "dark" : "light");
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
    <GomokuProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole}
      hasInitialized={hasInitialized}
      isCreator={isCreator}
    >
      <GomokuLayout
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
    </GomokuProvider>
  );
}

function GomokuLayout({
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
  const {
    winner,
    gameStarted,
    gameMode,
    turnIndex,
    isBlackNext,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    elapsedTime,
  } = useGomoku();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const statusText = winner
    ? `Thắng: ${winner === "B" ? (gameMode === "2v2" ? "Đội X" : player1Name) : gameMode === "2v2" ? "Đội O" : player2Name}`
    : gameStarted
      ? `Lượt: ${gameMode === "2v2"
        ? turnIndex === 0 ? player1Name : turnIndex === 1 ? player2Name : turnIndex === 2 ? player3Name : player4Name
        : isBlackNext ? player1Name : player2Name
      }`
      : "Chờ bắt đầu...";

  // Hiệu ứng pháo hoa chúc mừng khi có người chiến thắng
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

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
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
        gameId="gomoku"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Gomoku"
        initialName={playerName}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="flex flex-col lg:grid w-full h-full max-h-full max-w-[1600px] flex-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
              Phòng: {roomId} ({gameMode})
            </span>
            <span className={`text-xs font-semibold mt-0.5 truncate ${winner ? "text-green-500" : isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              {statusText}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {gameStarted && (
              <span className={`font-mono text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                {formatTime(elapsedTime)}
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
          <GomokuSidebar isDarkMode={isDarkMode} />
        </div>

        {/* Board Container */}
        <div className="flex items-center justify-center w-full h-full overflow-hidden flex-1">
          <GomokuBoard isDarkMode={isDarkMode} isDisabled={!gameStarted || showNameModal} />
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <GomokuSidebar isDarkMode={isDarkMode} onReady={() => setIsSidebarOpen(false)} />
        </div>
      </Sheet>
    </main>
  );
}

export default function GomokuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ...
        </div>
      }
    >
      <GomokuGameContent />
    </Suspense>
  );
}
