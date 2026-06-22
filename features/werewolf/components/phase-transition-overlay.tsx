"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoon, FaSun } from "react-icons/fa";

type PhaseTransitionOverlayProps = {
  phase: string;
  dayCount: number;
};

export default function PhaseTransitionOverlay({
  phase,
  dayCount,
}: PhaseTransitionOverlayProps) {
  const [show, setShow] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [currentDay, setCurrentDay] = useState<number>(0);

  useEffect(() => {
    // Skip lobby and reveal phases
    if (phase !== "night" && phase !== "day") {
      setCurrentPhase(phase);
      setCurrentDay(dayCount);
      return;
    }

    // Trigger overlay when phase changes to night or day
    if (phase !== currentPhase || dayCount !== currentDay) {
      setCurrentPhase(phase);
      setCurrentDay(dayCount);
      setShow(true);
      
      const timer = setTimeout(() => {
        setShow(false);
      }, 2500); // Overlay disappears after 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [phase, dayCount]);

  const isNightTransition = currentPhase === "night";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: "spring", damping: 15, stiffness: 120 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center justify-center p-5 rounded-2xl border shadow-xl pointer-events-none min-w-[280px] text-center ${
            isNightTransition
              ? "bg-slate-950/80 border-indigo-500/30 text-white shadow-indigo-500/10 backdrop-blur-md"
              : "bg-white/95 border-amber-200 text-zinc-900 shadow-amber-500/10 backdrop-blur-md"
          }`}
        >
          {isNightTransition ? (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.3)] mb-2 animate-pulse">
                <FaMoon className="text-xl" />
              </div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-indigo-200">
                Đêm Buông Xuống
              </h3>
              <p className="text-xs font-bold text-indigo-400 mt-0.5">
                Đêm thứ {currentDay}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 italic font-medium">
                Làng đi ngủ. Vai trò thức giấc...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 border border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)] mb-2">
                <FaSun className="text-xl animate-spin-slow" style={{ animationDuration: "10s" }} />
              </div>
              <h3 className="text-base font-extrabold uppercase tracking-wider text-amber-600">
                Bình Minh Thức Giấc
              </h3>
              <p className="text-xs font-bold text-amber-700 mt-0.5">
                Ngày thứ {currentDay}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1 italic font-medium">
                Làng thức giấc. Thảo luận tìm Ma Sói...
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

