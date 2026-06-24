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
