"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Star = {
  id: number;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
};

export default function NightSkyBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate random stars on client side to avoid hydration mismatch
    const generatedStars: Star[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 90}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // 1px to 3px
      duration: `${Math.random() * 4 + 2}s`, // 2s to 6s
      delay: `${Math.random() * 5}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Twilight gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020215] via-[#050522] to-[#0c0c3a]" />

      {/* Stars Starfield - Optimized by removing heavy box-shadow */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-indigo-100 animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            // @ts-ignore
            "--twinkle-duration": star.duration,
            animationDelay: star.delay,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* Glowing Moon */}
      <motion.div
        initial={{ opacity: 0, y: -20, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute right-12 top-12 flex h-24 w-24 items-center justify-center"
      >
        {/* Glow behind the moon - Optimized blur with radial gradient */}
        <div className="absolute h-32 w-32 rounded-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-indigo-400/20 to-transparent" />
        
        {/* Crescent moon shape using box-shadow (acceptable since it's not animated heavily) */}
        <div className="h-16 w-16 rounded-full shadow-[-12px_8px_0_0_#eef2ff] transform -rotate-[25deg]" />
      </motion.div>

      {/* Drifting Mist/Fog layers - Optimized by removing expensive CSS blurs and replacing with radial-gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-40 pointer-events-none select-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020215] to-transparent" />
        <div className="absolute bottom-[-50%] left-[-20%] w-[140%] h-64 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600/10 to-transparent rounded-[100%] animate-drift" style={{ willChange: "transform" }} />
        <div className="absolute bottom-[-40%] left-[-10%] w-[120%] h-56 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 to-transparent rounded-[100%] animate-drift" style={{ animationDelay: "-8s", willChange: "transform" }} />
      </div>
    </div>
  );
}
