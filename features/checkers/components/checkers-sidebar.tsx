"use client";

import { useState } from "react";
import Link from "next/link";
import { useCheckers } from "../contexts/checkers-context";
import { Users, UserPlus, Gamepad2, Eye, Flag, RotateCcw, Undo2, DoorOpen, Link as LinkIcon } from "lucide-react";
import { FaCrown } from "react-icons/fa";

export function CheckersSidebar({ isDarkMode }: { isDarkMode: boolean }) {
  const {
    playerName,
    hostName,
    player1Name,
    player2Name,
    spectators,
    gameStarted,
    winner,
    readyPlayers,
    isSpectator,
    isBlackTurn,
    player1Time,
    player2Time,
    undoRequestedBy,
    history,
    handleKickPlayer,
    handleSlotClick,
    handleBecomeSpectator,
    handleStartClick,
    handleRequestUndo,
    handleAcceptUndo,
    handleRejectUndo,
    resetGame,
    handleResign,
  } = useCheckers();

  const [activeTab, setActiveTab] = useState<"players" | "spectators">("players");
  const [linkCopied, setLinkCopied] = useState(false);

  const playersCount = [player1Name, player2Name].filter(Boolean).length;
  const maxPlayers = 2;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const statusText = winner
    ? winner === "Draw"
      ? "🤝 Hòa cờ!"
      : `🎉 Chiến thắng: ${winner === "B" ? player1Name : player2Name}!`
    : gameStarted
      ? `Đang chơi - Lượt: ${isBlackTurn ? player1Name : player2Name}`
      : "Đang chờ bắt đầu...";

  return (
    <div className={`flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
      
      {/* Undo Request Popup Layer */}
      {undoRequestedBy && undoRequestedBy !== playerName && !isSpectator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
          <div className={`p-6 rounded-xl shadow-2xl text-center max-w-[280px] w-full border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
            <p className={`mb-6 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
              <span className="font-bold text-indigo-500">{undoRequestedBy}</span> muốn xin đi lại 1 nước.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleAcceptUndo}
                className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Đồng ý
              </button>
              <button
                onClick={handleRejectUndo}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {undoRequestedBy === playerName && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 text-xs rounded-full shadow-lg font-medium animate-pulse whitespace-nowrap">
          Đang chờ đối thủ phản hồi...
        </div>
      )}

      {/* Header: Game Status & Action Bar */}
      <div className={`p-3 sm:p-4 border-b flex flex-col gap-3 transition-colors ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className={`text-base sm:text-lg font-bold transition-colors ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
              Cờ Đam (Checkers)
            </h2>
            <p className={`text-xs sm:text-sm font-medium transition-colors ${
              winner 
                ? (isDarkMode ? "text-green-400" : "text-green-600")
                : gameStarted 
                  ? (isDarkMode ? "text-indigo-400" : "text-indigo-600")
                  : (isDarkMode ? "text-slate-400" : "text-zinc-500")
            }`}>
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {gameStarted && !winner && !isSpectator && history.length > 0 && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleRequestUndo}
                  disabled={!!undoRequestedBy}
                  className={`p-2 rounded-lg border shadow-sm transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${isDarkMode ? "bg-purple-900/30 border-purple-800 text-purple-400 hover:bg-purple-900/50" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"}`}
                >
                  <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
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
                Đổi trò chơi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b transition-colors shrink-0 ${isDarkMode ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-white"}`}>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "players"
              ? isDarkMode ? "text-indigo-400 border-b-2 border-indigo-500" : "text-indigo-600 border-b-2 border-indigo-600"
              : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Phòng chơi</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "players" ? (isDarkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700") : (isDarkMode ? "bg-slate-700 text-slate-400" : "bg-zinc-100 text-zinc-500")}`}>
            {playersCount}/{maxPlayers}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "spectators"
              ? isDarkMode ? "text-indigo-400 border-b-2 border-indigo-500" : "text-indigo-600 border-b-2 border-indigo-600"
              : isDarkMode ? "text-slate-400 hover:text-slate-300" : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Eye className="w-4 h-4" />
          <span>Khán giả</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "spectators" ? (isDarkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700") : (isDarkMode ? "bg-slate-700 text-slate-400" : "bg-zinc-100 text-zinc-500")}`}>
            {spectators.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar transition-colors ${isDarkMode ? "bg-slate-800/50" : "bg-zinc-50/50"}`}>
        {activeTab === "players" && (
          <div className="flex flex-col gap-4 h-full">
            {!gameStarted && (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>Bắt đầu trận đấu</span>
                  <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>{readyPlayers.length}/{maxPlayers} sẵn sàng</span>
                </div>
                <button
                  onClick={handleStartClick}
                  disabled={readyPlayers.includes(playerName || "") || isSpectator || playersCount < 2}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    readyPlayers.includes(playerName || "")
                      ? "bg-green-600/50 text-white cursor-not-allowed"
                      : isSpectator || playersCount < 2
                        ? isDarkMode ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  }`}
                >
                  {readyPlayers.includes(playerName || "")
                    ? "Đã sẵn sàng"
                    : isSpectator
                      ? "Đang là khán giả"
                      : playersCount < 2
                        ? "Chờ đối thủ..."
                        : "Sẵn sàng"}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-zinc-400"}`}>
                Vị trí ghế ngồi
              </h3>

              {/* Ghế 1 - Quân Đen */}
              <div className="flex flex-col gap-2">
                <h4 className={`text-sm font-bold transition-colors ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                  Quân Đen (Đi trước)
                </h4>
                <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${
                  isDarkMode 
                    ? (isBlackTurn && gameStarted && !winner ? "bg-indigo-900/20 border-indigo-500" : "bg-slate-700/30 border-slate-600") 
                    : (isBlackTurn && gameStarted && !winner ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-white border-zinc-200 shadow-sm")
                }`}>
                  {player1Name ? (
                    <div className="flex items-center gap-2 overflow-hidden w-full group">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isDarkMode ? "bg-zinc-900/50 text-zinc-300" : "bg-zinc-800 text-zinc-100"}`}>
                        {player1Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player1Name} {playerName === player1Name && "(Bạn)"} 
                          </span>
                          {hostName === player1Name && <FaCrown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {gameStarted && !winner ? (
                           <span className={`text-[11px] font-mono font-medium ${isBlackTurn ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-500"}`}>
                             {formatTime(player1Time)}
                           </span>
                        ) : !gameStarted && (
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
                    <button onClick={() => handleSlotClick(1)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-zinc-400 border-slate-600 hover:border-zinc-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-400"}`}>
                      + Ngồi vào ghế Đen
                    </button>
                  )}
                </div>
              </div>

              {/* Ghế 2 - Quân Đỏ */}
              <div className="flex flex-col gap-2 mt-2">
                <h4 className={`text-sm font-bold transition-colors ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                  Quân Đỏ (Đi sau)
                </h4>
                <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${
                  isDarkMode 
                    ? (!isBlackTurn && gameStarted && !winner ? "bg-red-900/20 border-red-500" : "bg-slate-700/30 border-slate-600") 
                    : (!isBlackTurn && gameStarted && !winner ? "bg-red-50 border-red-300 shadow-sm" : "bg-white border-zinc-200 shadow-sm")
                }`}>
                  {player2Name ? (
                    <div className="flex items-center gap-2 overflow-hidden w-full group">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-600"}`}>
                        {player2Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player2Name} {playerName === player2Name && "(Bạn)"}
                          </span>
                          {hostName === player2Name && <FaCrown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {gameStarted && !winner ? (
                           <span className={`text-[11px] font-mono font-medium ${!isBlackTurn ? "text-red-600 dark:text-red-400 font-bold" : "text-zinc-500"}`}>
                             {formatTime(player2Time)}
                           </span>
                        ) : !gameStarted && (
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
                    <button onClick={() => handleSlotClick(2)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-red-400 border-slate-600 hover:border-red-500" : "text-zinc-500 hover:text-red-500 border-zinc-300 hover:border-red-400"}`}>
                      + Ngồi vào ghế Đỏ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!isSpectator && (!gameStarted || winner) && (
              <button
                onClick={handleBecomeSpectator}
                className={`mt-auto text-sm font-medium transition-colors w-full text-center py-2.5 rounded-lg border ${isDarkMode ? "text-slate-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "text-zinc-600 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"}`}
              >
                Rời ghế, trở thành khán giả
              </button>
            )}
          </div>
        )}

        {activeTab === "spectators" && (
          <div className="flex flex-col gap-2 h-full">
            {spectators.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Users className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                <p className={`text-sm font-medium transition-colors ${isDarkMode ? "text-slate-500" : "text-zinc-400"}`}>
                  Chưa có khán giả nào
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spectators.map((spec, idx) => (
                  <li key={idx} className={`group flex items-center justify-between space-x-3 rounded-xl border p-2 transition-all ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner transition-colors ${isDarkMode ? "bg-indigo-900/50 text-indigo-300" : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700"}`}>
                        {spec.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`} title={spec}>
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
