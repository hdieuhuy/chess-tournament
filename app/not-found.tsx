"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaDiceD20 } from "react-icons/fa";
import { GiChessKnight, GiCardJoker, GiMeeple } from "react-icons/gi";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] text-zinc-100 selection:bg-amber-500/30">
      {/* Background Ornaments */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <div className="h-[800px] w-[800px] rounded-full border-[2px] border-amber-500" />
        <div className="absolute h-[600px] w-[600px] rounded-full border-[2px] border-amber-500" />
        <div className="absolute h-[400px] w-[400px] rounded-full border-[2px] border-amber-500" />
        <div className="absolute h-[1000px] w-[1000px] rounded-full border-[2px] border-amber-500" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0b_70%)] pointer-events-none" />

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [-15, 15, -15], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[10%] top-[20%] text-amber-500/10 sm:left-[15%] sm:top-[25%]"
      >
        <GiChessKnight className="h-24 w-24 drop-shadow-2xl sm:h-32 sm:w-32" />
      </motion.div>

      <motion.div
        animate={{ y: [20, -20, 20], rotate: [0, -15, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-[10%] top-[15%] text-emerald-500/10 sm:right-[15%] sm:top-[20%]"
      >
        <GiCardJoker className="h-24 w-24 drop-shadow-2xl sm:h-32 sm:w-32" />
      </motion.div>

      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 20, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute left-[15%] bottom-[15%] text-blue-500/10 sm:left-[20%] sm:bottom-[20%]"
      >
        <GiMeeple className="h-20 w-20 drop-shadow-2xl sm:h-28 sm:w-28" />
      </motion.div>

      <motion.div
        animate={{ y: [15, -15, 15], rotate: [0, -25, 25, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute right-[20%] bottom-[20%] text-rose-500/10 sm:right-[25%] sm:bottom-[25%]"
      >
        <FaDiceD20 className="h-20 w-20 drop-shadow-2xl sm:h-24 sm:w-24" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="relative"
        >
          <h1 className="text-[8rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-sm sm:text-[15rem]">
            404
          </h1>
          <motion.div 
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-950"
          >
            <FaDiceD20 className="h-12 w-12 opacity-50 mix-blend-overlay sm:h-24 sm:w-24" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 flex flex-col items-center gap-4 px-4"
        >
          <h2 className="text-2xl font-bold tracking-tight text-zinc-200 sm:text-4xl">
            Lạc khỏi bàn cờ!
          </h2>
          <p className="max-w-[500px] text-base text-zinc-400 sm:text-lg">
            Có vẻ như bạn đã đi vào một ô không hợp lệ. Nước đi này không tồn tại trong luật chơi của BoardRealm.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10"
        >
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-4 px-8 font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span className="relative z-10 flex items-center gap-2">
              <GiChessKnight className="h-5 w-5" />
              Quay lại sảnh chính
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
