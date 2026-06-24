import { UnoCard, CardColor, CardValue } from "../types";

export const UNO_COLORS: CardColor[] = ["red", "yellow", "green", "blue"];
export const ACTION_VALUES: CardValue[] = ["skip", "reverse", "draw2"];

export const generateId = () => Math.random().toString(36).substring(2, 10);

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * Hàm khởi tạo 108 lá bài Uno tiêu chuẩn
 */
export function generateUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let idCounter = 1;

  // Tạo bài cho 4 màu cơ bản
  for (const color of UNO_COLORS) {
    // Mỗi màu có 1 lá số 0
    deck.push({ id: `card_${idCounter++}`, color, value: "0" });

    // Mỗi màu có 2 lá từ 1-9 và 2 lá mỗi loại hành động (Skip, Reverse, +2)
    for (let i = 0; i < 2; i++) {
      for (let num = 1; num <= 9; num++)
        deck.push({
          id: `card_${idCounter++}`,
          color,
          value: num.toString() as CardValue,
        });
      for (const action of ACTION_VALUES)
        deck.push({ id: `card_${idCounter++}`, color, value: action });
    }
  }

  // Tạo 4 lá Wild và 4 lá Wild Draw 4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${idCounter++}`, color: "black", value: "wild" });
    deck.push({
      id: `card_${idCounter++}`,
      color: "black",
      value: "wild_draw4",
    });
  }

  return deck;
}

export const getCardColorClass = (color: CardColor) => {
  switch (color) {
    case "red":
      return "bg-red-500 border-white text-white";
    case "blue":
      return "bg-blue-500 border-white text-white";
    case "green":
      return "bg-green-500 border-white text-white";
    case "yellow":
      return "bg-yellow-500 border-white text-white";
    case "black":
      return "bg-zinc-900 border-white text-white";
    default:
      return "bg-zinc-500 border-white text-white";
  }
};

export const getCardTextColor = (color: CardColor) => {
  switch (color) {
    case "red":
      return "text-red-500";
    case "blue":
      return "text-blue-500";
    case "green":
      return "text-green-500";
    case "yellow":
      return "text-yellow-500";
    case "black":
      return "text-zinc-900";
    default:
      return "text-zinc-500";
  }
};
