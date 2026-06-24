"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUno } from "../contexts/uno-context";
import { Users, Gamepad2, Eye, DoorOpen, Link as LinkIcon, Settings, RotateCcw } from "lucide-react";
import { FaCrown } from "react-icons/fa";

export function UnoSidebar() {
  const {
    playerName,
    hostName,
    players,
    spectators,
    gameStarted,
    gameMode,
    readyPlayers,
    handleChangeGameMode,
    handleKickPlayer,
    handleToggleReady,
    handleStartClick,
    handleBecomeSpectator,
    winner,
    currentTurnIndex,
    hands,
  } = useUno();

  const [activeTab, setActiveTab] = useState<"players" | "spectators">("players");
  const [linkCopied, setLinkCopied] = useState(false);

  const playersCount = players.length;
  const maxPlayers = gameMode === "2p" ? 2 : 4;
  const isSpectator = spectators.includes(playerName);

  const handleEndGame = () => {
    if (winner) {
      handleStartClick(); // Thực ra startGame sẽ random bài lại
    } else {
      window.location.reload(); // Thoát game
    }
  };

  const statusText = winner
    ? `🎉 Chiến thắng: ${winner}!`
    : gameStarted
      ? `Đang chơi - Lượt: ${players[currentTurnIndex]}`
      : "Đang chờ bắt đầu...";

  return (
    <div className="flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden transition-colors bg-white border-zinc-200">
      
      {/* Header: Game Status & Action Bar */}
      <div className="p-3 sm:p-4 border-b flex flex-col gap-3 transition-colors bg-zinc-50 border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg font-bold transition-colors text-zinc-900">
              Bài Uno (Uno)
            </h2>
            <p className={`text-xs sm:text-sm font-medium transition-colors ${
              winner 
                ? "text-green-600"
                : gameStarted 
                  ? "text-indigo-600"
                  : "text-zinc-500"
            }`}>
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {playerName === hostName && (
              <div className="relative group flex justify-center">
                <button
                  onClick={handleEndGame}
                  className="p-2 rounded-lg border shadow-sm transition-all hover:scale-105 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[60]">
                  {winner ? "Chơi lại" : "Kết thúc ván"}
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
                className="p-2 rounded-lg border shadow-sm transition-all hover:scale-105 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
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
                className="p-2 rounded-lg border shadow-sm transition-all hover:scale-105 flex items-center justify-center bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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

      {/* Tabs */}
      <div className="flex border-b transition-colors shrink-0 border-zinc-200 bg-white">
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "players"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Phòng chơi</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "players" ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
            {playersCount}/{maxPlayers}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          className={`flex-1 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "spectators"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          <Eye className="w-4 h-4" />
          <span>Khán giả</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "spectators" ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
            {spectators.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar transition-colors bg-zinc-50/50">
        {activeTab === "players" && (
          <div className="flex flex-col gap-4 h-full">
            {!gameStarted && (
              <div className="p-4 rounded-xl border flex flex-col gap-3 transition-colors bg-zinc-50 border-zinc-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">Cài đặt phòng</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleChangeGameMode("2p")}
                    disabled={playerName !== hostName}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      gameMode === "2p"
                        ? "bg-zinc-900 text-white"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    } ${playerName !== hostName ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    2 Người
                  </button>
                  <button
                    onClick={() => handleChangeGameMode("4p")}
                    disabled={playerName !== hostName}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      gameMode === "4p"
                        ? "bg-zinc-900 text-white"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    } ${playerName !== hostName ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    4 Người
                  </button>
                </div>
              </div>
            )}

            {!gameStarted && (
              <div className="p-4 rounded-xl border flex flex-col gap-3 transition-colors bg-zinc-50 border-zinc-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">Bắt đầu trận đấu</span>
                  <span className="text-xs font-medium text-zinc-500">{readyPlayers.length}/{maxPlayers} sẵn sàng</span>
                </div>
                
                {playerName === hostName ? (
                  <button
                    onClick={handleStartClick}
                    disabled={
                      players.length !== maxPlayers ||
                      players.filter((p) => p !== hostName).some((p) => !readyPlayers.includes(p))
                    }
                    className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-green-600 hover:bg-green-700 text-white shadow-sm disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  >
                    {players.length !== maxPlayers
                      ? `Đợi đủ ${maxPlayers} người`
                      : players.filter((p) => p !== hostName).some((p) => !readyPlayers.includes(p))
                        ? "Đợi người chơi sẵn sàng..."
                        : "Bắt đầu Game"}
                  </button>
                ) : !isSpectator && players.includes(playerName) ? (
                  <button
                    onClick={handleToggleReady}
                    disabled={readyPlayers.includes(playerName)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {readyPlayers.includes(playerName) ? "Đã sẵn sàng" : "Sẵn sàng"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  >
                    Chỉ người chơi mới có thể sẵn sàng
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Vị trí người chơi
              </h3>

              {Array.from({ length: maxPlayers }).map((_, idx) => {
                const p = players[idx];
                const isCurrentTurn = gameStarted && currentTurnIndex === idx;

                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <h4 className="text-sm font-bold transition-colors text-zinc-600">
                      Ghế {idx + 1}
                    </h4>
                    <div className={`flex items-center justify-between border p-2.5 rounded-lg transition-colors ${
                      isCurrentTurn && !winner ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-white border-zinc-200 shadow-sm"
                    }`}>
                      {p ? (
                        <div className="flex items-center gap-2 overflow-hidden w-full group">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isCurrentTurn ? "bg-indigo-600 text-white ring-2 ring-indigo-300" : "bg-zinc-800 text-zinc-100"}`}>
                            {p.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col overflow-hidden flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate transition-colors text-zinc-800">
                                {p} {playerName === p && "(Bạn)"} 
                              </span>
                              {hostName === p && <FaCrown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                            </div>
                            {gameStarted ? (
                               <span className="text-[11px] font-medium text-zinc-500">
                                 {hands[p]?.length || 0} lá bài
                               </span>
                            ) : (
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${readyPlayers.includes(p) || p === hostName ? "text-green-500" : "text-zinc-400"}`}>
                                {readyPlayers.includes(p) || p === hostName ? "Sẵn Sàng" : "Chưa Sẵn Sàng"}
                              </span>
                            )}
                          </div>
                          {playerName === hostName && p !== hostName && !gameStarted && (
                            <button onClick={() => handleKickPlayer(p)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors bg-red-50 text-red-600 hover:bg-red-100">
                              Kick
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-medium py-1 px-2 border border-dashed rounded w-full text-left transition-colors text-zinc-400 border-zinc-300 flex items-center justify-center">
                          Trống
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSpectator && (!gameStarted || winner) && (
              <button
                onClick={handleBecomeSpectator}
                className="mt-auto text-sm font-medium transition-colors w-full text-center py-2.5 rounded-lg border text-zinc-600 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
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
                <Users className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-sm font-medium transition-colors text-zinc-400">
                  Chưa có khán giả nào
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {spectators.map((spec, idx) => (
                  <li key={idx} className="group flex items-center justify-between space-x-3 rounded-xl border p-2 transition-all bg-white border-zinc-200 shadow-sm">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner transition-colors bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700">
                        {spec.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate transition-colors text-zinc-800" title={spec}>
                        {spec} {playerName === spec && "(Bạn)"}
                      </span>
                    </div>
                    {playerName === hostName && spec !== hostName && (
                      <button onClick={() => handleKickPlayer(spec)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors bg-red-50 text-red-600 hover:bg-red-100">
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
