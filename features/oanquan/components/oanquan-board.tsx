"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHandPaper, FaHandRock, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import confetti from "canvas-confetti";
import { Cell } from "../types";
import { useOAnQuan } from "../contexts/oanquan-context";

const PEBBLE_COLORS = [
  "bg-red-500 border-red-700",
  "bg-blue-500 border-blue-700",
  "bg-green-500 border-green-700",
  "bg-yellow-400 border-yellow-600",
  "bg-purple-500 border-purple-700",
  "bg-pink-500 border-pink-700",
  "bg-orange-500 border-orange-700",
  "bg-teal-500 border-teal-700",
  "bg-cyan-500 border-cyan-700",
  "bg-indigo-500 border-indigo-700",
];

const CellContent = ({
  cell,
  isQuan,
  isDropping,
  isCaptured,
  isHoverable,
  onDragDirection,
  onCellClick,
}: {
  cell: Cell;
  isQuan?: boolean;
  isDropping?: boolean;
  isCaptured?: boolean;
  isHoverable?: boolean;
  onDragDirection?: (dir: "left" | "right") => void;
  onCellClick?: () => void;
}) => {
  const MAX_PEBBLES = isQuan ? 30 : 15;
  const pebblesCount = Math.min(cell.stones, MAX_PEBBLES);
  const pebbles = Array.from({ length: pebblesCount });

  return (
    <div
      onClick={onCellClick}
      className={`relative w-full h-full flex flex-col items-center transition-all duration-300 ${isQuan ? "justify-center" : "justify-center"} ${isHoverable ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
    >
      {/* Drop animation overlay */}
      <AnimatePresence>
        {isDropping && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-0 bg-white/60 rounded-full"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDropping && (
          <motion.div
            initial={{ y: -40, opacity: 0, x: "-50%", rotate: 20 }}
            animate={{ y: 0, opacity: 1, x: "-50%", rotate: 0 }}
            exit={{ y: -10, opacity: 0, x: "-50%" }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
            className="absolute left-1/2 z-50 text-4xl sm:text-5xl md:text-6xl drop-shadow-lg -top-6 sm:-top-8"
          >
            <FaHandPaper className="text-amber-600 rotate-[160deg]" />
            <motion.div 
              initial={{ y: -10, opacity: 1 }}
              animate={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-stone-300 border-2 border-stone-500 shadow-md"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCaptured && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <span className="text-yellow-400 font-black text-5xl sm:text-7xl drop-shadow-[0_0_20px_rgba(250,204,21,1)]">
              <FaStar />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCaptured && (
          <motion.div
            initial={{ scale: 2.5, y: -50, opacity: 0, rotate: -15 }}
            animate={{ scale: 1.2, y: 0, opacity: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="absolute inset-0 z-50 flex items-center justify-center text-6xl sm:text-8xl drop-shadow-2xl text-amber-700"
          >
            <FaHandRock />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Quan piece */}
      {cell.quan > 0 && (
        <div className="relative z-10 w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-zinc-800 border-[3px] border-zinc-600 mb-2 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.6),3px_3px_6px_rgba(0,0,0,0.4)] flex items-center justify-center">
           <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-zinc-700 shadow-inner"></div>
        </div>
      )}

      {/* Pebbles container */}
      {cell.stones > 0 ? (
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <motion.div
            layout
            drag={isHoverable ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, info) => {
              if (!onDragDirection) return;
              if (info.offset.x > 10) {
                onDragDirection("right");
              } else if (info.offset.x < -10) {
                onDragDirection("left");
              }
            }}
            onClick={(e) => {
              if (onCellClick) onCellClick();
            }}
            whileDrag={{ scale: 1.1, zIndex: 50 }}
            className={`relative z-10 flex flex-wrap justify-center content-center gap-1 sm:gap-1.5 ${isQuan ? "w-16 sm:w-24" : "w-[80%]"} `}
          >
            <AnimatePresence>
              {pebbles.map((_, i) => (
                <motion.div
                  layout
                  key={i}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.4),1px_1px_2px_rgba(0,0,0,0.3)] border ${PEBBLE_COLORS[i % PEBBLE_COLORS.length]}`}
                />
              ))}
            </AnimatePresence>
            {cell.stones > MAX_PEBBLES && (
              <motion.div 
                layout 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div className="bg-black/60 backdrop-blur-sm text-white font-bold text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
                  x{cell.stones}
                </div>
              </motion.div>
            )}
          </motion.div>
          
          <span className="font-bold text-base sm:text-xl text-amber-950 bg-white/80 px-2.5 py-0.5 rounded-full shadow-md border border-amber-900/10">
            {cell.stones + (cell.quan * 10)}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
           {isQuan && cell.quan > 0 && (
              <span className="font-bold text-base sm:text-xl text-amber-950 bg-white/80 px-2.5 py-0.5 rounded-full shadow-md border border-amber-900/10">
                10
              </span>
           )}
           {cell.quan === 0 && (
             <span className="text-amber-900/30 font-medium text-2xl">-</span>
           )}
        </div>
      )}
    </div>
  );
};

