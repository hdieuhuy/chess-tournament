"use client";

import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";

type GameHeaderProps = {
  phase: string;
  dayCount: number;
  timeLeft: number;
  isNight: boolean;
  promptText: string;
  nightPhase?: string | null;
  children?: React.ReactNode;
};

export default function GameHeader({
  phase,
  dayCount,
  timeLeft,
  isNight,
  promptText,
  nightPhase,
  children,
}: GameHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`w-full rounded-2xl border p-5 shadow-sm transition-all duration-500 ${
        isNight
          ? "border-indigo-900/50 bg-slate-800/80 text-white shadow-indigo-950/20"
          : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-200/50"
      }`}
    >
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Phase Info */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-105 ${
              isNight
                ? "bg-indigo-950 text-indigo-400 border border-indigo-800/50 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                : "bg-amber-100 text-amber-600 border border-amber-200"
            }`}
          >
            {isNight ? <FaMoon className="text-xl" /> : <FaSun className="text-xl" />}
          </div>
          <div className="text-left">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isNight ? "text-indigo-400" : "text-amber-600"
              }`}
            >
              Vòng đấu hiện tại
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">
              {isNight ? `Đêm ${dayCount}` : `Ngày ${dayCount}`}
            </h2>
          </div>
        </div>

        {/* Action Prompt */}
        <div className="flex-1 text-center md:text-left max-w-md">
          <p
            className={`text-xs font-semibold leading-relaxed ${
              isNight ? "text-indigo-200" : "text-zinc-600"
            }`}
          >
            {promptText}
          </p>
        </div>

        {/* Timer and Confirm Area */}
        <div className="flex flex-col items-center space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
          {/* Glowing Timer */}
          <div
            className={`flex h-12 px-4 items-center justify-center rounded-xl font-mono text-xl font-extrabold tracking-widest border transition-shadow ${
              isNight
                ? "bg-slate-900 border-indigo-800/60 text-indigo-200 shadow-[inset_0_0_8px_rgba(99,102,241,0.1)]"
                : "bg-zinc-50 border-zinc-200 text-amber-600"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
