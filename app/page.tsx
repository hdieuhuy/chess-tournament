"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const GAMES = [
  {
    href: "/gomoku",
    title: "Cờ Caro",
    subtitle: "Gomoku",
    icon: (
      <div className="flex space-x-1">
        <span className="font-bold text-emerald-500">X</span>
        <span className="font-bold text-rose-500">O</span>
      </div>
    ),
    bgGradient: "from-emerald-500/10 to-emerald-500/0",
    borderGlow: "group-hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    href: "/chess",
    title: "Cờ Vua",
    subtitle: "Chess",
    icon: "♚",
    bgGradient: "from-amber-500/10 to-amber-500/0",
    borderGlow: "group-hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    href: "/xiangqi",
    title: "Cờ Tướng",
    subtitle: "Xiangqi",
    icon: "帥",
    bgGradient: "from-red-500/10 to-red-500/0",
    borderGlow: "group-hover:border-red-500/30",
    iconBg: "bg-red-500/10 text-red-600",
  },
  {
    href: "/go",
    title: "Cờ Vây",
    subtitle: "Go",
    icon: "⚫⚪",
    bgGradient: "from-zinc-500/10 to-zinc-500/0",
    borderGlow: "group-hover:border-zinc-500/30",
    iconBg: "bg-zinc-800 text-white",
  },
  {
    href: "/checkers",
    title: "Cờ Đam",
    subtitle: "Checkers",
    icon: "🔴",
    bgGradient: "from-rose-500/10 to-rose-500/0",
    borderGlow: "group-hover:border-rose-500/30",
    iconBg: "bg-rose-500/10 text-rose-600",
  },
  {
    href: "/oanquan",
    title: "Ô Ăn Quan",
    subtitle: "O An Quan",
    icon: "🪨",
    bgGradient: "from-orange-500/10 to-orange-500/0",
    borderGlow: "group-hover:border-orange-500/30",
    iconBg: "bg-orange-500/10 text-orange-600",
  },
  {
    href: "/battleship",
    title: "Bắn Thuyền",
    subtitle: "Battleship",
    icon: "🚢",
    bgGradient: "from-blue-500/10 to-blue-500/0",
    borderGlow: "group-hover:border-blue-500/30",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    href: "/jungle",
    title: "Cờ Thú",
    subtitle: "Jungle",
    icon: "🦁",
    bgGradient: "from-yellow-500/10 to-yellow-500/0",
    borderGlow: "group-hover:border-yellow-500/30",
    iconBg: "bg-yellow-500/10 text-yellow-600",
  },
  {
    href: "/werewolf",
    title: "Ma Sói",
    subtitle: "Werewolf",
    icon: "🐺",
    bgGradient: "from-indigo-500/10 to-indigo-500/0",
    borderGlow: "group-hover:border-indigo-500/30",
    iconBg: "bg-indigo-500/10 text-indigo-600",
  },
  {
    href: "/uno",
    title: "Bài Uno",
    subtitle: "Uno",
    icon: "🃏",
    bgGradient: "from-fuchsia-500/10 to-fuchsia-500/0",
    borderGlow: "group-hover:border-fuchsia-500/30",
    iconBg: "bg-fuchsia-500/10 text-fuchsia-600",
  },
  {
    href: "/exploding-kittens",
    title: "Mèo Nổ",
    subtitle: "Exploding Kittens",
    icon: "💣",
    bgGradient: "from-red-600/10 to-red-600/0",
    borderGlow: "group-hover:border-red-600/30",
    iconBg: "bg-red-600/10 text-red-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900 selection:bg-indigo-500/30 font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-rose-400/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="flex max-w-5xl flex-col items-center text-center w-full mt-4 md:mt-10"
        >
          {/* Logo */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white/50 blur-xl rounded-full scale-150" />
            <Image
              src="/logo.png"
              alt="BoardGame Portal Logo"
              width={160}
              height={160}
              className="relative w-28 md:w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
            />
          </div>

          {/* Tiêu đề chính */}
          <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-slate-900 to-slate-700 drop-shadow-sm">
            BoardGame <span className="text-indigo-600">Portal</span>
          </h1>

          {/* Đoạn mô tả */}
          <p className="mb-12 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-slate-600">
            Nơi hội tụ những bộ môn thể thao trí tuệ hàng đầu. Khám phá các bàn cờ kinh điển, thách thức bạn bè và thể hiện bản lĩnh qua từng ván đấu trực tuyến mượt mà.
          </p>

          {/* Danh sách Game */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12"
          >
            {GAMES.map((game) => (
              <motion.div key={game.href} variants={itemVariants} className="h-full">
                <Link
                  href={game.href}
                  className={`group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ${game.borderGlow}`}
                >
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-b opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${game.bgGradient}`} />
                  
                  {/* Icon Container */}
                  <div className={`relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${game.iconBg}`}>
                    {game.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="relative z-10 text-lg font-bold text-slate-800 transition-colors duration-300">
                    {game.title}
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="relative z-10 mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {game.subtitle}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="relative z-10 w-full border-t border-slate-200/60 bg-white/50 py-6 text-center text-sm text-slate-600 backdrop-blur-md"
      >
        <p className="mb-2 font-medium">
          © {new Date().getFullYear()} BoardGame Portal. All rights reserved.
        </p>
        <p className="flex items-center justify-center gap-2 font-medium">
          Được thiết kế & phát triển bởi 
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-500">
            Diệu Huy ( CoeS )
          </span>
        </p>
      </motion.footer>
    </div>
  );
}
