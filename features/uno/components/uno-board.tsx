import React from "react";
import { useUno } from "../contexts/uno-context";
import { getCardColorClass } from "../utils/game-logic";
import { motion, AnimatePresence } from "framer-motion";
import { UnoCardComponent } from "./uno-card";
import { Modal } from "@/components/Modal";
import { CardColor } from "../types";

export function UnoBoard() {
  const {
    playerName,
    players,
    gameStarted,
    deck,
    discardPile,
    hands,
    currentTurnIndex,
    direction,
    activeColor,
    winner,
    hasDrawn,
    drawStack,
    stackPending,
    stackEndTime,
    handleResolveStack,
    drawCard,
    playCard,
    passTurn,
    showColorPicker,
    setShowColorPicker,
    pendingCard,
    setPendingCard,
    handleColorSelect,
  } = useUno();

  const [stackTimeLeft, setStackTimeLeft] = React.useState(0);

  React.useEffect(() => {
    if (!stackPending || !stackEndTime) {
      setStackTimeLeft(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = stackEndTime - Date.now();
      setStackTimeLeft(Math.max(0, remaining));
    }, 50);
    return () => clearInterval(interval);
  }, [stackPending, stackEndTime]);



  const getNextTurnIndex = (
    currentIndex: number,
    currentDirection: number,
    step = 1,
  ) => {
    const numPlayers = players.length;
    let nextIndex = (currentIndex + currentDirection * step) % numPlayers;
    if (nextIndex < 0) nextIndex += numPlayers;
    return nextIndex;
  };

  const renderOpponent = (pName: string | null, pos: "top" | "left" | "right") => {
    if (!pName) return null;
    const handCount = hands[pName]?.length || 0;
    const isTurn = players[currentTurnIndex] === pName;

    let posClass = "";
    let cardStackClass = "";
    let cardClass = "";

    if (pos === "top") {
      posClass = "absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none";
      cardStackClass = "flex -space-x-4 sm:-space-x-6 mt-2";
      cardClass = "w-10 h-14 sm:w-12 sm:h-16 rounded-md border-2 border-white bg-zinc-800 shadow-md";
    } else if (pos === "left") {
      posClass = "absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none transform -rotate-90";
      cardStackClass = "flex -space-x-4 sm:-space-x-6 mt-2";
      cardClass = "w-10 h-14 sm:w-12 sm:h-16 rounded-md border-2 border-white bg-zinc-800 shadow-md";
    } else if (pos === "right") {
      posClass = "absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none transform rotate-90";
      cardStackClass = "flex -space-x-4 sm:-space-x-6 mt-2";
      cardClass = "w-10 h-14 sm:w-12 sm:h-16 rounded-md border-2 border-white bg-zinc-800 shadow-md";
    }

    return (
      <div className={posClass}>
        {handCount > 0 && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${isTurn ? "bg-white text-zinc-900 shadow-lg scale-110" : "bg-black/50 text-white"}`}>
            {pName} {handCount === 1 && <span className="text-red-500 ml-1">UNO!</span>}
          </div>
        )}
        <div className={cardStackClass}>
          {Array.from({ length: Math.min(handCount, 15) }).map((_, i) => (
            <div key={i} className={cardClass} />
          ))}
          {handCount > 15 && (
            <div className={`flex items-center justify-center text-white text-[10px] font-bold ${cardClass}`}>
              +{handCount - 15}
            </div>
          )}
        </div>
      </div>
    );
  };

  const baseIdx = players.includes(playerName) ? players.indexOf(playerName) : 0;
  let topP: string | null = null, leftP: string | null = null, rightP: string | null = null;

  if (players.length === 2) {
    topP = players[(baseIdx + 1) % 2];
  } else if (players.length === 3) {
    leftP = players[(baseIdx + 1) % 3];
    topP = players[(baseIdx + 2) % 3];
  } else if (players.length === 4) {
    leftP = players[(baseIdx + 1) % 4];
    topP = players[(baseIdx + 2) % 4];
    rightP = players[(baseIdx + 3) % 4];
  }

  const isMyTurn = players[currentTurnIndex] === playerName;
  const myHand = hands[playerName] || [];

  return (
    <div className={`flex w-full h-full flex-col items-center justify-between py-2 sm:py-4 transition-opacity duration-300 ${!gameStarted ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <Modal isOpen={showColorPicker} title="Chọn màu cho lượt tiếp theo">
        <div className="flex justify-around py-4">
          {["red", "blue", "green", "yellow"].map((c) => (
            <button
              key={c}
              onClick={() => handleColorSelect(c as CardColor)}
              className={`w-16 h-16 rounded-full border-4 border-white shadow-lg transform transition-transform hover:scale-110 ${getCardColorClass(c as CardColor).split(" ")[0]}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => {
              setShowColorPicker(false);
              setPendingCard(null);
            }}
            className="cursor-pointer rounded-lg bg-zinc-200 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300"
          >
            Hủy đánh lá này
          </button>
        </div>
      </Modal>

      {/* The Board */}
      <div className="relative flex flex-1 w-full max-w-[1000px] min-h-0 items-center justify-center rounded-[2rem] sm:rounded-[3rem] border-4 sm:border-8 border-amber-800 bg-emerald-700 shadow-2xl overflow-hidden my-2 sm:my-4">
        {/* Direction Indicator */}
        {!winner && (
          <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-2xl font-bold text-white">
            {direction === 1 ? "↻" : "↺"}
          </div>
        )}

        {/* Color Indicator */}
        {activeColor && (
          <div className="absolute left-6 top-6 flex flex-col items-center">
            <span className="mb-1 text-[10px] font-bold tracking-widest text-white opacity-70">
              MÀU HIỆN TẠI
            </span>
            <div
              className={`h-8 w-8 rounded-full border-2 border-white shadow-md ${getCardColorClass(activeColor).split(" ")[0]}`}
            />
          </div>
        )}

        {stackPending && (
          <div className="absolute bottom-6 left-6 flex flex-col items-start bg-black/60 px-5 py-3 rounded-2xl backdrop-blur-sm z-50 shadow-2xl border border-white/20">
            <span className="text-white font-black text-lg sm:text-xl mb-1 drop-shadow-md text-left">
              ĐANG BỊ PHẠT +{drawStack} LÁ!
            </span>
            <span className="text-zinc-300 font-medium text-[10px] sm:text-xs mb-2">Đánh lá phạt tương ứng để cộng dồn!</span>
            <div className="w-full h-2 sm:h-3 bg-zinc-700/80 rounded-full overflow-hidden mt-1 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-75"
                style={{ width: `${(stackTimeLeft / 5000) * 100}%` }}
              />
            </div>
            <span className="text-white font-bold text-xs sm:text-sm mt-1">{(stackTimeLeft / 1000).toFixed(1)}s</span>
          </div>
        )}

        {renderOpponent(topP, "top")}
        {renderOpponent(leftP, "left")}
        {renderOpponent(rightP, "right")}

        {/* Center */}
        <div className="flex space-x-6 sm:space-x-12">
          {/* Deck */}
          <motion.div
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={drawCard}
            className={`flex h-32 w-24 sm:h-40 sm:w-28 items-center justify-center rounded-xl border-4 border-white bg-zinc-900 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-10 ${isMyTurn && !winner && !hasDrawn ? "cursor-pointer" : "opacity-90 cursor-not-allowed"}`}
          >
            <span className="rotate-45 text-xl sm:text-2xl font-black tracking-wider text-red-500 drop-shadow-md">
              UNO
            </span>
          </motion.div>

          {/* Discard Pile */}
          <div className="rotate-3 relative h-32 w-24 sm:h-40 sm:w-28">
            <AnimatePresence>
              {discardPile.length > 0 ? (
                <div
                  key={discardPile[discardPile.length - 1].id}
                  className="absolute inset-0"
                >
                  <UnoCardComponent
                    card={discardPile[discardPile.length - 1]}
                    initial={{ scale: 1.5, opacity: 0, y: -100, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  />
                </div>
              ) : (
                <div
                  key="empty"
                  className="absolute inset-0 rounded-xl bg-zinc-200/20"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Player Hand */}
      <div className="relative flex w-full flex-col items-center justify-end z-20 shrink-0">
        <div className="flex items-center justify-between w-full max-w-4xl px-4 mb-4 h-12">
          {myHand.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-left">
                {myHand.length === 1 && (
                  <span className="text-lg font-black text-red-500 animate-bounce">
                    UNO!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}
          {isMyTurn && stackPending && !winner && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleResolveStack}
              className="cursor-pointer rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Chịu phạt rút {drawStack} lá
            </motion.button>
          )}
          {isMyTurn && hasDrawn && !winner && !stackPending && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={passTurn}
              className="cursor-pointer rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
            >
              Bỏ lượt
            </motion.button>
          )}
        </div>

        <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center items-center -space-x-8 sm:-space-x-10 pt-10 pb-6 px-10 rounded-3xl bg-zinc-100/80 backdrop-blur-md shadow-inner border border-zinc-200 w-full max-w-5xl no-scrollbar relative min-h-[160px] sm:min-h-[180px]">
          <AnimatePresence>
            {myHand.map((card) => {
              const topCard = discardPile[discardPile.length - 1];
              let isPlayable = false;
              if (stackPending && isMyTurn && !winner) {
                if (topCard?.value === "draw2") {
                  isPlayable = card.value === "draw2" || card.value === "wild_draw4";
                } else if (topCard?.value === "wild_draw4") {
                  isPlayable = card.value === "wild_draw4";
                }
              } else {
                isPlayable = isMyTurn && !winner && (!hasDrawn || card.color === "black" || card.color === activeColor || card.value === topCard?.value);
              }

              return (
                <UnoCardComponent
                  key={card.id}
                  card={card}
                  isPlayable={isPlayable}
                  onClick={() => playCard(card)}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                />
              );
            })}
          </AnimatePresence>
          {myHand.length === 0 && (
            <div className="text-zinc-400 font-medium italic h-28 sm:h-36 flex items-center">
              Chưa có bài
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
