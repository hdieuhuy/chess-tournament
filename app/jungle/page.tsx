"use client";

import { Suspense, useState } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { JungleProvider, useJungle } from "@/features/jungle/contexts/jungle-context";
import { JungleBoard } from "@/features/jungle/components/jungle-board";
import { JungleSidebar } from "@/features/jungle/components/jungle-sidebar";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { GameRulesModal } from "@/components/game-rules-modal";
import { Menu } from "lucide-react";
import { Sheet } from "@/components/Sheet";

function JungleGameContent() {
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
  } = useLobbyInit("Jungle");

  const [showRulesModal, setShowRulesModal] = useState(false);

  const isDarkMode = false; // Jungle board handles its own theme colors, we use false for sidebar layout

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        Đang kiểm tra thông tin...
      </div>
    );
  }

  if (!hasInitialized && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <JoinRoomModal
          isOpen={showNameModal}
          gameName="Cờ Thú (Jungle)"
          initialName={playerName}
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
    <JungleProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole}
      isCreator={isCreator}
      hasInitialized={hasInitialized}
    >
      {hasInitialized && (
        <GlobalActionMenu
          playerName={playerName || ""}
          onRenameClick={() => setShowNameModal(true)}
          onShowRules={() => setShowRulesModal(true)}
        />
      )}

      <GameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        gameId="jungle"
      />
      <JungleGameLayout
        roomId={roomId}
        isDarkMode={isDarkMode}
        showRulesModal={showRulesModal}
        setShowRulesModal={setShowRulesModal}
        setShowNameModal={setShowNameModal}
      />
    </JungleProvider>
  );
}

function JungleGameLayout({ roomId, isDarkMode, showRulesModal, setShowRulesModal, setShowNameModal }: any) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { winner, gamePhase, isRedTurn, player1Name, player2Name } = useJungle();

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-7xl mx-auto h-full p-4 lg:p-6 overflow-hidden">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 shadow-sm shrink-0">
        <div className="flex flex-col min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
            Phòng: {roomId}
          </span>
          <span className="text-xs font-semibold mt-0.5 truncate text-zinc-800 dark:text-slate-200">
            {winner
              ? `Thắng: ${winner === "Red" ? (player1Name || "Đỏ") : (player2Name || "Xanh")}`
              : gamePhase === "playing"
              ? `Lượt đi: ${isRedTurn ? `Đỏ (${player1Name || "..."})` : `Xanh (${player2Name || "..."})`}`
              : "Chờ bắt đầu..."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg border transition-colors bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cột trái: Sidebar Lobby (Hidden on Mobile) */}
      <div className="hidden lg:block w-full lg:w-80 xl:w-96 shrink-0 h-auto overflow-hidden">
        <JungleSidebar isDarkMode={isDarkMode} />
      </div>

      {/* Cột phải: Bàn cờ */}
      <div className="flex-1 flex items-center justify-center bg-white/50 rounded-2xl border border-zinc-200 shadow-sm p-4 relative overflow-hidden h-full max-h-full">
        <JungleBoard />
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <JungleSidebar isDarkMode={isDarkMode} onReady={() => setIsSidebarOpen(false)} />
        </div>
      </Sheet>
    </div>
  );
}

export default function JunglePage() {
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-zinc-50">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            Đang tải bàn cờ Thú...
          </div>
        }
      >
        <JungleGameContent />
      </Suspense>
    </main>
  );
}
