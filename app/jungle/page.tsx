"use client";

import { Suspense } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { JungleProvider } from "@/features/jungle/contexts/jungle-context";
import { JungleBoard } from "@/features/jungle/components/jungle-board";
import { JungleSidebar } from "@/features/jungle/components/jungle-sidebar";

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
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-7xl mx-auto h-full p-4 lg:p-6">
        {/* Cột trái: Sidebar Lobby */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 h-[500px] lg:h-auto">
          <JungleSidebar isDarkMode={isDarkMode} />
        </div>

        {/* Cột phải: Bàn cờ */}
        <div className="flex-1 flex items-center justify-center min-h-[500px] lg:min-h-0 bg-white/50 rounded-2xl border border-zinc-200 shadow-sm p-4 relative overflow-hidden">
          <JungleBoard />
        </div>
      </div>
    </JungleProvider>
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
