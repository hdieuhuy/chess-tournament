import Image from "next/image";
import type { CardDefinition } from "./constants";

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
      >
        <Image
          src="https://explodi.ng/assets/decks/exploding-kittens-original-edition.png"
          alt="Mặt sau lá bài"
          fill
          style={{ objectFit: "contain" }}
          className="p-2"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[2.5/3.5] w-32 cursor-pointer overflow-hidden rounded-lg shadow-lg transition-transform hover:-translate-y-4 ${className}`}
      onClick={onClick}
      title={`${card.name}\n${card.description}`}
    >
      <Image
        src={card.imageUrls[variantIndex] || card.imageUrls[0]}
        alt={card.name}
        fill
        style={{ objectFit: "cover" }}
        unoptimized // Since the images are from an external URL
      />
    </div>
  );
}
