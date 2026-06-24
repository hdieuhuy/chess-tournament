import { CardType, CardDefinition } from "../types";

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
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Alien.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Car-Off-Cliff.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Playground.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-Warp-Core.jpg",
      "https://explodi.ng/images/cards/exploding-kitten/artworks/Exploding-Kitten-TNT-Ship.jpg",
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
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-3AM-Flatulence.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Catnip-Sandwiches.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Catnip-Sweater.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Excessive-Ball-Cleaning.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Flattering-LARP.jpg",
      "https://explodi.ng/images/cards/defuse/artworks/Defuse-Via-Kitten-Therapy.jpg",
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
      "https://explodi.ng/images/cards/nope/artworks/Nope-Feed-your-Apponent-Some-Cantanope.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Feed-your-Opponent-a-Nope-Sandwich.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Put-on-Your-Necktie-of-Nope.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-The-Pope-of-Nope-has-Spoken.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-Win-the-Nopebell-Peace-Prize.jpg",
      "https://explodi.ng/images/cards/nope/artworks/Nope-a-Nope-Ninja.jpg",
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
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Bear-o-Dactyl.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Catterwocky.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Crab-a-Pult.jpg",
      "https://explodi.ng/images/cards/attack-2x/artworks/Attack-Penguin-Diarrhea.jpg",
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
      "https://explodi.ng/images/cards/skip/artworks/Skip-Evade-Dirty-Sasquatch-Underpants.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Go-Base-Jumping-Using-a-Pair-of-Old-Lady-Boobs.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Play-a-Game-of-Whale-Boner-Tetherball.jpg",
      "https://explodi.ng/images/cards/skip/artworks/Skip-Sail-Away-on-Your-Penis-Balloon.jpg",
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
      "https://explodi.ng/images/cards/favor/artworks/Favor-Take-Your-Friends-Beard-Sailing.jpg",
      "https://explodi.ng/images/cards/favor/artworks/Favour-Give-A-Horsey-Ride-To-A-Horse.jpg",
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
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-An-Asparagus-Bun-Dragon-Appears.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-Abracrab-Lincoln.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-Discover-You-Have-a-Toilet-Werewolf.jpg",
      "https://explodi.ng/images/cards/shuffle/artworks/Shuffle-Smoke-Some-Crack-with-a-Baby-Owl.jpg",
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
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Drink-an-Entire-Bottle-of-Bald-Eagle-Tears.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Fear-Upon-a-Unicorn-Enchilada.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Rub-the-Belly-of-a-Pig-a-Corn.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Summon-the-Mantis-Shrimp.jpg",
      "https://explodi.ng/images/cards/see-the-future-3x/artworks/See-the-Future-Weave-an-Infinity-Boner.jpg",
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
  "imploding-kitten": {
    name: "Imploding Kitten",
    description:
      "Mèo Nổ Sập! (Chức năng: Khi rút phải ở thế ngửa sẽ không thể dùng Defuse và bị nổ tung).",
    imageUrls: [
      "https://explodi.ng/images/cards/imploding-kitten/artworks/Imploding-Kitten.jpg",
    ],
  },
  reverse: {
    name: "Reverse",
    description: "Đảo ngược chiều lượt chơi hiện tại và kết thúc lượt của bạn.",
    imageUrls: [
      "https://explodi.ng/images/cards/reverse/artworks/Reverse-Go-Back-In-Time-And-Steal-A-Pregnant-Dinosaur.jpg",
      "https://explodi.ng/images/cards/reverse/artworks/Reverse-Receive-A-Hairy-Tummy-Massage.jpg",
      "https://explodi.ng/images/cards/reverse/artworks/Reverse-Return-From-An-Unpleasant-Doctor-s-Visit.jpg",
      "https://explodi.ng/images/cards/reverse/artworks/Reverse-Try-Something-New-Today.jpg",
    ],
  },
  "draw-from-bottom": {
    name: "Draw from Bottom",
    description:
      "Kết thúc lượt bằng cách rút lá bài dưới cùng của chồng bài thay vì trên cùng.",
    imageUrls: [
      "https://explodi.ng/images/cards/draw-from-the-bottom/artworks/Draw-from-the-Bottom-Take-a-Big-Bite-of-Your-Coward-Sandwich.jpg",
    ],
  },
  "feral-cat": {
    name: "Feral Cat",
    description:
      "Mèo hoang! Có thể dùng như bất kỳ lá mèo cơ bản nào để tạo Combo.",
    imageUrls: [
      "https://explodi.ng/images/cards/feral-cat/artworks/Feral-Cat.jpg",
    ],
  },
  "alter-the-future": {
    name: "Alter the Future",
    description:
      "Xem trước 3 lá bài trên cùng và được quyền sắp xếp lại thứ tự của chúng.",
    imageUrls: [
      "https://explodi.ng/images/cards/alter-the-future-3x/artworks/Alter-the-Future-Cat-Wizard.jpg",
      "https://explodi.ng/images/cards/alter-the-future-3x/artworks/Alter-the-Future-Furmaid.jpg",
      "https://explodi.ng/images/cards/alter-the-future-3x/artworks/Alter-the-Future-Golden-Haired-Manatee.jpg",
      "https://explodi.ng/images/cards/alter-the-future-3x/artworks/Alter-the-Future-Time-Traveling-Crab.jpg",
    ],
  },
  "targeted-attack": {
    name: "Targeted Attack",
    description:
      "Kết thúc lượt của bạn và chọn bất kỳ người chơi nào để bắt họ chơi 2 lượt liên tiếp.",
    imageUrls: [
      "https://explodi.ng/images/cards/targeted-attack-2x/artworks/Targeted-Attack-2x-Deploy-The-Groin-Kicking-Panda-Bear.jpg",
      "https://explodi.ng/images/cards/targeted-attack-2x/artworks/Targeted-Attack-2x-Fire-The-Fat-Hamster-Crossbow.jpg",
      "https://explodi.ng/images/cards/targeted-attack-2x/artworks/Targeted-Attack-Unleash-a-Shark-Who-Hurts-with-Words-Instead-of-Teeth.jpg",
    ],
  },
};
