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
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-C4.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Nuclear-Bombs.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-House-Grenade.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Science.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Playground.jpg",
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
      "https://explodi.ng/images/cards/nope/artworks/Nope-The-Pope-of-Nope-has-Spoken.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Awaken-the-Narnope.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Deliver-some-Nope-on-Your-Jump-Rope.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-A-Jackanope-Bounds-into-the-Room.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Nopestradamus-Speaks-the-Truth.jpg",
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
      "https://explodi.ng/images/cards/skip/artworks/Skip-Commandeer-a-Bunnyraptor.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Crab-Walk-with-Some-Crabs.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Don-a-Portable-Cheetah-Butt.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Engage-the-Hypergoat.jpg",
    ],
  },
  favor: {
    name: "Favor (Xin bài)",
    description:
      "Buộc một người chơi khác phải đưa cho bạn một lá bài trên tay của họ. Họ được quyền chọn lá bài để đưa.",
    imageUrls: [
      "https://explodi.ng/images/cards/favor/artworks/Favor-Fall-So-Deeply-in-Love.jpg",
      "https://explodi.ng/images/cards/favor/artworks/Favor-Get-Enslaved-by-Party-Squirrels.jpg",
      "https://explodi.ng/images/cards/favor/artworks/Favor-Rub-Peanut-Butter-on-Your-Belly-Button.jpg",
      "https://explodi.ng/images/cards/favor/artworks/Favor-Teach-Someone-a-New-Palindrome.jpg",
    ],
  },
  shuffle: {
    name: "Shuffle (Xáo bài)",
    description: "Xáo trộn chồng bài rút.",
    imageUrls: [
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-A-Kraken-Emerges-and-Hes-Super-Upset.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-A-Plague-of-Bat-Farts.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-An-Electromagnetic-Pomeranian-Storm.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-A-Transdimensional-Litter-Box-Materializes.jpg",
    ],
  },
  "see-the-future": {
    name: "See the Future (Xem trước)",
    description: "Xem trước 3 lá bài trên cùng của chồng bài rút.",
    imageUrls: [
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Attach-a-Butterfly-to-Your-Genitals.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Crawl-Inside-a-Goat-Butt.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Deploy-the-Special-Ops-Bunnies.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Discover-a-Boob-Wizard.jpg",
    ],
  },
  tacocat: {
    name: "Tacocat",
    description: "Một con mèo palindrome.",
    imageUrls: [
      "https://explodi.ng/images/cards/cat-card/artworks/Tacocat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Tacocat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Tacocat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Tacocat.jpg",
    ],
  },
  cattermelon: {
    name: "Cattermelon",
    description: "Vì sao không?",
    imageUrls: [
      "https://explodi.ng/images/cards/cat-card/artworks/Cattermelon.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Cattermelon.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Cattermelon.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Cattermelon.jpg",
    ],
  },
  "hairy-potato-cat": {
    name: "Hairy Potato Cat",
    description: "Khoai tây mọc lông.",
    imageUrls: [
      "https://explodi.ng/images/cards/cat-card/artworks/Hairy-Potato-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Hairy-Potato-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Hairy-Potato-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Hairy-Potato-Cat.jpg",
    ],
  },
  "beard-cat": {
    name: "Beard Cat",
    description: "Một con mèo có bộ râu oai vệ.",
    imageUrls: [
      "https://explodi.ng/images/cards/cat-card/artworks/Beard-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Beard-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Beard-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Beard-Cat.jpg",
    ],
  },
  "rainbow-ralphing-cat": {
    name: "Rainbow-Ralphing Cat",
    description: "Mèo ói ra cầu vồng.",
    imageUrls: [
      "https://explodi.ng/images/cards/cat-card/artworks/Rainbow-Ralphing-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Rainbow-Ralphing-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Rainbow-Ralphing-Cat.jpg",
      "https://explodi.ng/images/cards/cat-card/artworks/Rainbow-Ralphing-Cat.jpg",
    ],
  },
};
