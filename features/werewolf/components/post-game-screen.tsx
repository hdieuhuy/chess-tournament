"use client";

import React, { useEffect } from "react";
import { FaClipboardList, FaUndoAlt, FaSkull, FaCheck } from "react-icons/fa";
import { RoleConfig } from "../types";
import { RoleIcon, getRoleColor } from "../utils";
import { motion } from "framer-motion";

type PostGameScreenProps = {
  winner: string | null;
  players: string[];
  playerRoles: Record<string, RoleConfig>;
  originalRoles: Record<string, RoleConfig>;
  playerName: string;
  hostName: string | null;
  alivePlayers?: string[];
  handleResetGame: () => void;
  showSummaryModal: () => void;
};

export default function PostGameScreen({
  winner,
  players,
  playerRoles,
  originalRoles,
  playerName,
  hostName,
  alivePlayers = [],
  handleResetGame,
  showSummaryModal,
}: PostGameScreenProps) {
  const isHost = hostName === playerName;

  // Determine Faction
  const getPlayerFaction = (roleId?: string) => {
    if (!roleId) return "villager";
    const wolves = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"];
    const thirdParties = ["fool", "headhunter", "assassin", "thief", "tanner", "pied_piper", "white_wolf"];
    if (wolves.includes(roleId)) return "wolf";
    if (thirdParties.includes(roleId)) return "third_party";
    return "villager";
  };

  // Group players by faction
  const groupedPlayers = {
    villager: [] as string[],
    wolf: [] as string[],
    third_party: [] as string[],
  };
  players.forEach((p) => {
    const r = playerRoles[p];
    const faction = getPlayerFaction(r?.id);
    groupedPlayers[faction].push(p);
  });

  // Victory configuration per winner
  const getWinConfig = () => {
    switch (winner) {
      case "wolves":
        return {
          text: "Phe Ma Sói Thắng!",
          subText: "Bóng tối đã che phủ cả làng. Ma Sói chiến thắng trong đêm tối!",
          emoji: "🐺",
          bg: "from-red-950 via-red-900 to-rose-950",
          border: "border-red-700/60",
          textColor: "text-red-100",
          subColor: "text-red-300/80",
          glow: "shadow-[0_0_80px_rgba(220,38,38,0.35)]",
          emojiBg: "bg-red-900/80 border-red-700/50",
          confettiColors: ["#ef4444", "#dc2626", "#f97316", "#b91c1c"],
        };
      case "lovers":
        return {
          text: "Cặp Đôi Chiến Thắng!",
          subText: "Tình yêu vượt qua mọi thử thách. Đôi uyên ương đã sống sót bên nhau!",
          emoji: "💖",
          bg: "from-pink-950 via-rose-900 to-pink-950",
          border: "border-pink-600/60",
          textColor: "text-pink-100",
          subColor: "text-pink-300/80",
          glow: "shadow-[0_0_80px_rgba(244,114,182,0.35)]",
          emojiBg: "bg-pink-900/80 border-pink-700/50",
          confettiColors: ["#ec4899", "#f43f5e", "#db2777", "#fda4af"],
        };
      case "fool":
        return {
          text: "Kẻ Ngốc Chiến Thắng!",
          subText: "Trò đùa vĩ đại nhất! Kẻ Ngốc bị treo cổ và bật cười chiến thắng!",
          emoji: "🃏",
          bg: "from-fuchsia-950 via-purple-900 to-fuchsia-950",
          border: "border-fuchsia-600/60",
          textColor: "text-fuchsia-100",
          subColor: "text-fuchsia-300/80",
          glow: "shadow-[0_0_80px_rgba(217,70,239,0.35)]",
          emojiBg: "bg-fuchsia-900/80 border-fuchsia-700/50",
          confettiColors: ["#d946ef", "#a855f7", "#c026d3", "#f0abfc"],
        };
      case "headhunter":
        return {
          text: "Thợ Săn Người Thắng!",
          subText: "Mục tiêu đã bị tiêu diệt. Thợ Săn Người hoàn thành nhiệm vụ bí mật!",
          emoji: "🎯",
          bg: "from-cyan-950 via-teal-900 to-cyan-950",
          border: "border-cyan-600/60",
          textColor: "text-cyan-100",
          subColor: "text-cyan-300/80",
          glow: "shadow-[0_0_80px_rgba(6,182,212,0.35)]",
          emojiBg: "bg-cyan-900/80 border-cyan-700/50",
          confettiColors: ["#06b6d4", "#0891b2", "#14b8a6", "#67e8f9"],
        };
      case "assassin":
        return {
          text: "Sát Thủ Chiến Thắng!",
          subText: "Ẩn mình trong bóng tối, ra đòn chí mạng. Sát Thủ hoàn thành sứ mệnh!",
          emoji: "🔪",
          bg: "from-zinc-950 via-slate-900 to-zinc-950",
          border: "border-zinc-600/60",
          textColor: "text-zinc-100",
          subColor: "text-zinc-400/80",
          glow: "shadow-[0_0_80px_rgba(113,113,122,0.35)]",
          emojiBg: "bg-zinc-800/80 border-zinc-600/50",
          confettiColors: ["#71717a", "#52525b", "#a1a1aa", "#d4d4d8"],
        };
      case "white_wolf":
        return {
          text: "Sói Trắng Chiến Thắng!",
          subText: "Kẻ phản bội cuối cùng đứng một mình. Sói Trắng thống trị tất cả!",
          emoji: "🐺",
          bg: "from-slate-900 via-gray-800 to-slate-900",
          border: "border-slate-500/60",
          textColor: "text-slate-100",
          subColor: "text-slate-400/80",
          glow: "shadow-[0_0_80px_rgba(148,163,184,0.35)]",
          emojiBg: "bg-slate-700/80 border-slate-500/50",
          confettiColors: ["#cbd5e1", "#94a3b8", "#e2e8f0", "#f1f5f9"],
        };
      case "pied_piper":
        return {
          text: "Người Thổi Sáo Chiến Thắng!",
          subText: "Giai điệu ma mị của sự thôi miên! Tất cả đã bị mê hoặc hoàn toàn!",
          emoji: "🎵",
          bg: "from-emerald-950 via-teal-900 to-emerald-950",
          border: "border-emerald-600/60",
          textColor: "text-emerald-100",
          subColor: "text-emerald-300/80",
          glow: "shadow-[0_0_80px_rgba(16,185,129,0.35)]",
          emojiBg: "bg-emerald-900/80 border-emerald-700/50",
          confettiColors: ["#10b981", "#059669", "#34d399", "#6ee7b7"],
        };
      default:
        return {
          text: "Phe Dân Làng Thắng!",
          subText: "Công lý đã chiến thắng! Dân làng đã đoàn kết tìm ra và tiêu diệt Ma Sói!",
          emoji: "🌾",
          bg: "from-green-950 via-emerald-900 to-green-950",
          border: "border-green-600/60",
          textColor: "text-green-100",
          subColor: "text-green-300/80",
          glow: "shadow-[0_0_80px_rgba(34,197,94,0.35)]",
          emojiBg: "bg-green-900/80 border-green-700/50",
          confettiColors: ["#22c55e", "#16a34a", "#4ade80", "#86efac"],
        };
    }
  };

  const winConfig = getWinConfig();

  // Canvas confetti burst on mount
  useEffect(() => {
    let confetti: any = null;
    import("canvas-confetti").then((mod) => {
      confetti = mod.default;
      const duration = 3500;
      const end = Date.now() + duration;

      const fire = () => {
        if (Date.now() > end) return;
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: winConfig.confettiColors,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: winConfig.confettiColors,
        });
        requestAnimationFrame(fire);
      };
      fire();
    });
  }, []);

  const renderPlayerSummaryCard = (p: string) => {
    const r = playerRoles[p];
    const originalR = originalRoles[p];
    const isMe = p === playerName;
    const isAlive = alivePlayers.includes(p);
    const faction = getPlayerFaction(r?.id);

    let factionBorder = "border-l-indigo-500";
    if (faction === "wolf") {
      factionBorder = "border-l-rose-500 border-red-100 bg-red-50/5 hover:bg-red-50/15";
    } else if (faction === "villager") {
      factionBorder = "border-l-emerald-500 border-emerald-100 bg-emerald-50/5 hover:bg-emerald-50/15";
    } else {
      factionBorder = "border-l-purple-500 border-purple-100 bg-purple-50/5 hover:bg-purple-50/15";
    }

    const cardClasses = `flex items-center justify-between p-3.5 rounded-xl border border-l-4 transition-all duration-200 w-full hover:shadow-md ${factionBorder} ${
      isMe ? "ring-2 ring-indigo-500 ring-offset-1" : ""
    } ${!isAlive ? "opacity-60 bg-slate-50/40" : "bg-white"}`;

    return (
      <div key={p} className={cardClasses}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-inner bg-gradient-to-tr ${
            faction === "wolf"
              ? "from-red-600 to-rose-400"
              : faction === "villager"
                ? "from-emerald-600 to-teal-400"
                : "from-purple-600 to-indigo-400"
          }`}>
            {p.charAt(0).toUpperCase()}
            <span className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] border border-white text-white ${
              isAlive ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-zinc-500"
            }`}>
              {isAlive ? <FaCheck className="text-[7px]" /> : <FaSkull className="text-[7px]" />}
            </span>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className={`text-sm font-extrabold text-zinc-800 truncate ${isMe ? "text-indigo-600" : ""}`}>
              {p} {isMe && <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 rounded px-1 ml-0.5">Bạn</span>}
            </span>
            <span className={`mt-0.5 inline-flex items-center text-[9px] font-bold uppercase tracking-wider ${
              isAlive ? "text-emerald-600" : "text-zinc-400"
            }`}>
              {isAlive ? "Sống sót" : "Tử nạn"}
            </span>
          </div>
        </div>
        {r && (
          <div className="flex flex-col items-end space-y-1 shrink-0 ml-2">
            {originalR && originalR.id !== r.id ? (
              <div className="flex items-center space-x-1.5">
                <span className={`flex items-center space-x-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold line-through opacity-40 border bg-zinc-50 ${getRoleColor(originalR.id)} border-zinc-200`}>
                  <RoleIcon id={originalR.id} className="text-[10px]" />
                  <span>{originalR.name}</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">➔</span>
                <span className={`flex items-center space-x-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold border bg-zinc-50 ${getRoleColor(r.id)} border-zinc-200 shadow-sm`}>
                  <RoleIcon id={r.id} className="text-[10px]" />
                  <span>{r.name}</span>
                </span>
              </div>
            ) : (
              <span className={`flex items-center space-x-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold border bg-zinc-50 ${getRoleColor(r.id)} border-zinc-200 shadow-sm`}>
                <RoleIcon id={r.id} className="text-[10px] mr-0.5" />
                <span>{r.name}</span>
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col max-w-4xl space-y-6 text-left mt-4">
      {/* === VICTORY BANNER === */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className={`relative flex flex-col items-center justify-center px-8 py-10 rounded-3xl border overflow-hidden ${winConfig.glow} ${winConfig.border} bg-gradient-to-br ${winConfig.bg}`}
      >
        {/* Subtle radial glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.07)_0%,transparent_100%)] pointer-events-none" />

        {/* Animated emoji icon */}
        <motion.div
          initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5, type: "spring", stiffness: 220 }}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 text-4xl mb-5 shadow-2xl ${winConfig.emojiBg}`}
        >
          {winConfig.emoji}
          {/* Pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border-2 border-white/20"
          />
        </motion.div>

        {/* Victory title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className={`relative z-10 text-3xl md:text-4xl font-black uppercase tracking-wider mb-3 text-center ${winConfig.textColor}`}
        >
          {winConfig.text}
        </motion.h1>

        {/* Sub description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className={`relative z-10 text-sm max-w-md leading-relaxed font-medium text-center ${winConfig.subColor}`}
        >
          {winConfig.subText}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="relative z-10 mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button
            onClick={showSummaryModal}
            className="flex cursor-pointer items-center space-x-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm px-6 py-3 text-sm font-extrabold text-white transition-all hover:bg-white/20 hover:scale-105"
          >
            <FaClipboardList className="text-xs opacity-80" />
            <span>Xem Nhật Ký Toàn Trận</span>
          </button>

          {isHost ? (
            <button
              onClick={handleResetGame}
              className="flex cursor-pointer items-center space-x-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-zinc-900 transition-all hover:bg-zinc-100 shadow-lg hover:scale-105"
            >
              <FaUndoAlt className="text-xs" />
              <span>Quay lại Phòng Chờ</span>
            </button>
          ) : (
            <div className="rounded-xl bg-black/20 px-6 py-3 text-xs font-bold text-white/50 uppercase tracking-wider border border-white/10">
              Đang đợi chủ phòng quay lại sảnh...
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Grouped Players Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Villagers */}
        <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100 flex flex-col shadow-sm">
          <h4 className="font-extrabold text-emerald-800 mb-4 text-left uppercase tracking-wider text-xs flex items-center border-b border-emerald-100 pb-2.5">
            🌾 Phe Dân Làng
          </h4>
          <div className="flex flex-col space-y-3 flex-1">
            {groupedPlayers.villager.length === 0 ? (
              <p className="text-xs text-emerald-400 italic py-2">Không có</p>
            ) : (
              groupedPlayers.villager.map(renderPlayerSummaryCard)
            )}
          </div>
        </div>

        {/* Wolves */}
        <div className="bg-red-50/20 p-5 rounded-2xl border border-red-100 flex flex-col shadow-sm">
          <h4 className="font-extrabold text-red-800 mb-4 text-left uppercase tracking-wider text-xs flex items-center border-b border-red-100 pb-2.5">
            🐺 Phe Ma Sói
          </h4>
          <div className="flex flex-col space-y-3 flex-1">
            {groupedPlayers.wolf.length === 0 ? (
              <p className="text-xs text-red-400 italic py-2">Không có</p>
            ) : (
              groupedPlayers.wolf.map(renderPlayerSummaryCard)
            )}
          </div>
        </div>

        {/* Third Party */}
        <div className="bg-purple-50/20 p-5 rounded-2xl border border-purple-100 flex flex-col shadow-sm">
          <h4 className="font-extrabold text-purple-800 mb-4 text-left uppercase tracking-wider text-xs flex items-center border-b border-purple-100 pb-2.5">
            🎭 Phe Thứ 3
          </h4>
          <div className="flex flex-col space-y-3 flex-1">
            {groupedPlayers.third_party.length === 0 ? (
              <p className="text-xs text-purple-400 italic py-2">Không có</p>
            ) : (
              groupedPlayers.third_party.map(renderPlayerSummaryCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
