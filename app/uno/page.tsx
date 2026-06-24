"use client";

import { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { UnoProvider } from "@/features/uno/contexts/uno-context";
import { UnoBoard } from "@/features/uno/components/uno-board";
import { GameRulesModal } from "@/components/game-rules-modal";
import { UnoSidebar } from "@/features/uno/components/uno-sidebar";
import { GlobalActionMenu } from "@/components/global-action-menu";

function UnoGameContent() {
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
  } = useLobbyInit("Uno");

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <UnoProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole as "player" | "spectator"}
      hasInitialized={hasInitialized}
      isCreator={isCreator}
    >
      <UnoLayout
        showNameModal={showNameModal}
        setShowNameModal={setShowNameModal}
        hasInitialized={hasInitialized}
        roomId={roomId}
        requestedRole={requestedRole}
        setRequestedRole={setRequestedRole}
        handleJoinRoom={handleJoinRoom}
        playerName={playerName}
      />
    </UnoProvider>
  );
}

function UnoLayout({
  showNameModal,
  setShowNameModal,
  hasInitialized,
  roomId,
  requestedRole,
  setRequestedRole,
  handleJoinRoom,
  playerName,
}: any) {
  const [showRulesModal, setShowRulesModal] = useState(false);

  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center p-4 lg:p-6 overflow-hidden bg-zinc-50">
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
        gameId="uno"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Uno"
        initialName={playerName}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        <div className="w-full h-full overflow-y-auto no-scrollbar">
          <UnoSidebar />
        </div>
        <div className="flex items-center justify-center w-full h-full min-h-0 overflow-hidden relative">
          <UnoBoard />
        </div>
      </div>
    </main>
  );
}

export default function UnoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnoGameContent />
    </Suspense>
  );
}
