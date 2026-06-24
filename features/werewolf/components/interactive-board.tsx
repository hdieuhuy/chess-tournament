"use client";

import React from "react";
import { FaCrown, FaGhost, FaHeart } from "react-icons/fa";
import { GiBullseye, GiMusicalNotes } from "react-icons/gi";
import { RoleConfig, GameState } from "../types";
import { RoleIcon, getRoleColor } from "../utils";
type InteractiveBoardProps = {
  players: string[];
  alivePlayers: string[];
  playerRoles: Record<string, RoleConfig>;
  originalRoles?: Record<string, RoleConfig>;
  playerName: string;
  hostName: string | null;
  gameStarted: boolean;
  phase: string;
  dayPhase: string | null;
  nightPhase: string | null;
  headhunterTarget?: string | null;
  cupidTargets?: [string, string] | null;
  hypnotizedPlayers?: string[];
  isNight?: boolean;
  onKickPlayer?: (name: string) => void;
  // State for selections
  nightSelection?: string | null;
  dayVotes?: Record<string, string>;
  wolfVotes?: Record<string, string[]>;
  witchAction?: { heal: string[]; poison: string | null };
  activeExtraWolfKill?: boolean;
  lastProtected?: string | null;
  wolfVictim?: string[];
  currentMayor?: string | null;
  // Interaction handler
  onPlayerClick?: (name: string) => void;
};

