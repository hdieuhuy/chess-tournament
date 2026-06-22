"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useOAnQuan } from "../contexts/oanquan-context";
import { Gamepad2, Eye, Users, DoorOpen, RotateCcw, Link as LinkIcon, PartyPopper, Flag, Crown } from "lucide-react";

interface OAnQuanSidebarProps {
  isDarkMode: boolean;
}

export function OAnQuanSidebar({ isDarkMode }: OAnQuanSidebarProps) {
  const [activeTab, setActiveTab] = useState<"players" | "spectators">("players");
  const [linkCopied, setLinkCopied] = useState(false);

  const {
    playerName,
    player1Name,
    player2Name,
    hostName,
    winner,
    readyPlayers,
    p1Score,
    p2Score,
    isP1Turn,
    spectators,
    isSpectator,
    gamePhase,
    handleKickPlayer,
    handleReady,
    handleResign,
    resetGame,
    handleSlotClick,
    handleBecomeSpectator,
  } = useOAnQuan();

  const playersCount = [player1Name, player2Name].filter(Boolean).length;
  const maxPlayers = 2;

  const getStatusText = () => {
    if (winner) {
      if (winner === "Draw") return "Hòa!";
      return `Chiến thắng: ${winner === "P1" ? player1Name : player2Name}`;
    }
    if (gamePhase === "playing") return `Lượt đi: ${isP1Turn ? player1Name || "Người chơi 1" : player2Name || "Người chơi 2"}`;
    return "Đang chờ sẵn sàng...";
  };

  const statusText = getStatusText();

  return (
    <div className={`flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-200"}`}>
      {/* Header Info */}
      <div className={`flex flex-col p-4 border-b transition-colors shrink-0 ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-zinc-50 border-zinc-200"}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-slate-100" : "text-amber-900"}`}>
              Ô Ăn Quan
            </h1>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1.5 ${winner ? "text-green-500" : isDarkMode ? "text-slate-400" : "text-amber-700"}`}>
              {winner && <PartyPopper className="w-3.5 h-3.5" />}
              {statusText}
            </p>
          </div>
        </div>

        {/* ACTION BAR (Top ToolBar) */}
        <div className="flex justify-between items-center w-full pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {gamePhase === "playing" && !winner && !isSpectator && (
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

      {/* Tabs Header */}
      <div className={`flex border-b transition-colors shrink-0 ${isDarkMode ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-white"}`}>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "players"
              ? isDarkMode ? "border-amber-500 text-amber-400" : "border-amber-700 text-amber-800"
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
              ? isDarkMode ? "border-amber-500 text-amber-400" : "border-amber-700 text-amber-800"
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
                Người chơi 1 (Đi trước)
              </h4>
              <div className={`flex flex-col gap-2 border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                {player1Name ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-amber-900 text-amber-200 border border-amber-700" : "bg-amber-100 text-amber-700"}`}>
                        {player1Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player1Name} {playerName === player1Name && "(Bạn)"}
                          </span>
                          {hostName === player1Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {gamePhase === "waiting" && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player1Name) ? "text-green-500" : "text-zinc-400"}`}>
                            {readyPlayers.includes(player1Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                          </span>
                        )}
                      </div>
                      {playerName === hostName && player1Name !== hostName && gamePhase === "waiting" && (
                        <button onClick={() => handleKickPlayer(player1Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          Kick
                        </button>
                      )}
                    </div>
                    {/* Player 1 Score & Turn */}
                    {gamePhase === "playing" && (
                      <div className="mt-1 flex items-center justify-between px-1">
                        <span className={`text-sm font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                          Điểm: {p1Score}
                        </span>
                        {isP1Turn && !winner && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                            Đang suy nghĩ...
                          </span>
                        )}
                        {winner === "P1" && (
                          <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                            🏆 Người thắng
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleSlotClick(1)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                    + Ngồi vào ghế 1
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>
                Người chơi 2 (Đi sau)
              </h4>
              <div className={`flex flex-col gap-2 border p-2.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-700/30 border-slate-600" : "bg-white border-zinc-200 shadow-sm"}`}>
                {player2Name ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors shadow-sm ${isDarkMode ? "bg-amber-900 text-amber-200 border border-amber-700" : "bg-amber-100 text-amber-700"}`}>
                        {player2Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-medium truncate transition-colors ${isDarkMode ? "text-slate-200" : "text-zinc-800"}`}>
                            {player2Name} {playerName === player2Name && "(Bạn)"}
                          </span>
                          {hostName === player2Name && <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        {gamePhase === "waiting" && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(player2Name) ? "text-green-500" : "text-zinc-400"}`}>
                            {readyPlayers.includes(player2Name) ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                          </span>
                        )}
                      </div>
                      {playerName === hostName && player2Name !== hostName && gamePhase === "waiting" && (
                        <button onClick={() => handleKickPlayer(player2Name)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          Kick
                        </button>
                      )}
                    </div>
                    {/* Player 2 Score & Turn */}
                    {gamePhase === "playing" && (
                      <div className="mt-1 flex items-center justify-between px-1">
                        <span className={`text-sm font-bold ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                          Điểm: {p2Score}
                        </span>
                        {!isP1Turn && !winner && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                            Đang suy nghĩ...
                          </span>
                        )}
                        {winner === "P2" && (
                          <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                            🏆 Người thắng
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => handleSlotClick(2)} className={`text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors ${isDarkMode ? "text-slate-400 hover:text-slate-300 border-slate-600 hover:border-slate-500" : "text-zinc-500 hover:text-zinc-700 border-zinc-300 hover:border-zinc-500"}`}>
                    + Ngồi vào ghế 2
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4">
              {gamePhase === "waiting" && !isSpectator && !readyPlayers.includes(playerName) && (
                <button
                  onClick={handleReady}
                  className="w-full flex items-center justify-center gap-2 bg-amber-700 text-white font-semibold py-3 rounded-xl hover:bg-amber-800 transition-colors shadow-md cursor-pointer"
                >
                  <Gamepad2 className="w-5 h-5" /> Sẵn sàng
                </button>
              )}
              {gamePhase === "waiting" && !isSpectator && (!gamePhase || winner) && (
                <button
                  onClick={handleBecomeSpectator}
                  className={`text-sm font-medium transition-colors w-full text-center py-2.5 rounded-lg border ${isDarkMode ? "text-slate-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "text-zinc-600 bg-white border-zinc-200 hover:bg-zinc-50"}`}
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
