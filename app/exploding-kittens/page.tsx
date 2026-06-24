"use client";

import { Suspense, useState } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { GameRulesModal } from "@/components/game-rules-modal";
import { ExplodingKittensProvider } from "@/features/exploding-kittens/contexts/exploding-kittens-context";
import { ExplodingKittensSidebar } from "@/features/exploding-kittens/components/exploding-kittens-sidebar";
import { ExplodingKittensBoard } from "@/features/exploding-kittens/components/exploding-kittens-board";

function ExplodingKittensGameContent() {
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
  } = useLobbyInit("Exploding Kittens");

  const [showRulesModal, setShowRulesModal] = useState(false);

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <ExplodingKittensProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole as "player" | "spectator"}
      hasInitialized={hasInitialized}
      isCreator={isCreator}
    >
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
          gameId="exploding-kittens"
        />

        <JoinRoomModal
          isOpen={showNameModal}
          gameName="Exploding Kittens"
          initialName={playerName}
          hasRoomId={!!roomId}
          requestedRole={requestedRole}
          onRoleChange={setRequestedRole}
          onSubmit={handleJoinRoom}
        />

        <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
          <div className="w-full h-full overflow-y-auto no-scrollbar">
            <ExplodingKittensSidebar />
          </div>
          <div className="flex items-center justify-center w-full h-full overflow-hidden relative">
            <ExplodingKittensBoard />
          </div>
        </div>
      </main>
    </ExplodingKittensProvider>
  );
}

export default function ExplodingKittensPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Đang tải...</div>}>
      <ExplodingKittensGameContent />
    </Suspense>
  );
}
