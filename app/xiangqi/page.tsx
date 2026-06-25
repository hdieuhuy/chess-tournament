"use client";

import { useEffect, useState, Suspense } from "react";
import { useLobbyInit } from "@/features/lobby/hooks/use-lobby-init";
import {
  XiangqiProvider,
  useXiangqi,
} from "@/features/xiangqi/contexts/xiangqi-context";
import { XiangqiBoard } from "@/features/xiangqi/components/xiangqi-board";
import { XiangqiSidebar } from "@/features/xiangqi/components/xiangqi-sidebar";
import { GameRulesModal } from "@/components/game-rules-modal";
import { JoinRoomModal } from "@/features/lobby/components/join-room-modal";
import confetti from "canvas-confetti";
import { FaAngleDoubleLeft, FaAngleLeft, FaAngleRight, FaAngleDoubleRight } from "react-icons/fa";
import { Moon, Sun, Menu } from "lucide-react";
import { piecesMap } from "@/features/xiangqi/constants";
import { GlobalActionMenu } from "@/components/global-action-menu";
import { Sheet } from "@/components/Sheet";

function XiangqiGameContent({ isDarkMode, toggleTheme }: { isDarkMode: boolean, toggleTheme: () => void }) {
  const {
    showNameModal,
    setShowNameModal,
    hasInitialized,
    requestedRole,
    setRequestedRole,
    handleJoinRoom,
  } = useLobbyInit("Xiangqi");

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    playerName,
    roomId,
    winner,
    captures,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    player1Time,
    player2Time,
    isPlayer1,
    isPlayer2,
    gameMode,
    reviewIndex,
    setReviewIndex,
    history,
    gameStarted,
    displayState,
    turnIndex,
  } = useXiangqi();

  // trigger confetti
  useEffect(() => {
    if (winner) {
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

  const shouldFlip = isPlayer2 || playerName === player4Name;
  const p1TimeString = `${Math.floor(player1Time / 60).toString().padStart(2, "0")}:${(player1Time % 60).toString().padStart(2, "0")}`;
  const p2TimeString = `${Math.floor(player2Time / 60).toString().padStart(2, "0")}:${(player2Time % 60).toString().padStart(2, "0")}`;

  const renderCaptures = (color: "r" | "b") => {
    const caps = color === "r" ? captures.r : captures.b;
    if (!caps || caps.length === 0) return null;

    const isMyCapture = (color === "r" && (isPlayer1 || playerName === player3Name)) ||
                        (color === "b" && (isPlayer2 || playerName === player4Name));

    const cleanCaps = caps.map(p => {
      if (p.startsWith("?")) {
        if (isMyCapture) return p[1];
        else return "?";
      }
      return p;
    });

    const counts: Record<string, number> = {};
    cleanCaps.forEach(p => {
      counts[p] = (counts[p] || 0) + 1;
    });

    return (
      <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
        {Object.entries(counts).map(([p, count]) => (
          <div key={p} className="flex items-center">
            <span className={`text-xl sm:text-2xl font-bold font-serif ${isDarkMode ? "text-slate-200 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" : "text-black drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"}`}>
              {p === "?" ? "?" : piecesMap[p]?.text}
            </span>
            {count > 1 && (
              <span className={`text-[10px] sm:text-xs font-bold ml-0.5 ${isDarkMode ? "text-slate-400" : "text-zinc-600"}`}>
                x{count}
              </span>
            )}
          </div>
        ))}
      </div>
    );
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
        gameId="xiangqi"
      />

      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Xiangqi"
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
              Phòng: {roomId} ({gameMode})
            </span>
            <span className={`text-xs font-semibold mt-0.5 truncate ${winner ? "text-green-500" : isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              {winner
                ? `Thắng: ${winner === "r" ? (gameMode === "2v2" ? "Đội Đỏ" : player1Name) : winner === "b" ? (gameMode === "2v2" ? "Đội Đen" : player2Name) : "Hòa"}`
                : gameStarted
                  ? `Lượt: ${gameMode === "2v2"
                    ? turnIndex === 0 ? player1Name : turnIndex === 1 ? player2Name : turnIndex === 2 ? player3Name : player4Name
                    : displayState.isRedTurn ? player1Name : player2Name
                  }`
                  : "Chờ bắt đầu..."
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            {gameStarted && (
              <span className={`font-mono text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                {displayState.isRedTurn ? p1TimeString : p2TimeString}
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
          <XiangqiSidebar isDarkMode={isDarkMode} />
        </div>
        
        {/* Main Board Container */}
        <div className="flex-1 w-full h-full overflow-hidden p-4">
          <div className="flex flex-col items-center justify-center relative w-full h-full max-w-[540px] mx-auto">
            
            {/* Review Controls - Positioned fixed at bottom */}
            {reviewIndex !== null && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl border shadow-2xl bg-slate-900/95 border-slate-700 backdrop-blur-md z-[100]">
                <button
                  onClick={() => setReviewIndex(0)}
                  disabled={reviewIndex === 0}
                  className="p-1.5 sm:p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <FaAngleDoubleLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                  disabled={reviewIndex === 0}
                  className="p-1.5 sm:p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <FaAngleLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-white font-medium text-xs sm:text-sm min-w-[80px] text-center">
                  Nước {reviewIndex} / {history.length}
                </span>
                <button
                  onClick={() => setReviewIndex(Math.min(history.length, reviewIndex + 1))}
                  disabled={reviewIndex === history.length}
                  className="p-1.5 sm:p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <FaAngleRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setReviewIndex(history.length)}
                  disabled={reviewIndex === history.length}
                  className="p-1.5 sm:p-2 text-white disabled:opacity-30 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <FaAngleDoubleRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setReviewIndex(null)}
                  className="ml-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                >
                  Thoát
                </button>
              </div>
            )}

            {/* Top Player (Opponent) */}
            <div className={`flex w-full justify-between items-end mb-4 transition-opacity`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-md ${isDarkMode ? "bg-slate-800 text-white" : "bg-zinc-800 text-white"}`}>
                  {(shouldFlip ? player1Name : player2Name)?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {gameMode === "2v2" 
                      ? `Đội ${shouldFlip ? "Đỏ" : "Đen"} (${(shouldFlip ? player1Name : player2Name) || "..."} & ${(shouldFlip ? player3Name : player4Name) || "..."})` 
                      : (shouldFlip ? player1Name : player2Name) || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>
                      {shouldFlip ? "Đỏ" : "Đen"}
                    </span>
                    {renderCaptures(shouldFlip ? "b" : "r")}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}>
                {shouldFlip ? p1TimeString : p2TimeString}
              </div>
            </div>

            {/* Board */}
            <XiangqiBoard
              isDarkMode={isDarkMode}
              isDisabled={!gameStarted || (!!winner && reviewIndex === null)} 
            />

            {/* Bottom Player (You) */}
            <div className={`flex w-full justify-between items-start mt-4 transition-opacity`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold shadow-sm ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-zinc-200 text-zinc-800"}`}>
                  {(shouldFlip ? player2Name : player1Name)?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                    {gameMode === "2v2" 
                      ? `Đội ${shouldFlip ? "Đen" : "Đỏ"} (${(shouldFlip ? player2Name : player1Name) || "..."} & ${(shouldFlip ? player4Name : player3Name) || "..."})` 
                      : (shouldFlip ? player2Name : player1Name) || "Đang chờ..."}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm opacity-60 ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>
                      {shouldFlip ? "Đen" : "Đỏ"}
                    </span>
                    {renderCaptures(shouldFlip ? "r" : "b")}
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-mono font-medium tracking-wider px-4 py-2 rounded-lg border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}>
                {shouldFlip ? p2TimeString : p1TimeString}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <Sheet isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} title="Menu & Phòng chơi">
        <div className="h-full w-full p-4 overflow-hidden">
          <XiangqiSidebar isDarkMode={isDarkMode} />
        </div>
      </Sheet>
    </main>
  );
}

function XiangqiGameWrapper() {
  const {
    roomId,
    playerName,
    isCreator,
    showNameModal,
    hasInitialized,
    handleJoinRoom,
    requestedRole,
    setRequestedRole,
  } = useLobbyInit("Xiangqi");

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("xiangqiTheme");
    if (savedTheme === "light") setIsDarkMode(false);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("xiangqiTheme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  return (
    <>
      <JoinRoomModal
        isOpen={showNameModal}
        gameName="Xiangqi"
        initialName={playerName || ""}
        hasRoomId={!!roomId}
        requestedRole={requestedRole}
        onRoleChange={setRequestedRole}
        onSubmit={handleJoinRoom}
      />
      
      {!showNameModal && hasInitialized && (
        <XiangqiProvider
          roomId={roomId}
          playerName={playerName}
          requestedRole={requestedRole}
          isCreator={isCreator}
          hasInitialized={hasInitialized}
        >
          <XiangqiGameContent
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </XiangqiProvider>
      )}
    </>
  );
}

export default function XiangqiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <XiangqiGameWrapper />
    </Suspense>
  );
}