export function OAnQuanBoard() {
  const {
    board,
    gamePhase,
    isP1Turn,
    p1Score,
    p2Score,
    player1Name,
    player2Name,
    playerName,
    winner,
    animationState: { isAnimating, dropIndex, captureIndices, selectedCell },
    handleCellClick,
    handleDirectionSelect,
  } = useOAnQuan();

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isMyTurn = (isPlayer1 && isP1Turn) || (isPlayer2 && !isP1Turn);

  const getCellClass = (index: number) => {
    let baseClass =
      "relative transition-all duration-300 select-none flex items-center justify-center ";

    // The grid borders logic
    if (index >= 0 && index <= 4) {
      // Bottom row (0-4)
      baseClass += "border-t-[3px] sm:border-t-[4px] border-amber-950 ";
      if (index > 0) baseClass += "border-l-[3px] sm:border-l-[4px] border-amber-950 ";
    } else if (index >= 6 && index <= 10) {
      // Top row (10-6)
      baseClass += "border-b-[3px] sm:border-b-[4px] border-amber-950 ";
      if (index < 10) baseClass += "border-l-[3px] sm:border-l-[4px] border-amber-950 ";
    }

    const isHoverable =
      gamePhase === "playing" &&
      isMyTurn &&
      !winner &&
      !isAnimating &&
      ((isPlayer1 && index >= 0 && index <= 4) || (isPlayer2 && index >= 6 && index <= 10)) &&
      board[index].stones > 0;

    if (isHoverable) {
      baseClass += "cursor-pointer hover:bg-amber-200/50 ";
    }

    if (selectedCell === index) {
      baseClass += "bg-amber-300/60 shadow-[inset_0_0_20px_rgba(217,119,6,0.5)] ";
    } else if ((isPlayer1 && index >= 0 && index <= 4) || (!isPlayer1 && index >= 6 && index <= 10)) {
      // Highlight player's own side slightly
      baseClass += "bg-white/10 ";
    }

    return baseClass;
  };

  const renderMoveButtons = (index: number) => {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-6 sm:gap-10 z-40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDirectionSelect("cw");
          }}
          className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:scale-110 hover:bg-blue-500 transition-all border-4 border-white"
        >
          <FaChevronLeft className="text-2xl sm:text-3xl" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDirectionSelect("ccw");
          }}
          className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:scale-110 hover:bg-blue-500 transition-all border-4 border-white"
        >
          <FaChevronRight className="text-2xl sm:text-3xl" />
        </button>
      </div>
    );
  };

  const isViewInverted = isPlayer2;

  const topRowIndices = isViewInverted ? [4, 3, 2, 1, 0] : [10, 9, 8, 7, 6];
  const bottomRowIndices = isViewInverted ? [6, 7, 8, 9, 10] : [0, 1, 2, 3, 4];
  const leftQuanIndex = isViewInverted ? 5 : 11;
  const rightQuanIndex = isViewInverted ? 11 : 5;

  useEffect(() => {
    if (winner) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          }),
        );
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          }),
        );
      }, 250);
    }
  }, [winner]);

  const topPlayerName = isViewInverted ? player1Name : player2Name;
  const bottomPlayerName = isViewInverted ? player2Name : player1Name;

  const topPlayerRole = isViewInverted ? "Người chơi 1" : "Người chơi 2";
  const bottomPlayerRole = isViewInverted ? "Người chơi 2" : "Người chơi 1";

  const topPlayerScore = isViewInverted ? p1Score : p2Score;
  const bottomPlayerScore = isViewInverted ? p2Score : p1Score;

  const isTopPlayerTurn = isViewInverted ? isP1Turn : !isP1Turn;
  const isBottomPlayerTurn = isViewInverted ? !isP1Turn : isP1Turn;

  return (
    <div className="flex w-full flex-col items-center justify-center h-full pb-4 sm:pb-10">
      
      {/* Top Player (Opponent) */}
      <div className={`flex w-full max-w-[1200px] justify-between items-end mb-4 transition-opacity ${gamePhase === "waiting" ? "opacity-50" : "opacity-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-md bg-zinc-800 text-white ${isTopPlayerTurn && gamePhase === "playing" ? "ring-2 ring-blue-500 shadow-blue-500/50" : ""}`}>
            {(topPlayerName)?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-base sm:text-lg text-zinc-900`}>
              {topPlayerName || "Đang chờ..."}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm opacity-60 text-zinc-600`}>
                {topPlayerRole}
              </span>
            </div>
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-mono font-medium tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-zinc-100 border-zinc-200 text-zinc-900 ${isTopPlayerTurn && gamePhase === "playing" ? "bg-amber-100 border-amber-300 text-amber-900" : ""}`}>
          Điểm: {topPlayerScore}
        </div>
      </div>

      {/* Outer Wooden Board */}
      <div
        className={`relative w-full max-w-[1200px] aspect-[7/2] min-h-[160px] sm:min-h-[200px] md:min-h-[250px] lg:min-h-[300px] 
          rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.2),inset_0_5px_15px_rgba(255,255,255,0.4)] 
          bg-gradient-to-br from-[#e0b07c] via-[#c48d56] to-[#a36831] 
          border-[8px] sm:border-[12px] md:border-[16px] border-[#6b4226] p-2 sm:p-3 md:p-4
          ${gamePhase === "waiting" ? "opacity-70 grayscale-[0.2]" : "opacity-100"}
          transition-all duration-500`}
      >
        {/* Inner Board Area */}
        <div className="w-full h-full flex flex-row rounded-full border-[3px] sm:border-[4px] border-amber-950 bg-[#e8cdab] shadow-[inset_0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden">
          
          {/* Left Quan (1/7 width) */}
          <div
            onClick={() => handleCellClick(leftQuanIndex)}
            className="relative flex items-center justify-center w-[14.28%] border-r-[3px] sm:border-r-[4px] border-amber-950 bg-gradient-to-r from-black/5 to-transparent cursor-not-allowed"
          >
            <CellContent
              cell={board[leftQuanIndex]}
              isQuan={true}
              isDropping={dropIndex === leftQuanIndex}
              isCaptured={captureIndices.includes(leftQuanIndex)}
              onCellClick={() => handleCellClick(leftQuanIndex)}
            />
          </div>

          {/* Center Dan cells (5/7 width) */}
          <div className="flex flex-col w-[71.42%]">
            {/* Top Row */}
            <div className="flex flex-1">
              {topRowIndices.map((idx) => {
                const isHoverable =
                  gamePhase === "playing" &&
                  isMyTurn &&
                  !winner &&
                  !isAnimating &&
                  ((isPlayer1 && idx >= 0 && idx <= 4) || (isPlayer2 && idx >= 6 && idx <= 10)) &&
                  board[idx].stones > 0;

                return (
                  <div key={idx} className={getCellClass(idx) + " w-[20%]"}>
                    <CellContent
                      cell={board[idx]}
                      isDropping={dropIndex === idx}
                      isCaptured={captureIndices.includes(idx)}
                      isHoverable={isHoverable}
                      onDragDirection={(dir) => {
                        // Top row visually: Right is CW, Left is CCW
                        if (dir === "right") handleDirectionSelect("cw", idx);
                        if (dir === "left") handleDirectionSelect("ccw", idx);
                      }}
                      onCellClick={() => handleCellClick(idx)}
                    />
                    {selectedCell === idx && renderMoveButtons(idx)}
                  </div>
                );
              })}
            </div>

            {/* Bottom Row */}
            <div className="flex flex-1">
              {bottomRowIndices.map((idx) => {
                const isHoverable =
                  gamePhase === "playing" &&
                  isMyTurn &&
                  !winner &&
                  !isAnimating &&
                  ((isPlayer1 && idx >= 0 && idx <= 4) || (isPlayer2 && idx >= 6 && idx <= 10)) &&
                  board[idx].stones > 0;

                return (
                  <div key={idx} className={getCellClass(idx) + " w-[20%]"}>
                    <CellContent
                      cell={board[idx]}
                      isDropping={dropIndex === idx}
                      isCaptured={captureIndices.includes(idx)}
                      isHoverable={isHoverable}
                      onDragDirection={(dir) => {
                        // Bottom row visually: Right is CCW, Left is CW
                        if (dir === "right") handleDirectionSelect("ccw", idx);
                        if (dir === "left") handleDirectionSelect("cw", idx);
                      }}
                      onCellClick={() => handleCellClick(idx)}
                    />
                    {selectedCell === idx && renderMoveButtons(idx)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Quan (1/7 width) */}
          <div
            onClick={() => handleCellClick(rightQuanIndex)}
            className="relative flex items-center justify-center w-[14.28%] border-l-[3px] sm:border-l-[4px] border-amber-950 bg-gradient-to-l from-black/5 to-transparent cursor-not-allowed"
          >
            <CellContent
              cell={board[rightQuanIndex]}
              isQuan={true}
              isDropping={dropIndex === rightQuanIndex}
              isCaptured={captureIndices.includes(rightQuanIndex)}
              onCellClick={() => handleCellClick(rightQuanIndex)}
            />
          </div>

        </div>
      </div>
      
      {/* Wooden stand effect */}
      <div className="w-[80%] max-w-[900px] h-4 sm:h-6 md:h-8 bg-[#4a2e1b] rounded-b-[50%] blur-[2px] opacity-70 mt-[-5px] sm:mt-[-10px] -z-10"></div>

      {/* Bottom Player (Me) */}
      <div className={`flex w-full max-w-[1200px] justify-between items-start mt-4 sm:mt-8 transition-opacity ${gamePhase === "waiting" ? "opacity-50" : "opacity-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-md bg-zinc-800 text-white ${isBottomPlayerTurn && gamePhase === "playing" ? "ring-2 ring-blue-500 shadow-blue-500/50" : ""}`}>
            {(bottomPlayerName)?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-base sm:text-lg text-zinc-900`}>
              {bottomPlayerName || "Đang chờ..."}
              {playerName === bottomPlayerName && " (Bạn)"}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm opacity-60 text-zinc-600`}>
                {bottomPlayerRole}
              </span>
            </div>
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-mono font-medium tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border bg-zinc-100 border-zinc-200 text-zinc-900 ${isBottomPlayerTurn && gamePhase === "playing" ? "bg-amber-100 border-amber-300 text-amber-900" : ""}`}>
          Điểm: {bottomPlayerScore}
        </div>
      </div>
    </div>
  );
}
