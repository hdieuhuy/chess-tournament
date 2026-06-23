"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaCrown, FaShareAlt, FaPlay, FaComments, FaSlidersH, FaSignOutAlt } from "react-icons/fa";
import { RoleConfig, ChatMessage } from "../types";
import GameConfigPanel from "./game-config-panel";
import PrivateChat from "./wolf-chat";
import { motion } from "framer-motion";

type LobbyScreenProps = {
  players: string[];
  spectators: string[];
  playerName: string;
  hostName: string | null;
  roleConfig: RoleConfig[];
  timeSettings: { discussion: number; voting: number; defense: number; night: number };
  updateRoleCount: (id: string, delta: number) => void;
  applyRolePreset?: (presetCounts: Record<string, number>) => void;
  updateTimeSettings: (newSettings: { discussion: number; voting: number; defense: number; night: number }) => void;
  handleStartGame: () => void;
  handleKickPlayer: (name: string) => void;
  linkCopied: boolean;
  onCopyLink: () => void;
  
  // Lobby chat
  generalChat: ChatMessage[];
  onSendGeneralMessage: (msg: string) => void;
};

export default function LobbyScreen({
  players,
  spectators,
  playerName,
  hostName,
  roleConfig,
  timeSettings,
  updateRoleCount,
  applyRolePreset,
  updateTimeSettings,
  handleStartGame,
  handleKickPlayer,
  linkCopied,
  onCopyLink,
  generalChat,
  onSendGeneralMessage,
}: LobbyScreenProps) {
  const [activeTab, setActiveTab] = useState<"roles" | "chat">("roles");
  const isHost = hostName === playerName;

  return (
    <div className="grid w-full flex-1 grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] max-w-6xl mt-4">
      {/* Main Column */}
      <div className="flex flex-col space-y-6 text-left">
        {/* Title Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">
            Phòng Chờ Ma Sói 🐺
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Lập chiến thuật, ẩn vai trò và sinh tồn. Hãy sẵn sàng bắt đầu hành trình truy lùng Ma Sói cùng bè bạn.
          </p>

          {/* Copy Link Section */}
          <div className="max-w-md">
            <label className="mb-2 block text-xs font-bold text-zinc-600 uppercase tracking-wider">
              Chia sẻ phòng với bạn bè:
            </label>
            <div className="flex items-center space-x-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 shadow-inner">
              <span className="flex-1 select-all truncate text-xs text-zinc-500 pl-2">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
              <button
                onClick={onCopyLink}
                className="flex cursor-pointer items-center space-x-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
              >
                <FaShareAlt className="text-xs" />
                <span>{linkCopied ? "Đã copy!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Player list card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-4 border-zinc-100">
            <h3 className="text-lg font-extrabold tracking-tight text-zinc-800">
              Danh sách phòng chờ ({players.length} người chơi)
            </h3>
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={players.length < 4}
                className="flex cursor-pointer items-center space-x-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(22,163,74,0.2)]"
              >
                <FaPlay className="text-xs" />
                <span>Bắt đầu Game</span>
              </button>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-500/20 animate-pulse">
                ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU
              </span>
            )}
          </div>

          {players.length < 4 && isHost && (
            <p className="text-xs text-red-500 font-medium mb-4">
              * Cần tối thiểu 4 người chơi để bắt đầu game.
            </p>
          )}

          {/* Players Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {players.map((p) => {
              const isPlayerHost = p === hostName;
              const isMe = p === playerName;
              return (
                <div
                  key={p}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 shadow-sm transition-all duration-300 bg-zinc-50/50 hover:shadow-md ${
                    isMe ? "border-indigo-600 bg-indigo-50/10" : "border-zinc-100"
                  }`}
                >
                  <div className="absolute right-2 top-2">
                    {isPlayerHost && (
                      <span className="text-amber-500" title="Chủ phòng">
                        <FaCrown className="text-lg" />
                      </span>
                    )}
                    {!isPlayerHost && isHost && (
                      <button
                        onClick={() => handleKickPlayer(p)}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 hover:bg-red-200"
                        title="Đuổi khỏi phòng"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-black text-zinc-700 shadow-inner">
                    {p.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs truncate max-w-full font-bold ${isMe ? "text-indigo-700" : "text-zinc-800"}`}>
                    {p} {isMe && "(Bạn)"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spectators list */}
        {spectators.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-800">
              Người xem ({spectators.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {spectators.map((spec) => (
                <div
                  key={spec}
                  className="flex items-center space-x-2 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-black text-zinc-700">
                    {spec.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-zinc-800">
                    {spec} {spec === playerName && "(Bạn)"}
                  </span>
                  {spec !== hostName && isHost && (
                    <button
                      onClick={() => handleKickPlayer(spec)}
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-red-600 hover:bg-red-200"
                      title="Đuổi khỏi phòng"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quit Room Link */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <FaSignOutAlt className="text-xs text-zinc-500" />
            <span>Thoát ra sảnh chính</span>
          </Link>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="flex flex-col h-[600px] rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/50 rounded-t-2xl overflow-hidden">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex flex-1 items-center justify-center p-4 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "roles"
                ? "bg-white border-b-2 border-indigo-600 text-indigo-700"
                : "text-zinc-500 hover:bg-zinc-100/50"
            }`}
          >
            <FaSlidersH className="mr-2 text-sm" /> Thiết Lập
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-1 items-center justify-center p-4 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "chat"
                ? "bg-white border-b-2 border-indigo-600 text-indigo-700"
                : "text-zinc-500 hover:bg-zinc-100/50"
            }`}
          >
            <FaComments className="mr-2 text-sm" /> Phòng Chat
          </button>
        </div>

        {/* Tab contents */}
        <div className={`flex-1 flex flex-col p-3 ${activeTab === 'chat' ? 'overflow-hidden' : ''}`}>
          {activeTab === "roles" && (
            <div className="flex-1 pr-1">
              <GameConfigPanel
                roleConfig={roleConfig}
                playersCount={players.length}
                hostName={hostName}
                playerName={playerName}
                gameStarted={false}
                updateRoleCount={updateRoleCount}
                applyRolePreset={applyRolePreset}
                timeSettings={timeSettings}
                updateTimeSettings={updateTimeSettings}
                isNight={false}
              />
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <PrivateChat
                wolfChat={[]}
                loversChat={[]}
                generalChat={generalChat}
                playerName={playerName}
                alivePlayers={players}
                isWolf={false}
                isLover={false}
                phase="day"
                onSendWolfMessage={() => {}}
                onSendLoversMessage={() => {}}
                onSendGeneralMessage={onSendGeneralMessage}
                isNight={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