export default function InteractiveBoard({
  players,
  alivePlayers,
  playerRoles,
  originalRoles,
  playerName,
  hostName,
  gameStarted,
  phase,
  dayPhase,
  nightPhase,
  headhunterTarget,
  cupidTargets,
  hypnotizedPlayers,
  isNight,
  onKickPlayer,
  nightSelection,
  dayVotes = {},
  wolfVotes = {},
  witchAction = { heal: [], poison: null },
  activeExtraWolfKill,
  lastProtected,
  wolfVictim = [],
  currentMayor,
  onPlayerClick,
}: InteractiveBoardProps) {
  
  // Helper to determine if a player is selected by the user
  const getPlayerSelectionType = (pName: string) => {
    if (!gameStarted || !onPlayerClick) return null;
    const myRole = playerRoles[playerName]?.id;
    const isActAnytimeRole = ["hunter", "medium", "pied_piper", "seer"].includes(myRole || "");
    const isMyTurn = nightPhase === myRole || isActAnytimeRole;

    // Day Voting selection
    if (phase === "day" && dayPhase === "voting") {
      return dayVotes[playerName] === pName ? "day-vote" : null;
    }

    // Night action selections
    if (phase === "night") {
      const isWolf = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"].includes(myRole || "");
      if (nightPhase === "werewolf" && isWolf) {
        return (wolfVotes[playerName] || []).includes(pName) ? "wolf-vote" : null;
      }
      if (myRole === "witch") {
        if ((witchAction.heal || []).includes(pName)) return "witch-heal";
        if (witchAction.poison === pName) return "witch-poison";
        if (isMyTurn && wolfVictim.includes(pName)) return "witch-victim";
      }
      if (isMyTurn) {
        if (myRole === "seer" && nightSelection === pName) return "seer-spy";
        if (myRole === "bodyguard" && nightSelection === pName) return "bodyguard-shield";
        if (myRole === "hunter" && nightSelection === pName) return "hunter-ghim";
        if (myRole === "assassin" && nightSelection === pName) return "assassin-kill";
        if (myRole === "cupid" && nightSelection?.split(",").includes(pName)) return "cupid-love";
        if (myRole === "medium" && nightSelection === pName) return "medium-revive";
        if (myRole === "pied_piper" && nightSelection === pName) return "pied-piper-charm";
        if (myRole === "white_wolf" && nightSelection === pName) return "white-wolf-kill";
      }
    }
    return null;
  };

  // Helper to style selected border/glow
  const getSelectionStyles = (type: string | null) => {
    switch (type) {
      case "day-vote":
        return "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/20";
      case "wolf-vote":
        return "border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)] ring-2 ring-red-600/20";
      case "seer-spy":
        return "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/20";
      case "bodyguard-shield":
        return "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/20";
      case "hunter-ghim":
        return "border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/20";
      case "assassin-kill":
        return "border-red-950 shadow-[0_0_12px_rgba(69,10,10,0.5)] ring-2 ring-red-950/20";
      case "witch-heal":
        return "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20";
      case "witch-poison":
        return "border-fuchsia-600 shadow-[0_0_12px_rgba(217,70,239,0.4)] ring-2 ring-fuchsia-600/20";
      case "witch-victim":
        return "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/40 animate-pulse";
      case "cupid-love":
        return "border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.4)] ring-2 ring-pink-500/20";
      case "medium-revive":
        return "border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.4)] ring-2 ring-teal-500/20";
      case "pied-piper-charm":
        return "border-emerald-600 shadow-[0_0_12px_rgba(5,150,105,0.4)] ring-2 ring-emerald-600/20";
      case "white-wolf-kill":
        return "border-zinc-400 shadow-[0_0_12px_rgba(161,161,170,0.4)] ring-2 ring-zinc-400/20";
      default:
        return isNight ? "border-slate-700/60 hover:border-indigo-500/30" : "border-zinc-200/80 hover:border-zinc-400";
    }
  };

  // Count active votes for displaying vote indicators
  const getVotesOnPlayer = (pName: string) => {
    // Day votes count
    if (phase === "day" && dayPhase === "voting") {
      const voters = Object.entries(dayVotes)
        .filter(([_, target]) => target === pName)
        .map(([voter]) => voter);
      return voters;
    }
    
    // Night werewolf votes count
    if (phase === "night" && nightPhase === "werewolf") {
      const myRole = playerRoles[playerName]?.id;
      const isWolf = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan", "white_wolf"].includes(myRole || "");
      if (!isWolf) return [];

      const aliveWolves = alivePlayers.filter((w) =>
        ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"].includes(playerRoles[w]?.id || "")
      );
      const voters = aliveWolves.filter((w) => (wolfVotes[w] || []).includes(pName));
      return voters;
    }
    
    return [];
  };

  return (
    <div className={`w-full rounded-2xl border p-5 shadow-sm transition-colors duration-500 ${isNight ? "border-slate-800 bg-slate-900/60" : "border-zinc-200 bg-white"}`}>
      <div className={`mb-4 flex items-center justify-between border-b pb-4 ${isNight ? "border-slate-800" : "border-zinc-100"}`}>
        <h3 className={`text-base font-extrabold tracking-tight ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
          Thành viên trong làng ({players.length})
        </h3>
        {gameStarted && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-500 border border-emerald-500/20 uppercase animate-pulse">
            Đang chiến đấu
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {players.map((p, idx) => {
          const role = playerRoles[p];
          const originalRole = originalRoles?.[p];
          const myRole = playerRoles[playerName];
          const isMe = p === playerName;
          const isAlive = alivePlayers.includes(p);
          
          const isBothWolves =
            (myRole?.id === "werewolf" ||
              myRole?.id === "cursed_wolf" ||
              myRole?.id === "fog_wolf" ||
              myRole?.id === "wolf_cub" ||
              myRole?.id === "white_wolf") &&
            (role?.id === "werewolf" ||
              role?.id === "cursed_wolf" ||
              role?.id === "fog_wolf" ||
              role?.id === "wolf_cub" ||
              role?.id === "white_wolf");
              
          const canSeeRole = isMe || isBothWolves || phase === "game_over";
          
          const isTarget =
            headhunterTarget === p &&
            (myRole?.id === "headhunter" || phase === "game_over");
            
          const isLover =
            cupidTargets &&
            cupidTargets.includes(p) &&
            (cupidTargets.includes(playerName) ||
              myRole?.id === "cupid" ||
              phase === "game_over");
              
          const canSeeHypnotized =
            phase === "game_over" ||
            myRole?.id === "pied_piper" ||
            (isMe && hypnotizedPlayers?.includes(p));

          const selectionType = getPlayerSelectionType(p);
          const selectionStyles = getSelectionStyles(selectionType);
          const voters = getVotesOnPlayer(p);

          const isMediumAction = phase === "night" && myRole?.id === "medium";
          const isPlayerTargetable = isMediumAction ? !isAlive : isAlive;
          
          const isActAnytimeRole = ["hunter", "medium", "pied_piper", "seer"].includes(myRole?.id || "");

          // Check if clickable
          const isClickable =
            gameStarted &&
            isPlayerTargetable &&
            onPlayerClick &&
            // Can only click if it's voting day or our active night turn
            ((phase === "day" && dayPhase === "voting") ||
              (phase === "night" &&
                (isActAnytimeRole || nightPhase === myRole?.id ||
                  (nightPhase === "werewolf" &&
                    ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"].includes(myRole?.id || "")))));

          return (
            <div
              key={idx}
              onClick={() => isClickable && onPlayerClick && onPlayerClick(p)}
              className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
                isClickable ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"
              } ${isNight ? "bg-slate-800/40" : "bg-zinc-50/50"} ${
                !isAlive && gameStarted
                  ? `opacity-40 grayscale ${isNight ? "border-slate-800 bg-slate-950/20" : "border-zinc-200 bg-zinc-200/30"}`
                  : selectionStyles
              }`}
            >
              {/* Badges top right */}
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {!isAlive && gameStarted && (
                  <div className="group relative cursor-help text-sm text-zinc-500">
                    <FaGhost />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Đã tử nạn
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {p === hostName && (
                  <div className="group relative cursor-help text-sm text-amber-500">
                    <FaCrown />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Chủ phòng
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {p === currentMayor && p === playerName && (
                  <div className="group relative cursor-help text-sm text-yellow-400">
                    <RoleIcon id="mayor" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Trưởng Làng
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {gameStarted && isTarget && (
                  <div className="group relative cursor-help text-sm text-cyan-500 animate-pulse">
                    <GiBullseye />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Mục tiêu săn đuổi
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {gameStarted && isLover && (
                  <div className="group relative cursor-help text-sm text-pink-500 animate-pulse">
                    <FaHeart />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Đang yêu
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {gameStarted && hypnotizedPlayers?.includes(p) && canSeeHypnotized && (
                  <div className="group relative cursor-help text-sm text-emerald-400">
                    <GiMusicalNotes />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Bị thôi miên
                      <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-950 -translate-x-1/2"></div>
                    </div>
                  </div>
                )}
                {p !== hostName && !gameStarted && hostName === playerName && onKickPlayer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onKickPlayer(p);
                    }}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold text-red-500 border border-red-500/10"
                    title="Đuổi khỏi phòng"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Avatar block */}
              <div
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold shadow-inner ${
                  isNight
                    ? "bg-slate-700 text-slate-200 border border-slate-600/50"
                    : "bg-zinc-200/80 text-zinc-700 border border-zinc-300/30"
                }`}
              >
                {p.charAt(0).toUpperCase()}
              </div>

              {/* Player Name */}
              <span
                className={`w-full truncate text-center text-xs ${
                  isMe
                    ? isNight ? "font-bold text-indigo-400" : "font-bold text-indigo-700"
                    : isNight ? "font-semibold text-slate-200" : "font-semibold text-zinc-800"
                }`}
              >
                {p} {isMe && "(Bạn)"}
              </span>

              {/* Role Badge if revealed */}
              {gameStarted && role && canSeeRole && (
                <div className="mt-1.5 flex flex-col items-center justify-center space-y-0.5">
                  {originalRole && originalRole.id !== role.id && (
                    <span className={`flex items-center space-x-1 text-[9px] font-bold line-through opacity-40 ${getRoleColor(originalRole.id)}`}>
                      <RoleIcon id={originalRole.id} className="text-[10px]" />
                      <span>{originalRole.name}</span>
                    </span>
                  )}
                  <span className={`whitespace-nowrap flex items-center space-x-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold border ${getRoleColor(role.id)} ${
                    isNight ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-white"
                  }`}>
                    <RoleIcon id={role.id} className="text-[10px] mr-0.5" />
                    <span>{role.name}</span>
                  </span>
                </div>
              )}

              {/* Vote Indicators (who voted for this player) */}
              {voters.length > 0 && (
                <div className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-full px-1.5 py-0.5 shadow-md">
                  <span className="text-[8px] font-bold text-slate-400 mr-0.5">Votes:</span>
                  {voters.map((voter) => (
                    <span
                      key={voter}
                      className="text-[9px] font-black text-amber-500 max-w-[30px] truncate"
                      title={voter}
                    >
                      {voter.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  <span className="ml-1 text-[9px] font-black text-white">({voters.length})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
