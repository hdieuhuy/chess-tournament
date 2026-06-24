import Image from "next/image";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { CardInstance, CardDefinition } from "../types";
import { CARD_DEFINITIONS } from "../constants";

interface CardProps {
  card: CardDefinition;
  variantIndex?: number;
  onClick?: () => void;
  className?: string;
  isFaceDown?: boolean;
}

export function Card({
  card,
  variantIndex = 0,
  onClick,
  className,
  isFaceDown = false,
}: CardProps) {
  if (isFaceDown) {
    return (
      <div
        className={`relative aspect-[2.5/3.5] w-32 cursor-pointer overflow-hidden rounded-lg border-4 border-red-900 bg-red-700 shadow-lg ${className}`}
        onClick={onClick}
        onDragStart={(e) => e.preventDefault()}
      >
        <Image
          src="https://cdn.tgdd.vn/GameApp/2/235774/Screentshots/exploding-kittens-bai-meo-no-235774-logo-28-02-2021.png"
          alt="Mặt sau lá bài"
          fill
          style={{ objectFit: "contain" }}
          className="p-2"
          unoptimized
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative aspect-[2.5/3.5] w-32 cursor-pointer rounded-lg shadow-lg transition-transform hover:-translate-y-4 ${className}`}
      onClick={onClick}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Image
          src={card.imageUrls[variantIndex] || card.imageUrls[0]}
          alt={card.name}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
          draggable={false}
        />
      </div>

      {/* Tooltip Description */}
      <div className="pointer-events-none absolute bottom-[105%] left-1/2 z-[100] w-48 -translate-x-1/2 rounded-lg bg-zinc-900/95 px-3 py-2 text-center text-xs text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <span className="block font-bold text-red-400 mb-1">{card.name}</span>
        {card.description}
      </div>
    </div>
  );
}
