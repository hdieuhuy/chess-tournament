"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleConfig } from "../types";
import { RoleIcon, getRoleColor, getRoleDescription } from "../utils";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type SelfRoleCardProps = {
  playerName: string;
  role?: RoleConfig;
  originalRole?: RoleConfig;
  isNight?: boolean;
};

export default function SelfRoleCard({
  playerName,
  role,
  originalRole,
  isNight,
}: SelfRoleCardProps) {
  if (!role) return null;

  // Determine Faction and color
  const getFactionInfo = (roleId: string) => {
    const wolves = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"];
    const thirdParties = ["fool", "headhunter", "assassin", "thief", "tanner", "pied_piper", "white_wolf"];
    
    if (wolves.includes(roleId)) {
      return {
        name: "Phe Ma Sói",
        color: isNight
          ? "text-red-500 border-red-900/30 bg-red-950/20"
          : "text-red-700 border-red-200 bg-red-50",
      };
    }
    if (thirdParties.includes(roleId)) {
      return {
        name: "Phe Thứ Ba (Độc Lập)",
        color: isNight
          ? "text-purple-400 border-purple-900/30 bg-purple-950/20"
          : "text-purple-700 border-purple-200 bg-purple-50",
      };
    }
    return {
      name: "Phe Dân Làng",
      color: isNight
        ? "text-emerald-400 border-emerald-900/30 bg-emerald-950/20"
        : "text-emerald-700 border-emerald-200 bg-emerald-50",
    };
  };

  const faction = getFactionInfo(role.id);
  const colorClass = getRoleColor(role.id);

  return (
    <div className={`w-full rounded-2xl border p-5 transition-all duration-300 ${isNight ? "border-slate-700 bg-slate-800/80 shadow-md" : "border-zinc-200 bg-white shadow-sm"}`}>
      <div className="flex items-center justify-between border-b pb-3 mb-4 border-dashed border-zinc-200 dark:border-slate-700">
        <h3 className={`text-xs uppercase tracking-wider font-bold ${isNight ? "text-slate-400" : "text-zinc-500"}`}>
          Vai trò của bạn
        </h3>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="flex flex-col items-center text-center w-full">
          {/* Role Icon Wrapper */}
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border shadow-inner mb-3 ${isNight ? "bg-slate-900 border-slate-700" : "bg-zinc-100 border-zinc-200"}`}>
            <RoleIcon id={role.id} className={`text-3xl ${colorClass}`} />
          </div>

          <h4 className={`text-lg font-extrabold ${colorClass}`}>
            {role.name}
          </h4>

          {/* Faction Badge */}
          <span className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${faction.color}`}>
            {faction.name}
          </span>

          {originalRole && originalRole.id !== role.id && (
            <p className={`mt-1 text-[10px] italic ${isNight ? "text-slate-400" : "text-zinc-500"}`}>
              Vai trò ban đầu: <span className="line-through">{originalRole.name}</span>
            </p>
          )}

          {/* Role Description */}
          <p className={`mt-3 text-xs leading-relaxed max-w-[240px] ${isNight ? "text-slate-300" : "text-zinc-600"}`}>
            {getRoleDescription(role.id)}
          </p>
        </div>
      </div>
    </div>
  );
}
