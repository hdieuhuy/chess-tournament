import React, { useState } from "react";
import Link from "next/link";
import { useGo } from "../contexts/go-context";
import { Gamepad2, Eye, Users, DoorOpen, RotateCcw, Link as LinkIcon, PartyPopper, Undo2, Flag, SkipForward, Crown } from "lucide-react";

interface GoSidebarProps {
  isDarkMode: boolean;
  onReady?: () => void;
}

export function GoSidebar({ isDarkMode, onReady }: GoSidebarProps) {
  const [activeTab, setActiveTab] = useState<"players" | "spectators">("players");
  const [linkCopied, setLinkCopied] = useState(false);

  const {
    playerName,
    player1Name,
    player2Name,
    hostName,
    gameStarted,
    winner,
    readyPlayers,
    isBlackNext,
    history,
    spectators,
    isSpectator,
    handleKickPlayer,
    handleStartClick,
    handleRequestUndo,
    handlePass,
    handleResign,
    resetGame,
    undoRequestedBy,
    handleAcceptUndo,
    handleRejectUndo,
    handleSlotClick,
    handleBecomeSpectator,
  } = useGo();

  const handleStartReady = () => {
    handleStartClick();
    onReady?.();
  };

  const playersCount = [player1Name, player2Name].filter(Boolean).length;
  const maxPlayers = 2;

  const canUndo = () => {
    if (isSpectator || history.length < 2) return false;
    const isPlayer1 = playerName === player1Name;
    const isPlayer2 = playerName === player2Name;
    const requesterColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    if (!requesterColor) return false;
    const requesterTurn = requesterColor === "B"; // true if Black

    if (isBlackNext !== requesterTurn) return false;

    return true; // Simplistic undo check for Go
  };

  const statusText = winner
    ? winner === "Draw"
      ? "Hòa cờ!"
      : winner === "End"
      ? "Trận đấu kết thúc! Vui lòng đếm đất."
      : `Winner: ${winner === "B" ? player1Name : player2Name}`
    : gameStarted
    ? `Đang chơi - Lượt: ${isBlackNext ? player1Name || "Đen" : player2Name || "Trắng"}`
    : "Đang chờ bắt đầu...";

  return (
    <div className={`flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
      {/* Undo Request Popup Layer */}
      {undoRequestedBy && undoRequestedBy !== playerName && !isSpectator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className={`p-6 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4 border transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
            <p className={`mb-6 text-lg font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              <span className="font-bold text-purple-600">{undoRequestedBy}</span> muốn xin đi lại 1 nước.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={handleAcceptUndo} className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer">Đồng ý</button>
              <button onClick={handleRejectUndo} className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer">Từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className={`flex flex-col p-4 border-b transition-colors shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
              Cờ Vây (Go)
            </h1>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1.5 ${winner ? "text-green-500" : isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
              {winner && <PartyPopper className="w-3.5 h-3.5" />}
              {statusText}
            </p>
          </div>
        </div>

        {/* ACTION BAR (Top ToolBar) */}
        <div className="flex justify-between items-center w-full pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {gameStarted && !winner && !isSpectator && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handlePass}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"}`}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Bỏ lượt
                </div>
              </div>
            )}
            {gameStarted && !winner && !isSpectator && canUndo() && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleRequestUndo}
                  disabled={!!undoRequestedBy}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${isDarkMode ? "bg-purple-900/30 border-purple-800 text-purple-400 hover:bg-purple-900/50" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"}`}
                >
                  <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Xin đi lại
                </div>
              </div>
            )}
            {gameStarted && !winner && !isSpectator && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleResign}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`}
                >
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Bỏ cuộc
                </div>
              </div>
            )}
            {playerName === hostName && (
              <div className="relative group flex justify-center">
                <button
                  onClick={resetGame}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  Chơi lại
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative group flex justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 ${isDarkMode ? "bg-indigo-900/30 border-indigo-800 text-indigo-400 hover:bg-indigo-900/50" : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"}`}
              >
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                {linkCopied ? "Đã copy!" : "Copy Link Phòng"}
              </div>
            </div>
            <div className="relative group flex justify-center">
              <Link
                href="/"
                className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 flex items-center justify-center ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                Về Trang Chủ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className={`flex border-b transition-colors shrink-0 ${isDarkMode ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-white"}`}>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "players"
              ? isDarkMode ? "border-blue-500 text-blue-400" : "border-zinc-900 text-zinc-900"
              : isDarkMode ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Người chơi ({playersCount}/{maxPlayers})
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "spectators"
              ? isDarkMode ? "border-blue-500 text-blue-400" : "border-zinc-900 text-zinc-900"
              : isDarkMode ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Eye className="w-4 h-4" />
          Khán giả ({spectators.length})
        </button>
      </div>

      {/* Lists */}
      <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? "bg-slate-800/50" : "bg-zinc-50/50"}`}>
        {activeTab === "players" ? (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
                Đội Đen (Đi trước)
              </h4>
              <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                {player1Name ? (
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-slate-900 text-white border border-slate-700" : "bg-zinc-800 text-white"}`}>
                      {player1Name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                          {player1Name} {playerName === player1Name && "(Bạn)"}
                        </span>
                        {hostName === player1Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                      </div>
                      {!gameStarted && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player1Name) ? "text-green-500" : "text-zinc-400"}`}>
                          {readyPlayers.includes(player1Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                        </span>
                      )}
                    </div>
                    {playerName === hostName && player1Name !== hostName && (!gameStarted || winner) && (
                      <button onClick={() => handleKickPlayer(player1Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        Kick
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleSlotClick(1)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                    + Ngồi vào ghế Đen
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
                Đội Trắng (Đi sau)
              </h4>
              <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                {player2Name ? (
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-slate-200 text-zinc-800 border border-slate-400" : "bg-zinc-100 text-zinc-800 border border-zinc-300"}`}>
                      {player2Name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                          {player2Name} {playerName === player2Name && "(Bạn)"}
                        </span>
                        {hostName === player2Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                      </div>
                      {!gameStarted && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player2Name) ? "text-green-500" : "text-zinc-400"}`}>
                          {readyPlayers.includes(player2Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                        </span>
                      )}
                    </div>
                    {playerName === hostName && player2Name !== hostName && (!gameStarted || winner) && (
                      <button onClick={() => handleKickPlayer(player2Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        Kick
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleSlotClick(2)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                    + Ngồi vào ghế Trắng
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4">
              {!gameStarted && !isSpectator && !readyPlayers.includes(playerName) && (
                <button
                  onClick={handleStartReady}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-md cursor-pointer"
                >
                  <Gamepad2 className="w-5 h-5" /> Sẵn sàng bắt đầu
                </button>
              )}
              {!isSpectator && (!gameStarted || winner) && (
                <button
                  onClick={handleBecomeSpectator}
                  className={`text-sm font-medium transition-colors w-full text-center py-2.5 rounded-lg border ${isDarkMode ? "text-slate-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "text-zinc-600 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"}`}
                >
                  Rời ghế, trở thành khán giả
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 h-full">
            {spectators.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Users className={`w-12 h-12 mb-4 opacity-20 ${isDarkMode ? "text-slate-400" : "text-zinc-400"}`} />
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>Chưa có khán giả nào</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spectators.map((spec, idx) => (
                  <li key={idx} className={`group flex items-center justify-between space-x-3 rounded-xl border p-2 transition-all ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner transition-colors ${isDarkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700"}`}>
                        {spec.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                        {spec} {playerName === spec && "(Bạn)"}
                      </span>
                    </div>
                    {playerName === hostName && spec !== hostName && (
                      <button onClick={() => handleKickPlayer(spec)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        Kick
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
