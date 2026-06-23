import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Modal } from "./Modal";
import { FaBook, FaGamepad } from "react-icons/fa";
import { User2 } from "lucide-react";

type GlobalActionMenuProps = {
  playerName: string;
  onRenameClick: () => void;
  hasThemeToggle?: boolean;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  onShowRules?: () => void;
  align?: "left" | "right";
};

export function GlobalActionMenu({
  playerName,
  onRenameClick,
  hasThemeToggle,
  isDarkMode,
  onThemeToggle,
  onShowRules,
  align = "right",
}: GlobalActionMenuProps) {
  const [showGamesModal, setShowGamesModal] = useState(false);

  const containerClass = align === "left" ? "fixed left-4 top-4 z-50 flex flex-col gap-3" : "fixed right-4 top-4 z-50 flex flex-col gap-3";
  const tooltipClass = align === "left" ? "absolute left-full ml-2 top-1/2 -translate-y-1/2" : "absolute right-full mr-2 top-1/2 -translate-y-1/2";

  return (
    <>
      <div className={containerClass}>
        {/* Rename Button */}
        <div className="relative group flex justify-center">
          <button
            onClick={onRenameClick}
            className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isDarkMode
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
              }`}
          >
            <div className="w-5 h-5 flex items-center justify-center font-bold">
              <User2 />
            </div>
          </button>
          <div className={`${tooltipClass} px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>
            Đổi tên người chơi
          </div>
        </div>

        {/* Theme Toggle */}
        {hasThemeToggle && onThemeToggle && (
          <div className="relative group flex justify-center">
            <button
              onClick={onThemeToggle}
              className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isDarkMode
                  ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "bg-white text-slate-800 hover:bg-zinc-100 border border-zinc-200"
                }`}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <div className={`${tooltipClass} px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>
              {isDarkMode ? "Giao diện sáng" : "Giao diện tối"}
            </div>
          </div>
        )}

        {/* Rules Button */}
        {onShowRules && (
          <div className="relative group flex justify-center">
            <button
              onClick={onShowRules}
              className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isDarkMode
                  ? "bg-slate-800 text-indigo-400 hover:bg-slate-700"
                  : "bg-white text-indigo-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
            >
              <FaBook />
            </button>
            <div className={`${tooltipClass} px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>
              Hướng dẫn luật chơi
            </div>
          </div>
        )}

        {/* Switch Game Button */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => setShowGamesModal(true)}
            className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${isDarkMode
                ? "bg-slate-800 text-rose-400 hover:bg-slate-700"
                : "bg-white text-rose-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
          >
            <FaGamepad />
          </button>
          <div className={`${tooltipClass} px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>
            Đổi trò chơi
          </div>
        </div>
      </div>

      {/* Switch Game Modal (Built-in) */}
      <Modal isOpen={showGamesModal} title="Đổi Trò Chơi Khác" styleClassWrapper="max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {[
            { href: "/xiangqi", title: "Cờ Tướng", icon: "/icons/xiangqi.png" },
            { href: "/chess", title: "Cờ Vua", icon: "/icons/chess.png" },
            { href: "/gomoku", title: "Cờ Caro", icon: "/icons/gomoku.png" },
            { href: "/go", title: "Cờ Vây", icon: "/icons/go.png" },
            { href: "/jungle", title: "Cờ Thú", icon: "/icons/jungle.png" },
            { href: "/checkers", title: "Cờ Đam", icon: "/icons/checkers.png" },
            { href: "/oanquan", title: "Ô Ăn Quan", icon: "/icons/oanquan.png" },
            { href: "/uno", title: "Bài Uno", icon: "/icons/uno.png" },
            { href: "/exploding-kittens", title: "Mèo Nổ", icon: "/icons/exploding_kittens.png" },
            { href: "/battleship", title: "Bắn Thuyền", icon: "/icons/battleship.png" },
            { href: "/werewolf", title: "Ma Sói", icon: "/icons/werewolf.png" },
          ].map((g) => (
            <Link
              href={g.href}
              key={g.href}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 group ${isDarkMode
                  ? "border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-indigo-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1"
                }`}
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                <Image
                  src={g.icon}
                  alt={g.title}
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-contain rounded-2xl"
                />
              </div>
              <span className={`text-sm font-black transition-colors ${isDarkMode ? "text-slate-300 group-hover:text-indigo-400" : "text-slate-700 group-hover:text-indigo-600"
                }`}>
                {g.title}
              </span>
            </Link>
          ))}
        </div>
        <button
          onClick={() => setShowGamesModal(false)}
          className={`w-full mt-4 cursor-pointer rounded-xl py-3 text-sm font-bold transition ${isDarkMode
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
        >
          Hủy
        </button>
      </Modal>
    </>
  );
}
