"use client";

import React from "react";
import { FaMoon, FaGhost, FaHourglassHalf, FaBed, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useWerewolf } from "../contexts/werewolf-context";
import { ROLE_STRATEGIES } from "./night-roles";
import { defaultRoles } from "../utils";

const nightPhaseOrder = [
  "cupid",
  "bodyguard",
  "werewolf",
  "cursed_wolf",
  "white_wolf",
  "assassin",
  "seer",
  "medium",
  "pied_piper",
  "witch",
  "hunter",
];

export default function NightActionController() {
  const { gameState, dispatch, channel, playerName } = useWerewolf();
  const {
    phase,
    nightPhase,
    playerRoles,
    dayCount,
    alivePlayers,
  } = gameState;

  if (phase !== "night" || !alivePlayers.includes(playerName)) return null;

  const myRole = playerRoles[playerName]?.id;
  if (!myRole) return null;

  // Determine if it is active for this role
  const isActive = (role: string, currentPhase: string | null): boolean => {
    if (!currentPhase) return false;
    if (currentPhase === "werewolf") {
      return ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "white_wolf"].includes(role);
    }
    if (currentPhase === "cursed_wolf") {
      return role === "cursed_wolf";
    }
    if (currentPhase === "white_wolf") {
      return role === "white_wolf";
    }
    return role === currentPhase;
  };

  const getNightPhaseState = (): "before" | "active" | "after" => {
    if (!nightPhase) return "after";

    // If my role can act at any time, skip sequence phase gating
    const isActAnytime = ["seer", "medium", "pied_piper", "hunter"].includes(myRole);
    if (isActAnytime) {
      const isPlayerConfirmed = gameState.actionConfirmed || gameState.confirmedPlayers?.includes(playerName);
      return isPlayerConfirmed ? "after" : "active";
    }

    if (isActive(myRole, nightPhase)) {
      return "active";
    }

    const currentIdx = nightPhaseOrder.indexOf(nightPhase);
    if (currentIdx === -1) return "after";

    // Phases this player is supposed to act in
    const myPhases: string[] = [];
    if (["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "white_wolf"].includes(myRole)) {
      myPhases.push("werewolf");
    }
    if (myRole === "cursed_wolf") {
      myPhases.push("cursed_wolf");
    }
    if (myRole === "white_wolf" && dayCount >= 2 && dayCount % 2 === 0) {
      myPhases.push("white_wolf");
    }
    if (!["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "white_wolf"].includes(myRole)) {
      myPhases.push(myRole);
    }

    const activePhases = myPhases.filter((p) => {
      if (p === "cupid" && dayCount > 1) return false;
      if (p === "white_wolf" && (dayCount < 2 || dayCount % 2 !== 0)) return false;
      return true;
    });

    if (activePhases.length === 0) return "after";

    const firstPhaseIdx = Math.min(...activePhases.map((p) => nightPhaseOrder.indexOf(p)));
    if (currentIdx < firstPhaseIdx) return "before";

    const lastPhaseIdx = Math.max(...activePhases.map((p) => nightPhaseOrder.indexOf(p)));
    if (currentIdx > lastPhaseIdx) return "after";

    return "before"; // Waiting between multiple active phases
  };

  const phaseState = getNightPhaseState();
  const hasStrategy = !!ROLE_STRATEGIES[myRole];
  const activeRoleName = defaultRoles.find((r) => r.id === nightPhase)?.name || nightPhase;
  const myRoleName = defaultRoles.find((r) => r.id === myRole)?.name || myRole;

  const executeAction = (log: string | null, actionState: any, bcast: any) => {
    const nextUpdates = { ...actionState, actionConfirmed: true };
    dispatch({ type: "UPDATE", payload: nextUpdates });

    // IMPORTANT: send role-specific broadcast FIRST (before player-confirm),
    // so the host receives state updates (e.g. witchAction) before advancing phase
    if (channel && bcast) {
      channel.send({ type: "broadcast", event: bcast.name, payload: bcast.payload });
    }

    if (log) {
      const logObj = {
        id: Math.random().toString(),
        dayCount,
        roleId: myRole,
        playerName,
        content: log,
      };
      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev: any) => ({ actionLogs: [...prev.actionLogs, logObj] }),
      });
      if (channel) channel.send({ type: "broadcast", event: "add-log", payload: { log: logObj } });
    }

    dispatch({
      type: "UPDATE_FUNCTION",
      payload: (prev: any) => ({
        confirmedPlayers: [...new Set([...prev.confirmedPlayers, playerName])],
      }),
    });

    if (channel) {
      channel.send({ type: "broadcast", event: "player-confirm", payload: { playerName } });
    }
  };

  return (
    <div className="w-full">
      {/* 1. If player role has no night actions (e.g. Villager, Mayor, Fool) */}
      {!hasStrategy && (
        <div className="flex flex-col items-center rounded-2xl border border-indigo-900/30 bg-slate-900/40 p-6 text-center shadow-lg shadow-indigo-950/20 backdrop-blur-sm">
          <FaBed className="text-3xl text-indigo-400/80 mb-3 animate-pulse" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">
            Bạn Đang Ngủ Ngon
          </h3>
          <p className="mt-2 text-xs text-indigo-300 max-w-sm leading-relaxed">
            Bạn là <span className="font-bold text-indigo-100">{myRoleName}</span>. Đêm nay bạn không có hành động nào. Hãy giữ im lặng và đợi bình minh thức giấc.
          </p>
          <div className="mt-4 rounded-lg bg-slate-950/40 px-3 py-1.5 border border-indigo-950 text-[10px] text-slate-400">
            Lượt hiện tại: <span className="font-bold text-indigo-300">{activeRoleName}</span>
          </div>
        </div>
      )}

      {/* 2. If player has action, but it's BEFORE their turn */}
      {hasStrategy && phaseState === "before" && (
        <div className="flex flex-col items-center rounded-2xl border border-indigo-900/30 bg-slate-900/40 p-6 text-center shadow-lg shadow-indigo-950/20 backdrop-blur-sm">
          <FaHourglassHalf className="text-3xl text-indigo-400 mb-3 animate-pulse" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">
            Đang Chờ Đến Lượt
          </h3>
          <p className="mt-2 text-xs text-indigo-300 max-w-sm leading-relaxed">
            Vai trò của bạn là <span className="font-bold text-indigo-100">{myRoleName}</span>. Hãy kiên nhẫn chờ đến lượt hành động của bạn.
          </p>
          <div className="mt-4 rounded-lg bg-slate-950/40 px-3 py-1.5 border border-indigo-950 text-[10px] text-slate-400">
            Lượt hiện tại: <span className="font-bold text-indigo-300">{activeRoleName}</span>
          </div>
        </div>
      )}

      {/* 3. If player is ACTIVE (their turn now) */}
      {hasStrategy && phaseState === "active" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6 shadow-xl shadow-indigo-950/30 backdrop-blur-md w-full md:items-start"
        >
          <h3 className="mb-2 flex items-center text-sm font-extrabold text-indigo-200 uppercase tracking-wider">
            <FaMoon className="mr-2 text-lg text-indigo-400 animate-pulse" /> Lượt Của Bạn: {myRoleName}
          </h3>
          <div className="w-full">
            {(() => {
              const ActiveNightUI = ROLE_STRATEGIES[myRole];
              // Support multiple sub-roles rendering same werewolf UI
              const componentRoleId = (nightPhase === "werewolf" && ["cursed_wolf", "fog_wolf", "wolf_cub"].includes(myRole)) ? "werewolf" : myRole;
              const ResolvedUI = ROLE_STRATEGIES[componentRoleId] || ActiveNightUI;

              return (
                <ResolvedUI
                  gameState={gameState}
                  dispatch={dispatch}
                  channel={channel}
                  playerName={playerName}
                  executeAction={executeAction}
                />
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* 4. If player has acted and it is AFTER their turn */}
      {hasStrategy && phaseState === "after" && (
        <div className="flex flex-col items-center rounded-2xl border border-indigo-950 bg-slate-950/50 p-6 text-center shadow-lg shadow-indigo-950/10 backdrop-blur-sm animate-fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] mb-3">
            <FaCheckCircle className="text-xl animate-bounce" style={{ animationIterationCount: 1, animationDuration: "500ms" }} />
          </div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">
            Hành Động Hoàn Tất
          </h3>
          <p className="mt-2 text-xs text-slate-400 max-w-sm leading-relaxed">
            Bạn đã hoàn tất hành động đêm nay. Kết quả hoặc trạng thái của bạn sẽ được hiển thị hoặc áp dụng khi trời sáng.
          </p>
          
          {/* Display specific action results if applicable (like Seer inspection results) */}
          <div className="mt-4 w-full border-t border-slate-900 pt-4">
            {(() => {
              const ActiveNightUI = ROLE_STRATEGIES[myRole];
              const componentRoleId = (nightPhase === "werewolf" && ["cursed_wolf", "fog_wolf", "wolf_cub"].includes(myRole)) ? "werewolf" : myRole;
              const ResolvedUI = ROLE_STRATEGIES[componentRoleId] || ActiveNightUI;
              
              // Render the UI in its confirmed state
              return (
                <ResolvedUI
                  gameState={{ ...gameState, actionConfirmed: true }}
                  dispatch={dispatch}
                  channel={channel}
                  playerName={playerName}
                  executeAction={executeAction}
                />
              );
            })()}
          </div>
          
          <div className="mt-4 rounded-lg bg-slate-950/30 px-3 py-1.5 border border-indigo-950 text-[10px] text-slate-500">
            Lượt hiện tại: <span className="font-bold text-indigo-400">{activeRoleName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
