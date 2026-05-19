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
  | "rainbow-ralphing-cat";

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
}

export const CARD_DEFINITIONS: Record<CardType, CardDefinition> = {
  "exploding-kitten": {
    name: "Mèo Nổ",
    description:
      "Bạn sẽ bị loại khỏi trò chơi nếu rút phải lá này mà không có lá Defuse.",
    imageUrls: [
      "https://explodi.ng/assets/cards/exploding-kitten.png",
      "URL_HINH_MEO_NO_2",
      "URL_HINH_MEO_NO_3",
      "URL_HINH_MEO_NO_4",
      "URL_HINH_MEO_NO_5",
    ],
  },
  defuse: {
    name: "Defuse (Gỡ bom)",
    description:
      "Vô hiệu hóa một lá Mèo Nổ. Sau đó, bạn có thể đặt lại lá Mèo Nổ vào chồng bài rút ở bất kỳ vị trí nào bạn muốn.",
    imageUrls: [
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Spay-Neuter.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Porkback-Riding-into-the-Sunset-Together.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Laser-Tag.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Laser-Pointer.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Crate.jpg",
    ],
  },
  nope: {
    name: "Nope (Không)",
    description:
      "Hủy bỏ hành động của người chơi khác. Không thể dùng để hủy lá Mèo Nổ hoặc Defuse. Một lá Nope có thể bị hủy bởi một lá Nope khác.",
    imageUrls: [
      "https://explodi.ng/assets/cards/nope.png",
      "URL_HINH_NOPE_2",
      "URL_HINH_NOPE_3",
      "URL_HINH_NOPE_4",
      "URL_HINH_NOPE_5",
    ],
  },
  attack: {
    name: "Attack (Tấn công)",
    description:
      "Kết thúc lượt của bạn mà không cần rút bài và buộc người chơi tiếp theo phải chơi 2 lượt liên tiếp.",
    imageUrls: [
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Thousand-Year-Back-Hair.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Grow-a-Magnifient-Squid-Arm-and-Start-Slapping-Fat-Babies.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Rubber-Duck-Collection.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Torture-Bunnies.jpg",
    ],
  },
  skip: {
    name: "Skip (Bỏ lượt)",
    description:
      "Kết thúc lượt của bạn mà không cần rút bài. Nếu bạn đang bị Attack, lá này sẽ hủy 1 lượt.",
    imageUrls: [
      "https://explodi.ng/assets/cards/skip.png",
      "URL_HINH_SKIP_2",
      "URL_HINH_SKIP_3",
      "URL_HINH_SKIP_4",
    ],
  },
  favor: {
    name: "Favor (Xin bài)",
    description:
      "Buộc một người chơi khác phải đưa cho bạn một lá bài trên tay của họ. Họ được quyền chọn lá bài để đưa.",
    imageUrls: [
      "https://explodi.ng/assets/cards/favor.png",
      "URL_HINH_FAVOR_2",
      "URL_HINH_FAVOR_3",
      "URL_HINH_FAVOR_4",
    ],
  },
  shuffle: {
    name: "Shuffle (Xáo bài)",
    description: "Xáo trộn chồng bài rút.",
    imageUrls: [
      "https://explodi.ng/assets/cards/shuffle.png",
      "URL_HINH_SHUFFLE_2",
      "URL_HINH_SHUFFLE_3",
      "URL_HINH_SHUFFLE_4",
    ],
  },
  "see-the-future": {
    name: "See the Future (Xem trước)",
    description: "Xem trước 3 lá bài trên cùng của chồng bài rút.",
    imageUrls: [
      "https://explodi.ng/assets/cards/see-the-future.png",
      "URL_HINH_SEE_THE_FUTURE_2",
      "URL_HINH_SEE_THE_FUTURE_3",
      "URL_HINH_SEE_THE_FUTURE_4",
      "URL_HINH_SEE_THE_FUTURE_5",
    ],
  },
  tacocat: {
    name: "Tacocat",
    description: "Một con mèo palindrome.",
    imageUrls: [
      "https://explodi.ng/assets/cards/tacocat.png",
      "URL_HINH_TACOCAT_2",
      "URL_HINH_TACOCAT_3",
      "URL_HINH_TACOCAT_4",
    ],
  },
  cattermelon: {
    name: "Cattermelon",
    description: "Vì sao không?",
    imageUrls: [
      "https://explodi.ng/assets/cards/cattermelon.png",
      "URL_HINH_CATTERMELON_2",
      "URL_HINH_CATTERMELON_3",
      "URL_HINH_CATTERMELON_4",
    ],
  },
  "hairy-potato-cat": {
    name: "Hairy Potato Cat",
    description: "Khoai tây mọc lông.",
    imageUrls: [
      "https://explodi.ng/assets/cards/hairy-potato-cat.png",
      "URL_HINH_HAIRY_POTATO_CAT_2",
      "URL_HINH_HAIRY_POTATO_CAT_3",
      "URL_HINH_HAIRY_POTATO_CAT_4",
    ],
  },
  "beard-cat": {
    name: "Beard Cat",
    description: "Một con mèo có bộ râu oai vệ.",
    imageUrls: [
      "https://explodi.ng/assets/cards/beard-cat.png",
      "URL_HINH_BEARD_CAT_2",
      "URL_HINH_BEARD_CAT_3",
      "URL_HINH_BEARD_CAT_4",
    ],
  },
  "rainbow-ralphing-cat": {
    name: "Rainbow-Ralphing Cat",
    description: "Mèo ói ra cầu vồng.",
    imageUrls: [
      "https://explodi.ng/assets/cards/rainbow-ralphing-cat.png",
      "URL_HINH_RAINBOW_CAT_2",
      "URL_HINH_RAINBOW_CAT_3",
      "URL_HINH_RAINBOW_CAT_4",
    ],
  },
};
