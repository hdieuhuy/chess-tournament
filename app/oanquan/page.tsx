"use client";

import { Suspense, useState } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { OAnQuanProvider, useOAnQuan } from "@/features/oanquan/contexts/oanquan-context";
import { OAnQuanBoard } from "@/features/oanquan/components/oanquan-board";
import { OAnQuanSidebar } from "@/features/oanquan/components/oanquan-sidebar";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { GameRulesModal } from "@/components/game-rules-modal";

function OAnQuanGameContent() {
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
  } = useLobbyInit("OAnQuan");

  const [showRulesModal, setShowRulesModal] = useState(false);

  // O An Quan does not currently have a theme toggle like Gomoku, but we can pass `isDarkMode={false}`
  const isDarkMode = false;

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
          gameName="Ô Ăn Quan"
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
    <OAnQuanProvider
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
        gameId="oanquan"
      />
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-7xl mx-auto h-full p-4 lg:p-6">
        {/* Cột trái: Sidebar Lobby */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 h-[500px] lg:h-auto">
          <OAnQuanSidebar isDarkMode={isDarkMode} />
        </div>

        {/* Cột phải: Bàn cờ */}
        <div className="flex-1 flex items-center justify-center min-h-[500px] lg:min-h-0 bg-white/50 dark:bg-slate-800/50 rounded-2xl border shadow-sm p-4 relative overflow-hidden">
          <OAnQuanBoard />
        </div>
      </div>
    </OAnQuanProvider>
  );
}

export default function OAnQuanPage() {
  // Use bg-zinc-50 to match Gomoku, Chess, Xiangqi
  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center transition-colors duration-300 overflow-hidden bg-zinc-50">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            Đang tải bàn cờ Ô Ăn Quan...
          </div>
        }
      >
        <OAnQuanGameContent />
      </Suspense>
    </main>
  );
}
