import { CardType, CardInstance, CARD_DEFINITIONS } from "./constants";
import { v4 as uuidv4 } from "uuid";

// Helper function to shuffle an array
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

// Function to create the full deck (Expansion + Party Pack)
function createFullDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  const cardCounts: Partial<Record<CardType, number>> = {
    "exploding-kitten": 9, // Hỗ trợ lên đến 10 người
    defuse: 10,
    nope: 10,
    attack: 8,
    skip: 10,
    favor: 8,
    shuffle: 8,
    "see-the-future": 10,
    tacocat: 8,
    cattermelon: 8,
    "hairy-potato-cat": 8,
    "beard-cat": 8,
    "rainbow-ralphing-cat": 8,
    "imploding-kitten": 1,
    reverse: 4,
    "draw-from-bottom": 4,
    "feral-cat": 4,
    "alter-the-future": 4,
    "targeted-attack": 3,
  };

  for (const cardType in cardCounts) {
    const count = cardCounts[cardType as CardType];
    if (count) {
      const numVariants =
        CARD_DEFINITIONS[cardType as CardType].imageUrls.length;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: uuidv4(),
          type: cardType as CardType,
          variantIndex: i % numVariants, // Assign variants sequentially
        });
      }
    }
  }

  return deck;
}

export function dealCards(playerNames: string[]): {
  playerHands: Record<string, CardInstance[]>;
  drawPile: CardInstance[];
} {
  const numPlayers = playerNames.length;
  if (numPlayers < 2 || numPlayers > 10) {
    throw new Error("Game requires 2 to 10 players.");
  }

  const fullDeck = createFullDeck();

  // 1. Remove all Exploding Kittens and Defuse cards from the deck.
  let deckWithoutBombsAndDefuses = fullDeck.filter(
    (card) =>
      card.type !== "exploding-kitten" &&
      card.type !== "imploding-kitten" &&
      card.type !== "defuse",
  );

  // 2. Shuffle the remaining deck and deal 5 cards to each player.
  deckWithoutBombsAndDefuses = shuffle(deckWithoutBombsAndDefuses);

  const playerHands: Record<string, CardInstance[]> = {};
  playerNames.forEach((name) => {
    playerHands[name] = [];
  });

  for (let i = 0; i < 5; i++) {
    for (const name of playerNames) {
      const card = deckWithoutBombsAndDefuses.pop();
      if (card) {
        playerHands[name].push(card);
      }
    }
  }

  // 3. Each player gets one Defuse card.
  const defuseCards = fullDeck.filter((card) => card.type === "defuse");
  for (const name of playerNames) {
    const defuseCard = defuseCards.pop();
    if (defuseCard) {
      playerHands[name].push(defuseCard);
    }
  }

  // 4. Take the remaining Defuse cards and shuffle them back into the deck.
  let drawPile = [...deckWithoutBombsAndDefuses, ...defuseCards];

  // 5. Insert Exploding Kitten cards into the deck, equal to the number of players - 1.
  const bombs = fullDeck.filter(
    (card) =>
      card.type === "exploding-kitten" || card.type === "imploding-kitten",
  );
  drawPile.push(...shuffle(bombs).slice(0, numPlayers - 1));

  // 6. Shuffle the final draw pile.
  drawPile = shuffle(drawPile);

  return { playerHands, drawPile };
}
