import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, Shot, ActiveAnimation } from "../types";
import { BOARD_SIZE, ROWS, COLS } from "../constants";

type BoardProps = {
  title: string;
  ships: Ship[];
  shots: Shot[];
  onCellClick: (r: number, c: number) => void;
  hideShips: boolean;
  interactive: boolean;
  isMyBoardForPlacement?: boolean;
  gameStarted: boolean;
  activeAnimation?: ActiveAnimation | null;
  onShipClick?: (id: number) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, r: number, c: number) => void;
  draggedShipRef?: React.MutableRefObject<{
    id: number;
    segment: number;
  } | null>;
};

export const Board: React.FC<BoardProps> = ({
  title,
  ships,
  shots,
  onCellClick,
  hideShips,
  interactive,
  isMyBoardForPlacement = false,
  gameStarted,
  activeAnimation,
  onShipClick,
  onDrop,
  draggedShipRef,
}) => {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-zinc-800 mb-4">{title}</h3>
      <div className="relative pl-6 pb-6">
        <div className="absolute top-0 bottom-6 left-0 flex w-6 flex-col text-sm font-bold text-zinc-500 select-none">
          {ROWS.map((n) => (
            <div key={n} className="flex flex-1 items-center justify-center">
              {n}
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-6 right-0 flex h-6 text-sm font-bold text-zinc-500 select-none">
          {COLS.map((l) => (
            <div key={l} className="flex flex-1 items-center justify-center">
              {l}
            </div>
          ))}
        </div>

        <div
          className={`relative grid grid-cols-10 grid-rows-10 w-[95vw] sm:w-[90vw] md:w-[50vh] md:max-w-[504px] aspect-square border-2 border-zinc-800 bg-[#E3F2FD] ${interactive ? "" : "pointer-events-none"}`}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const r = Math.floor(i / BOARD_SIZE);
            const c = i % BOARD_SIZE;
            const isAnimatingHere =
              interactive &&
              activeAnimation &&
              activeAnimation.r === r &&
              activeAnimation.c === c;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                onDragOver={(e) => {
                  if (isMyBoardForPlacement && !gameStarted) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  if (isMyBoardForPlacement && !gameStarted && onDrop) {
                    onDrop(e, r, c);
                  }
                }}
                className="border border-blue-200 relative flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <AnimatePresence>
                  {isAnimatingHere && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                      {activeAnimation.stage === "falling" && (
                        <motion.div
                          key="falling"
                          initial={{
                            y: -100,
                            opacity: 0,
                            scale: 1.5,
                            rotate: 15,
                          }}
                          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.35, ease: "easeIn" }}
                          className="text-2xl md:text-3xl drop-shadow-lg"
                        >
                          💣
                        </motion.div>
                      )}
                      {activeAnimation.stage === "exploding" &&
                        activeAnimation.result === "hit" && (
                          <motion.div
                            key="exploding-hit"
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-3xl md:text-4xl absolute drop-shadow-xl"
                          >
                            💥
                          </motion.div>
                        )}
                      {activeAnimation.stage === "exploding" &&
                        activeAnimation.result === "miss" && (
                          <motion.div
                            key="exploding-miss"
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-3xl md:text-4xl absolute drop-shadow-md"
                          >
                            💦
                          </motion.div>
                        )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {ships.map((ship) => {
            if (ship.positions.length === 0) return null;

            const isSunk =
              gameStarted &&
              ship.positions.every((p) =>
                shots.some(
                  (s) => s.r === p[0] && s.c === p[1] && s.result === "hit",
                ),
              );

            if (hideShips && !isSunk) return null;

            const startR = ship.positions[0][0];
            const startC = ship.positions[0][1];

            const size = ship.size || ship.positions.length;
            let isH = ship.orientation === "H";
            if (ship.positions.length > 1) {
              isH = ship.positions[0][0] === ship.positions[1][0];
            }

            const topPos = (startR * 100) / BOARD_SIZE;
            const leftPos = (startC * 100) / BOARD_SIZE;
            const widthPos = isH ? (size * 100) / BOARD_SIZE : 100 / BOARD_SIZE;
            const heightPos = isH
              ? 100 / BOARD_SIZE
              : (size * 100) / BOARD_SIZE;

            const shipClasses = [
              "absolute",
              isSunk ? "brightness-75" : "",
              ship.color || "bg-zinc-600",
              "rounded-sm",
              isMyBoardForPlacement && !gameStarted
                ? "cursor-grab active:cursor-grabbing hover:brightness-110 shadow-md z-20"
                : "pointer-events-none z-10",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={ship.id}
                draggable={isMyBoardForPlacement && !gameStarted}
                onDragStart={(e) => {
                  if (isMyBoardForPlacement && !gameStarted && e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                  }
                }}
                onClick={(e) => {
                  if (isMyBoardForPlacement && !gameStarted && onShipClick) {
                    e.stopPropagation();
                    onShipClick(ship.id);
                  }
                }}
                className={shipClasses}
                style={{
                  top: `${topPos}%`,
                  left: `${leftPos}%`,
                  width: `${widthPos}%`,
                  height: `${heightPos}%`,
                  padding: "2px",
                }}
              >
                <div
                  className={`flex ${isH ? "flex-row" : "flex-col"} w-full h-full`}
                >
                  {Array.from({ length: size || 0 }).map((_, idx) => (
                    <div
                      key={`segment-${ship.id}-${idx}`}
                      className="flex-1 border border-white/20"
                      onMouseDown={() => {
                        if (
                          isMyBoardForPlacement &&
                          !gameStarted &&
                          draggedShipRef
                        ) {
                          draggedShipRef.current = {
                            id: ship.id,
                            segment: idx,
                          };
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {shots.map((shot, idx) => {
            const topPos = (shot.r * 100) / BOARD_SIZE;
            const leftPos = (shot.c * 100) / BOARD_SIZE;
            const cellSpan = 100 / BOARD_SIZE;

            const isSunkCell = ships.some(
              (ship) =>
                ship.positions.length > 0 &&
                ship.positions.some(
                  (p) => p[0] === shot.r && p[1] === shot.c,
                ) &&
                ship.positions.every((p) =>
                  shots.some(
                    (s) => s.r === p[0] && s.c === p[1] && s.result === "hit",
                  ),
                ),
            );

            return (
              <div
                key={`shot-${idx}`}
                className="absolute z-30 pointer-events-none flex items-center justify-center"
                style={{
                  top: `${topPos}%`,
                  left: `${leftPos}%`,
                  width: `${cellSpan}%`,
                  height: `${cellSpan}%`,
                }}
              >
                {shot.result === "hit" ? (
                  <div
                    className={`flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 shadow-md ${!isSunkCell ? "animate-pulse" : ""}`}
                  >
                    {isSunkCell && (
                      <span className="text-white font-bold text-xs md:text-sm leading-none pointer-events-none select-none">
                        X
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-zinc-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
