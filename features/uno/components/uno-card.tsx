import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { UnoCard as UnoCardType } from "../types";
import { getCardColorClass, getCardTextColor } from "../utils/game-logic";

interface UnoCardProps extends Omit<HTMLMotionProps<"div">, "onClick"> {
  card: UnoCardType;
  onClick?: () => void;
  isPlayable?: boolean;
}

export const UnoCardComponent: React.FC<UnoCardProps> = ({ card, onClick, isPlayable, ...motionProps }) => {
  const colorClass = getCardColorClass(card.color);
  const value = card.value;

  let content;

  if (!isNaN(Number(value))) {
    content = (
      <div
        className={`flex h-16 w-12 sm:h-20 sm:w-14 items-center justify-center rounded-[1.5rem] bg-white transform -rotate-12 shadow-inner`}
      >
        <span
          className={`text-2xl sm:text-3xl font-black drop-shadow-sm ${getCardTextColor(card.color)}`}
        >
          {value}
        </span>
      </div>
    );
  } else if (value === "skip") {
    content = (
      <div
        className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
      >
        <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <div className="absolute inset-0 rounded-full border-4 sm:border-[6px] border-current opacity-90"></div>
          <div className="absolute inset-0 transform rotate-45">
            <div className="absolute top-1/2 left-1 sm:left-1.5 right-1 sm:right-1.5 h-1 sm:h-1.5 bg-current -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    );
  } else if (value === "reverse") {
    content = (
      <div
        className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
      >
        <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
        <svg
          className="relative w-10 h-10 sm:w-12 sm:h-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 2.1l4 4-4 4" />
          <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
          <path d="M7 21.9l-4-4 4-4" />
          <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
        </svg>
      </div>
    );
  } else if (value === "draw2") {
    content = (
      <div
        className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
      >
        <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
          <div className="absolute w-6 h-9 sm:w-7 sm:h-10 rounded-sm sm:rounded-md bg-white shadow-md transform -rotate-12 border-2 border-current opacity-90"></div>
          <div className="absolute w-6 h-9 sm:w-7 sm:h-10 rounded-sm sm:rounded-md bg-white shadow-lg transform rotate-12 border-2 border-current"></div>
          <span className="relative text-xl sm:text-2xl font-black text-current drop-shadow-lg">
            +2
          </span>
        </div>
      </div>
    );
  } else if (value === "wild") {
    content = (
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500 rounded-tl-full"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tr-full"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500 rounded-bl-full"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-500 rounded-br-full"></div>
        <div className="absolute inset-2 bg-zinc-900 rounded-full flex items-center justify-center text-white font-black text-lg sm:text-xl tracking-wider">
          UNO
        </div>
      </div>
    );
  } else if (value === "wild_draw4") {
    content = (
      <div className="relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500 rounded-tl-full"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tr-full"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500 rounded-bl-full"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-500 rounded-br-full"></div>
        <span className="relative text-4xl sm:text-5xl font-black text-white drop-shadow-md">
          +4
        </span>
      </div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      onClick={isPlayable ? onClick : undefined}
      className={`relative flex h-28 w-20 sm:h-36 sm:w-24 shrink-0 flex-col items-center justify-center rounded-xl border-4 ${colorClass} shadow-xl ${isPlayable !== undefined ? (isPlayable ? "cursor-pointer hover:z-10 hover:-translate-y-6 hover:shadow-2xl transition-transform duration-200" : "opacity-70 transition-opacity duration-200") : ""}`}
      {...motionProps}
    >
      {content}
    </motion.div>
  );
};
