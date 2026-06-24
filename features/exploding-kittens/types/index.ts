export type CardType =
  | "exploding-kitten"
  | "defuse"
  | "nope"
  | "attack"
  | "skip"
  | "favor"
  | "shuffle"
  | "see-the-future"
  | "tacocat"
  | "cattermelon"
  | "hairy-potato-cat"
  | "beard-cat"
  | "rainbow-ralphing-cat"
  | "imploding-kitten"
  | "reverse"
  | "draw-from-bottom"
  | "feral-cat"
  | "alter-the-future"
  | "targeted-attack";

// This interface is for the static definitions
export interface CardDefinition {
  name: string;
  description: string;
  imageUrls: string[];
}

// This interface will be used for card instances in the game state
export interface CardInstance {
  id: string; // A unique ID for each card instance, e.g., using uuid
  type: CardType;
  variantIndex?: number; // Thêm index để chọn hình ảnh
  isFaceUp?: boolean; // Dành cho lá Imploding Kitten
}
