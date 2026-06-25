import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Modal } from "./Modal";
import { FaBook, FaGamepad } from "react-icons/fa";
import { User2, Settings, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const containerClass = align === "left"
    ? "fixed left-4 top-4 z-50 flex lg:flex-col items-center gap-3"
    : "fixed right-4 top-4 z-50 flex lg:flex-col items-center gap-3";

  const tooltipClass = align === "left"
    ? "absolute left-full ml-2 top-1/2 -translate-y-1/2"
    : "absolute right-full mr-2 top-1/2 -translate-y-1/2";

  const menuItems = [
    // Rename Button
    {
      id: "rename",
      label: "Đổi tên người chơi",
      icon: <User2 className="w-5 h-5 font-bold" />,
      onClick: () => {
        onRenameClick();
        setIsExpanded(false);
      },
      colorClass: isDarkMode
        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
        : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200",
    },
    // Theme Toggle
    ...(hasThemeToggle && onThemeToggle
      ? [
          {
            id: "theme",
            label: isDarkMode ? "Giao diện sáng" : "Giao diện tối",
            icon: <span className="text-lg">{isDarkMode ? "☀️" : "🌙"}</span>,
            onClick: () => {
              onThemeToggle();
              setIsExpanded(false);
            },
            colorClass: isDarkMode
              ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
              : "bg-white text-slate-800 hover:bg-zinc-100 border border-zinc-200",
          },
        ]
      : []),
    // Rules Button
    ...(onShowRules
      ? [
          {
            id: "rules",
            label: "Hướng dẫn luật chơi",
            icon: <FaBook className="w-4 h-4 sm:w-5 sm:h-5" />,
            onClick: () => {
              onShowRules();
              setIsExpanded(false);
            },
            colorClass: isDarkMode
              ? "bg-slate-800 text-indigo-400 hover:bg-slate-700"
              : "bg-white text-indigo-600 hover:bg-zinc-100 border border-zinc-200",
          },
        ]
      : []),
    // Switch Game Button
    {
      id: "switch-game",
      label: "Đổi trò chơi",
      icon: <FaGamepad className="w-4 h-4 sm:w-5 sm:h-5" />,
      onClick: () => {
        setShowGamesModal(true);
        setIsExpanded(false);
      },
      colorClass: isDarkMode
        ? "bg-slate-800 text-rose-400 hover:bg-slate-700"
        : "bg-white text-rose-600 hover:bg-zinc-100 border border-zinc-200",
    },
  ];

  return (
    <>
      <div className={containerClass}>
        {/* Desktop View (Show all buttons) */}
        {!isMobile &&
          menuItems.map((item) => (
            <div key={item.id} className="relative group flex justify-center">
              <button
                onClick={item.onClick}
                className={`flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 ${item.colorClass}`}
              >
                {item.icon}
              </button>
              <div className={`${tooltipClass} px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50`}>
                {item.label}
              </div>
            </div>
          ))}

        {/* Mobile View (Collapsible FAB) */}
        {isMobile && (
          <div className="flex items-center gap-3">
            {/* Expanded items */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: align === "right" ? 50 : -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: align === "right" ? 50 : -50 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex items-center gap-2"
                >
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-md active:scale-95 ${item.colorClass}`}
                      aria-label={item.label}
                    >
                      {item.icon}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Trigger Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 z-50 ${isDarkMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center"
              >
                {isExpanded ? <X /> : <Settings />}
              </motion.div>
            </button>
          </div>
        )}
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
