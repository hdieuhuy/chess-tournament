"use client";

import React from "react";
import { FaCheck } from "react-icons/fa";
import { useWerewolf } from "../contexts/werewolf-context";
import { defaultRoles, RoleIcon } from "../utils";

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

export default function NightSequenceTracker() {
  const { gameState } = useWerewolf();
  const { phase, nightPhase, roleConfig, dayCount } = gameState;

  if (phase !== "night" || !nightPhase) return null;

  // Filter sequence to only show roles that are configured in this game
  const activeSequence = nightPhaseOrder.filter((roleId) => {
    if (roleId === "cupid" && dayCount > 1) return false;
    if (roleId === "white_wolf" && (dayCount < 2 || dayCount % 2 !== 0)) return false;

    if (roleId === "werewolf") {
      return roleConfig.some(
        (rc) => rc.count > 0 && ["werewolf", "fog_wolf", "wolf_cub", "lycan", "cursed_wolf", "white_wolf"].includes(rc.id)
      );
    }
    return roleConfig.some((rc) => rc.count > 0 && rc.id === roleId);
  });

  if (activeSequence.length <= 1) return null; // No need to track if 1 or 0 roles

  const currentIdx = activeSequence.indexOf(nightPhase);

  return (
    <div className="w-full rounded-2xl border border-indigo-950 bg-slate-950/60 px-5 py-4 shadow-lg shadow-indigo-950/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Tiến trình Đêm {dayCount}
        </h4>
        <span className="text-[9px] text-slate-500 font-medium">
          {currentIdx + 1}/{activeSequence.length} vai trò
        </span>
      </div>

      {/* Horizontal progress bar */}
      <div className="relative flex items-center gap-0 w-full overflow-x-auto pb-1">
        {activeSequence.map((roleId, idx) => {
          const roleData = defaultRoles.find((r) => r.id === roleId);
          const name = roleData ? roleData.name : roleId;

          const isActive = idx === currentIdx;
          const isPassed = currentIdx === -1 || idx < currentIdx;
          const isLast = idx === activeSequence.length - 1;

          return (
            <div key={roleId} className="flex items-center flex-1 min-w-0">
              {/* Step node */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    isActive
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse scale-110"
                      : isPassed
                        ? "border-indigo-800 bg-indigo-950 text-indigo-500"
                        : "border-slate-800 bg-slate-950 text-slate-700 opacity-50"
                  }`}
                >
                  {isPassed ? (
                    <FaCheck className="text-[9px] text-indigo-400" />
                  ) : (
                    <RoleIcon id={roleId === "werewolf" ? "werewolf" : roleId} className="text-[10px]" />
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[9px] font-semibold text-center whitespace-nowrap max-w-[64px] truncate ${
                    isActive
                      ? "text-indigo-300 font-bold"
                      : isPassed
                        ? "text-slate-600 line-through"
                        : "text-slate-600 opacity-50"
                  }`}
                >
                  {name}
                </span>
                {isActive && (
                  <span className="text-[8px] text-indigo-400 animate-pulse mt-0.5 whitespace-nowrap">● Đang hoạt động</span>
                )}
              </div>
              {/* Connector line between steps */}
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors duration-300 ${
                  isPassed ? "bg-indigo-800" : "bg-slate-800"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
