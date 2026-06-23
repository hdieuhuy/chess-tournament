"use client";

import { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { CheckersProvider, useCheckers } from "@/features/checkers/contexts/checkers-context";
import { CheckersBoard } from "@/features/checkers/components/checkers-board";
import { GameRulesModal } from "@/components/game-rules-modal";
import { CheckersSidebar } from "@/features/checkers/components/checkers-sidebar";
import confetti from "canvas-confetti";
import { User, Sun, Moon } from "lucide-react";
import { GlobalActionMenu } from "@/components/global-action-menu";

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
  const { winner, gameStarted } = useCheckers();
  const [showRulesModal, setShowRulesModal] = useState(false);

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

      <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        <div className="w-full h-full overflow-hidden">
          <CheckersSidebar isDarkMode={isDarkMode} />
        </div>
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
          <CheckersBoard isDarkMode={isDarkMode} isDisabled={!gameStarted || showNameModal} />
        </div>
      </div>
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
