"use client";

import React, { Suspense } from "react";
import { WerewolfProvider } from "@/features/werewolf/contexts/werewolf-context";
import WerewolfGameUI from "@/features/werewolf/components/werewolf-game-ui";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";

function WerewolfGameContent() {
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
  } = useLobbyInit("Werewolf");

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500 bg-zinc-50">
        Đang tải phòng chơi...
      </div>
    );
  }

  return (
    <WerewolfProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole as "player" | "spectator"}
      hasInitialized={hasInitialized}
      isCreator={isCreator}
    >
      <WerewolfGameUI
        showNameModal={showNameModal}
        setShowNameModal={setShowNameModal}
        hasInitialized={hasInitialized}
        roomId={roomId}
        requestedRole={requestedRole}
        setRequestedRole={setRequestedRole}
        handleJoinRoom={handleJoinRoom}
        playerName={playerName}
      />
    </WerewolfProvider>
  );
}

export default function WerewolfPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">Đang tải...</div>}>
      <WerewolfGameContent />
    </Suspense>
  );
}
