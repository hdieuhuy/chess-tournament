export type Ship = {
  id: number;
  positions: [number, number][];
  size?: number;
  color?: string;
  orientation?: "H" | "V";
};

export type Shot = { r: number; c: number; result: "hit" | "miss" };

export type ActiveAnimation = {
  r: number;
  c: number;
  result: "hit" | "miss";
  stage: "falling" | "exploding";
};
