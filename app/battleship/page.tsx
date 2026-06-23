"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import { BattleshipProvider, useBattleship } from "@/features/battleship/contexts/battleship-context";
import { BattleshipSidebar } from "@/features/battleship/components/battleship-sidebar";
import { Board } from "@/features/battleship/components/battleship-board";
import confetti from "canvas-confetti";
import { ActiveAnimation } from "@/features/battleship/types";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { GameRulesModal } from "@/components/game-rules-modal";

export default function BattleshipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          Đang tải bàn cờ Bắn Thuyền...
        </div>
      }
    >
      <BattleshipGameWrapper />
    </Suspense>
  );
}

function BattleshipGameWrapper() {
  const {
    roomId,
    playerName,
    isCreator,
    showNameModal,
    hasInitialized,
    handleJoinRoom,
    requestedRole,
    setRequestedRole,
    setShowNameModal,
  } = useLobbyInit("Battleship");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  if (!hasInitialized && roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <JoinRoomModal
          isOpen={showNameModal}
          gameName="Bắn Thuyền"
          initialName={playerName || ""}
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
    <BattleshipProvider
      roomId={roomId}
      playerName={playerName}
      requestedRole={requestedRole}
      isCreator={isCreator}
      hasInitialized={hasInitialized}
    >
      <BattleshipGameContent 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        setShowNameModal={setShowNameModal}
        hasInitialized={hasInitialized}
        showNameModal={showNameModal}
        playerName={playerName}
        roomId={roomId}
        requestedRole={requestedRole}
        setRequestedRole={setRequestedRole}
        handleJoinRoom={handleJoinRoom}
      />
    </BattleshipProvider>
  );
}

function BattleshipGameContent({ 
  isDarkMode, 
  toggleTheme,
  setShowNameModal,
  hasInitialized,
  showNameModal,
  playerName,
  roomId,
  requestedRole,
  setRequestedRole,
  handleJoinRoom
}: { 
  isDarkMode: boolean;
  toggleTheme: () => void;
  setShowNameModal: (show: boolean) => void;
  hasInitialized: boolean;
  showNameModal: boolean;
  playerName: string;
  roomId: string;
  requestedRole: "player" | "spectator";
  setRequestedRole: (role: "player" | "spectator") => void;
  handleJoinRoom: (name: string) => void;
}) {
  const {
    player1Name,
    player2Name,
    p1Ships,
    p2Ships,
    p1Shots,
    p2Shots,
    myShips,
    winner,
    gamePhase,
    isPlayer1Turn,
    isSpectator,
    activeAnimation,
    handleShipClick,
    handleDrop,
    draggedShipRef,
    handleShoot,
  } = useBattleship();

  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (winner && winner !== "Draw" && winner !== "End") {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [winner]);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;

  const renderBoards = () => {
    if (gamePhase === "waiting") {
      return (
        <div className="flex flex-col items-center justify-center h-full opacity-50 pointer-events-none grayscale">
          <Board
            title="Bảng của bạn"
            ships={[]}
            shots={[]}
            onCellClick={() => {}}
            hideShips={true}
            interactive={false}
            gameStarted={false}
          />
        </div>
      );
    }

    if (gamePhase === "placing") {
      if (isSpectator) {
        return (
          <div className="text-zinc-500 text-center w-full font-medium">
            Đang chờ người chơi xếp thuyền...
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-6 justify-center w-full max-w-[504px] mx-auto">
          {/* Tip Banner */}
          <div className={`p-4 rounded-xl border flex gap-3 text-sm font-medium items-center justify-center shadow-sm ${isDarkMode ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
            <span className="text-xl">💡</span>
            <p><strong>Mẹo:</strong> Nhấp vào thuyền để xoay dọc hoặc ngang. Kéo thả để di chuyển thuyền.</p>
          </div>

          <Board
            title="Bảng của bạn"
            ships={myShips}
            shots={[]}
            onCellClick={() => {}}
            hideShips={false}
            interactive={true}
            isMyBoardForPlacement={true}
            gameStarted={false}
            onShipClick={handleShipClick}
            onDrop={handleDrop}
            draggedShipRef={draggedShipRef}
          />
        </div>
      );
    }

    if (gamePhase === "playing" || gamePhase === "ended") {
      if (isPlayer1) {
        return (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 justify-center w-full">
            <Board
              title="Bảng của bạn"
              ships={p1Ships}
              shots={p2Shots}
              onCellClick={() => {}}
              hideShips={false}
              interactive={false}
              gameStarted={true}
            />
            <Board
              title="Bảng đối thủ"
              ships={p2Ships}
              shots={p1Shots}
              onCellClick={handleShoot}
              hideShips={!winner}
              interactive={!winner}
              gameStarted={true}
              activeAnimation={activeAnimation}
            />
          </div>
        );
      }

      if (isPlayer2) {
        return (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 justify-center w-full">
            <Board
              title="Bảng của bạn"
              ships={p2Ships}
              shots={p1Shots}
              onCellClick={() => {}}
              hideShips={false}
              interactive={false}
              gameStarted={true}
            />
            <Board
              title="Bảng đối thủ"
              ships={p1Ships}
              shots={p2Shots}
              onCellClick={handleShoot}
              hideShips={!winner}
              interactive={!winner}
              gameStarted={true}
              activeAnimation={activeAnimation}
            />
          </div>
        );
      }

      // Spectator
      return (
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 justify-center w-full">
          <Board
            title={`Bảng của ${player1Name || "Đội Xanh"}`}
            ships={p1Ships}
            shots={p2Shots}
            onCellClick={() => {}}
            hideShips={!winner}
            interactive={false}
            gameStarted={true}
            activeAnimation={activeAnimation && activeAnimation.result === "hit" ? undefined : activeAnimation} // Avoid weird visual bugs for specs
          />
          <Board
            title={`Bảng của ${player2Name || "Đội Đỏ"}`}
            ships={p2Ships}
            shots={p1Shots}
            onCellClick={() => {}}
            hideShips={!winner}
            interactive={false}
            gameStarted={true}
          />
        </div>
      );
    }

    return null;
  };

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
        gameId="battleship"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Bắn Thuyền"
        initialName={playerName || ""}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />

      <div className="grid w-full h-full max-h-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        <div className="w-full h-full overflow-hidden">
          <BattleshipSidebar isDarkMode={isDarkMode} />
        </div>
        
        <div className="flex w-full h-full overflow-y-auto overflow-x-hidden p-4">
          <div className="flex flex-col items-center justify-center relative w-full min-h-full mx-auto">
            
            {/* Center Area Banner */}
            <div className={`text-xl font-bold mb-6 tracking-wide uppercase ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>
              {gamePhase === "placing" && !isSpectator && "Sắp xếp Thủy Đội"}
              {gamePhase === "playing" && "Tham chiến"}
              {gamePhase === "ended" && "Trận chiến kết thúc"}
            </div>

            {/* Board Area */}
            {renderBoards()}

          </div>
        </div>
      </div>
    </main>
  );
}
