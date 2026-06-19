"use client";

import { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { GomokuProvider, useGomoku } from "@/features/gomoku/contexts/gomoku-context";
import { GomokuBoard } from "@/features/gomoku/components/gomoku-board";
import { GomokuSidebar } from "@/features/gomoku/components/gomoku-sidebar";
import confetti from "canvas-confetti";
import { User, Sun, Moon } from "lucide-react";

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
  const { winner, gameStarted } = useGomoku();

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
        <div className="fixed right-4 top-4 z-50 flex gap-3">
          <div className="relative group flex justify-center">
            <button
              onClick={() => setShowNameModal(true)}
              className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"}`}
            >
              <User className="w-5 h-5" />
            </button>
            <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Đổi tên người chơi
            </div>
          </div>
          <div className="relative group flex justify-center">
            <button
              onClick={toggleTheme}
              className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${
                isDarkMode
                  ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "bg-white text-slate-800 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {isDarkMode ? "Giao diện sáng" : "Giao diện tối"}
            </div>
          </div>
        </div>
      )}

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Gomoku"
        initialName={playerName}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        <div className="w-full h-full overflow-hidden">
          <GomokuSidebar isDarkMode={isDarkMode} />
        </div>
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
          <GomokuBoard isDarkMode={isDarkMode} isDisabled={!gameStarted || showNameModal} />
        </div>
      </div>
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
