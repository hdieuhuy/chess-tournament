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
import { Menu, Shuffle, Trash2, CheckCircle2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";

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
    elapsedTime,
    handleRandomPlacement,
    handleClearBoard,
    handleFinishPlacement,
    placingPlayers,
  } = useBattleship();

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
        <div className="flex flex-col gap-4 justify-center w-full max-w-[504px] mx-auto items-center">
          {/* Tip Banner */}
          <div className={`flex p-2.5 sm:p-3 rounded-xl border gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm font-medium items-center justify-center shadow-sm w-full max-w-[320px] sm:max-w-none ${isDarkMode ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
            <span className="text-base sm:text-xl">💡</span>
            <p><strong>Mẹo:</strong> Nhấp vào thuyền để xoay dọc hoặc ngang. Kéo thả để di chuyển.</p>
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

          {/* Mobile-only Placement Actions */}
          {!placingPlayers.includes(playerName) && (
            <div className="lg:hidden flex flex-col gap-2 w-full max-w-[320px] mt-2 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleRandomPlacement}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md border text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Ngẫu nhiên
                </button>
                <button
                  onClick={handleClearBoard}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md border text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa bàn
                </button>
              </div>
              <button
                onClick={handleFinishPlacement}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Hoàn tất xếp tàu
              </button>
            </div>
          )}
        </div>
      );
    }

    if (gamePhase === "playing" || gamePhase === "ended") {
      if (isPlayer1) {
        return (
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 justify-center items-center w-full max-h-full overflow-hidden">
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
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 justify-center items-center w-full max-h-full overflow-hidden">
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
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-16 justify-center items-center w-full max-h-full overflow-hidden">
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

      <div className="flex flex-col lg:grid w-full h-full max-h-full max-w-[1600px] flex-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-8 overflow-hidden pt-14 lg:pt-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 shadow-sm shrink-0">
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
              Phòng: {roomId}
            </span>
            <span className={`text-xs font-semibold mt-0.5 truncate ${winner ? "text-green-500" : isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              {winner === "Draw"
                ? "🤝 Hòa trận!"
                : winner === "End"
                ? "🏁 Trận đấu kết thúc!"
                : winner
                ? `Thắng: ${winner === "P1" ? player1Name : player2Name}`
                : gamePhase === "playing"
                ? `Lượt bắn: ${isPlayer1Turn ? (player1Name || "Xanh") : (player2Name || "Đỏ")}`
                : gamePhase === "placing"
                ? "Đang xếp tàu..."
                : "Chờ bắt đầu..."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {gamePhase === "playing" && !winner && (
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
          <BattleshipSidebar isDarkMode={isDarkMode} />
        </div>
        
        <div className="flex-1 w-full h-full overflow-hidden p-4">
          <div className="flex flex-col items-center justify-center relative w-full h-full mx-auto">
            
            {/* Center Area Banner */}
            <div className={`text-xl font-bold mb-6 tracking-wide uppercase ${isDarkMode ? "text-slate-300" : "text-zinc-600"} shrink-0`}>
              {gamePhase === "placing" && !isSpectator && "Sắp xếp Thủy Đội"}
              {gamePhase === "playing" && "Tham chiến"}
              {gamePhase === "ended" && "Trận chiến kết thúc"}
            </div>

            {/* Board Area */}
            {renderBoards()}

          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <BattleshipSidebar isDarkMode={isDarkMode} onReady={() => setIsSidebarOpen(false)} />
        </div>
      </Sheet>
    </main>
  );
}
