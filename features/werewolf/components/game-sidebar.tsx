"use client";

import React, { useState } from "react";
import { FaComments, FaClipboardList, FaAddressCard } from "react-icons/fa";
import { ChatMessage, ActionLog, RoleConfig } from "../types";
import PrivateChat from "./wolf-chat";
import ActionLogsArea from "./action-logs-area";
import { RoleIcon, getRoleColor, getRoleDescription } from "../utils";

type GameSidebarProps = {
  playerName: string;
  alivePlayers: string[];
  playerRoles: Record<string, RoleConfig>;
  phase: string;
  isNight?: boolean;
  
  // Chat props
  wolfChat: ChatMessage[];
  loversChat: ChatMessage[];
  generalChat: ChatMessage[];
  isWolf: boolean;
  isLover: boolean;
  onSendWolfMessage: (msg: string) => void;
  onSendLoversMessage: (msg: string) => void;
  onSendGeneralMessage: (msg: string) => void;

  // Logs props
  actionLogs: ActionLog[];
  activeLogTab: "night" | "day";
  setActiveLogTab: (tab: "night" | "day") => void;

  // Role config
  roleConfig: RoleConfig[];
};

export default function GameSidebar({
  playerName,
  alivePlayers,
  playerRoles,
  phase,
  isNight,
  
  wolfChat,
  loversChat,
  generalChat,
  isWolf,
  isLover,
  onSendWolfMessage,
  onSendLoversMessage,
  onSendGeneralMessage,

  actionLogs,
  activeLogTab,
  setActiveLogTab,

  roleConfig,
}: GameSidebarProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "logs" | "roles">("chat");

  const activeRolesInGame = roleConfig.filter((r) => r.count > 0);

  return (
    <div
      className={`flex flex-col h-[580px] rounded-2xl border shadow-sm ${
        isNight ? "border-slate-800 bg-slate-900/60" : "border-zinc-200 bg-white"
      }`}
    >
      {/* Navigation tabs */}
      <div className={`flex border-b overflow-hidden rounded-t-2xl ${isNight ? "border-slate-800" : "border-zinc-100"}`}>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-1 items-center justify-center p-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "chat"
              ? isNight
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "bg-zinc-50 text-indigo-700 border-b-2 border-indigo-600"
              : isNight
                ? "text-slate-400 hover:bg-slate-800/50"
                : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <FaComments className="mr-2 text-sm" /> Chat
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex flex-1 items-center justify-center p-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "logs"
              ? isNight
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "bg-zinc-50 text-indigo-700 border-b-2 border-indigo-600"
              : isNight
                ? "text-slate-400 hover:bg-slate-800/50"
                : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <FaClipboardList className="mr-2 text-sm" /> Nhật Ký
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex flex-1 items-center justify-center p-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "roles"
              ? isNight
                ? "bg-slate-800 text-indigo-400 border-b-2 border-indigo-500"
                : "bg-zinc-50 text-indigo-700 border-b-2 border-indigo-600"
              : isNight
                ? "text-slate-400 hover:bg-slate-800/50"
                : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <FaAddressCard className="mr-2 text-sm" /> Vai Trò
        </button>
      </div>

      {/* Tab contents */}
      <div className="flex-1 overflow-hidden flex flex-col p-3">
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <PrivateChat
              wolfChat={wolfChat}
              loversChat={loversChat}
              generalChat={generalChat}
              playerName={playerName}
              alivePlayers={alivePlayers}
              isWolf={isWolf}
              isLover={isLover}
              phase={phase}
              onSendWolfMessage={onSendWolfMessage}
              onSendLoversMessage={onSendLoversMessage}
              onSendGeneralMessage={onSendGeneralMessage}
              isNight={isNight}
            />
          </div>
        )}

        {activeTab === "logs" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ActionLogsArea
              actionLogs={actionLogs}
              activeLogTab={activeLogTab}
              setActiveLogTab={setActiveLogTab}
              playerName={playerName}
              playerRoles={playerRoles}
              isNight={isNight}
            />
          </div>
        )}

        {activeTab === "roles" && (
          <div className="flex-1 overflow-y-auto px-2 space-y-4 max-h-[500px] text-left">
            <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2 ${isNight ? "border-slate-800 text-slate-400" : "border-zinc-100 text-zinc-500"}`}>
              Cơ cấu vai trò trận này
            </h3>
            {activeRolesInGame.map((role) => (
              <div
                key={role.id}
                className={`flex gap-3 items-start border p-3 rounded-xl ${
                  isNight ? "bg-slate-800/30 border-slate-800" : "bg-zinc-50/50 border-zinc-100"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isNight ? "bg-slate-800" : "bg-white border border-zinc-200"}`}>
                  <RoleIcon id={role.id} className={`text-lg ${getRoleColor(role.id)}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-extrabold ${getRoleColor(role.id)}`}>
                      {role.name}
                    </span>
                    <span className={`text-xs font-black rounded-full px-2 py-0.5 ${
                      isNight ? "bg-slate-800 text-slate-300" : "bg-zinc-200 text-zinc-700"
                    }`}>
                      x{role.count}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-xs leading-relaxed ${isNight ? "text-slate-400" : "text-zinc-500"}`}>
                    {getRoleDescription(role.id)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
