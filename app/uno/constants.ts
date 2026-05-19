export type CardColor = "red" | "yellow" | "green" | "blue" | "black";

export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild_draw4";

export interface UnoCard {
  id: string; // ID duy nhất để React render key dễ dàng
  color: CardColor;
  value: CardValue;
}

export const UNO_COLORS: CardColor[] = ["red", "yellow", "green", "blue"];
export const ACTION_VALUES: CardValue[] = ["skip", "reverse", "draw2"];

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
