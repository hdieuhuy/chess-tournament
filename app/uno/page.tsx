"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/Modal";
import { FaUser } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { generateUnoDeck, UnoCard, CardColor } from "./constants";
import { motion, AnimatePresence } from "framer-motion";

const generateId = () => Math.random().toString(36).substring(2, 10);
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const getCardColorClass = (color: CardColor) => {
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

const getCardTextColor = (color: CardColor) => {
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

function UnoGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Multiplayer States
  const [gameMode, setGameMode] = useState<"2p" | "4p">("4p");
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  // Game Logic States
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [hands, setHands] = useState<Record<string, UnoCard[]>>({});
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [activeColor, setActiveColor] = useState<CardColor | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingCard, setPendingCard] = useState<UnoCard | null>(null);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  const stateRef = useRef({
    hostName,
    players,
    spectators,
    gameStarted,
    gameMode,
    readyPlayers,
    deck,
    discardPile,
    hands,
    currentTurnIndex,
    direction,
    activeColor,
    winner,
    hasDrawn,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      players,
      spectators,
      gameStarted,
      gameMode,
      readyPlayers,
      deck,
      discardPile,
      hands,
      currentTurnIndex,
      direction,
      activeColor,
      winner,
      hasDrawn,
    };
  }, [
    hostName,
    players,
    spectators,
    gameStarted,
    gameMode,
    readyPlayers,
    deck,
    discardPile,
    hands,
    currentTurnIndex,
    direction,
    activeColor,
    winner,
    hasDrawn,
  ]);

  const channelRef = useRef(channel);
  const playerNameRef = useRef(playerName);
  useEffect(() => {
    channelRef.current = channel;
    playerNameRef.current = playerName;
  }, [channel, playerName]);

  useEffect(() => {
    const handleUnload = () => {
      if (channelRef.current && playerNameRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "leave-room",
          payload: { playerName: playerNameRef.current },
        });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`uno-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        if (data.hostName !== undefined) setHostName(data.hostName);
        if (data.players !== undefined) setPlayers(data.players);
        if (data.spectators !== undefined) setSpectators(data.spectators);
        if (data.gameMode !== undefined) setGameMode(data.gameMode);
        if (data.readyPlayers !== undefined) setReadyPlayers(data.readyPlayers);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.deck !== undefined) setDeck(data.deck);
        if (data.discardPile !== undefined) setDiscardPile(data.discardPile);
        if (data.hands !== undefined) setHands(data.hands);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.direction !== undefined) setDirection(data.direction);
        if (data.activeColor !== undefined) setActiveColor(data.activeColor);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.hasDrawn !== undefined) setHasDrawn(data.hasDrawn);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newPlayers = [...state.players];
          const newSpecs = [...state.spectators];
          const maxPlayers = state.gameMode === "2p" ? 2 : 4;

          const isAlreadyPlayer = newPlayers.includes(newPlayer);
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (newPlayers.length < maxPlayers) {
                newPlayers.push(newPlayer);
                setPlayers(newPlayers);
                stateRef.current.players = newPlayers;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: `Phòng đã đủ ${maxPlayers} người chơi!`,
                  },
                });
                return;
              }
            } else {
              newSpecs.push(newPlayer);
              setSpectators(newSpecs);
              stateRef.current.spectators = newSpecs;
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: { ...stateRef.current },
          });
        }
      })
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error(payload.payload.reason || "Không thể tham gia phòng!");
          setHasInitialized(false);
          setShowNameModal(true);
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer],
        );
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        const data = payload.payload;
        setGameStarted(true);
        if (data.deck) setDeck(data.deck);
        if (data.discardPile) setDiscardPile(data.discardPile);
        if (data.hands) setHands(data.hands);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.direction !== undefined) setDirection(data.direction);
        if (data.activeColor) setActiveColor(data.activeColor);
        setWinner(null);
        setHasDrawn(false);
      })
      .on("broadcast", { event: "sync-game" }, (payload) => {
        const data = payload.payload;
        if (data.hands) setHands(data.hands);
        if (data.deck) setDeck(data.deck);
        if (data.discardPile) setDiscardPile(data.discardPile);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.direction !== undefined) setDirection(data.direction);
        if (data.activeColor) setActiveColor(data.activeColor);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.hasDrawn !== undefined) setHasDrawn(data.hasDrawn);
        if (data.message) {
          toast(data.message, { icon: data.winner ? "🏆" : "⚠️" });
        }
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setGameStarted(false);
        setReadyPlayers([]);
        setDeck([]);
        setDiscardPile([]);
        setHands({});
        setCurrentTurnIndex(0);
        setDirection(1);
        setActiveColor(null);
        setWinner(null);
        setHasDrawn(false);
      })
      .on("broadcast", { event: "change-mode" }, (payload) => {
        const { gameMode: newMode, players: newPlayers } = payload.payload;
        setGameMode(newMode);
        setPlayers(newPlayers);
        setReadyPlayers([]);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayers((prev) => prev.map((p) => (p === oldName ? newName : p)));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setReadyPlayers((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
      })
      .on("broadcast", { event: "leave-room" }, (payload) => {
        const state = stateRef.current;
        const leavingPlayer = payload.payload.playerName;

        const newPlayers = state.players.filter((p) => p !== leavingPlayer);
        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);
        const newReady = state.readyPlayers.filter((p) => p !== leavingPlayer);

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newPlayers[0] || newSpecs[0] || null;
        }

        setPlayers(newPlayers);
        setSpectators(newSpecs);
        setReadyPlayers(newReady);
        setHostName(newHostName);

        if (state.gameStarted) {
          setGameStarted(false);
          setWinner(null);
          toast.error(`${leavingPlayer} đã thoát, ván đấu bị hủy.`);
        }

        stateRef.current.players = newPlayers;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReady;
        stateRef.current.hostName = newHostName;

        if (newHostName === playerName) {
          setTimeout(() => {
            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current },
            });
          }, 50);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel.send({
            type: "broadcast",
            event: "request-join",
            payload: { playerName, requestedRole },
          });
        }
      });

    setChannel(roomChannel);
    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, playerName, hasInitialized, requestedRole, pathname, router]);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);
      if (!roomParam) {
        setShowNameModal(false);
        setHasInitialized(true);
        const newRoomId = generateId();
        setRoomId(newRoomId);
        setHostName(savedName);
        setPlayers([savedName]);
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        const joinedRole = localStorage.getItem(`joinedRoom_${roomParam}`);
        if (joinedRole) {
          setRequestedRole(joinedRole as "player" | "spectator");
          setShowNameModal(false);
          setHasInitialized(true);
        }
      }
    }
    setIsCheckingStorage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const newName = inputName.trim();
    setPlayerName(newName);
    localStorage.setItem("playerName", newName);
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
    setShowNameModal(false);

    if (!hasInitialized) {
      setHasInitialized(true);
      if (!roomId) {
        const newRoomId = generateId();
        setRoomId(newRoomId);
        setHostName(newName);
        setPlayers([newName]);
        localStorage.setItem(`joinedRoom_${newRoomId}`, "player");
        router.replace(`${pathname}?room=${newRoomId}`);
      }
    } else {
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "update-name",
          payload: { oldName: playerName, newName: newName },
        });
      }
      if (hostName === playerName) setHostName(newName);
      setPlayers((prev) => prev.map((p) => (p === playerName ? newName : p)));
      setSpectators((prev) =>
        prev.map((s) => (s === playerName ? newName : s)),
      );
      setReadyPlayers((prev) =>
        prev.map((p) => (p === playerName ? newName : p)),
      );
    }
  };

  const handleChangeGameMode = (mode: "2p" | "4p") => {
    if (playerName !== hostName || gameStarted) return;

    let newPlayers = [...players];

    // Nếu đổi từ 4p xuống 2p mà đang có > 2 người chơi, giữ lại host và người thứ 2
    if (mode === "2p" && newPlayers.length > 2) {
      newPlayers = newPlayers.slice(0, 2);
    }

    setGameMode(mode);
    setPlayers(newPlayers);
    setReadyPlayers([]);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "change-mode",
        payload: { gameMode: mode, players: newPlayers },
      });
    }
  };

  const handleReady = () => {
    if (!playerName || readyPlayers.includes(playerName)) return;
    const newReady = [...readyPlayers, playerName];
    setReadyPlayers(newReady);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-ready",
        payload: { playerName },
      });
    }
  };

  const handleStartGame = () => {
    if (playerName !== hostName) return;

    let initialDeck = generateUnoDeck();
    initialDeck = shuffleArray(initialDeck);

    const initialHands: Record<string, UnoCard[]> = {};
    players.forEach((p) => {
      initialHands[p] = initialDeck.splice(0, 7);
    });

    let firstCard = initialDeck.shift()!;
    while (
      firstCard.color === "black" ||
      ["skip", "reverse", "draw2"].includes(firstCard.value)
    ) {
      initialDeck.push(firstCard);
      firstCard = initialDeck.shift()!;
    }

    const newDiscard = [firstCard];

    setGameStarted(true);
    setDeck(initialDeck);
    setDiscardPile(newDiscard);
    setHands(initialHands);
    setCurrentTurnIndex(0);
    setDirection(1);
    setActiveColor(firstCard.color);
    setWinner(null);
    setHasDrawn(false);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: {
          deck: initialDeck,
          discardPile: newDiscard,
          hands: initialHands,
          currentTurnIndex: 0,
          direction: 1,
          activeColor: firstCard.color,
          hasDrawn: false,
        },
      });
    }
  };

  const getNextTurnIndex = (
    currentIndex: number,
    currentDirection: number,
    step = 1,
  ) => {
    const numPlayers = players.length;
    let nextIndex = (currentIndex + currentDirection * step) % numPlayers;
    if (nextIndex < 0) nextIndex += numPlayers;
    return nextIndex;
  };

  const executePlayCard = (card: UnoCard, selectedColor: CardColor) => {
    const newHand = hands[playerName].filter((c) => c.id !== card.id);
    const newHands = { ...hands, [playerName]: newHand };
    const newDiscard = [...discardPile, card];

    let newDirection = direction;
    let step = 1;
    let nextDeck = [...deck];
    let cardsToDraw = 0;

    if (card.value === "reverse") {
      newDirection = (direction * -1) as 1 | -1;
      if (players.length === 2) step = 2; // Trong mode 2 người, Reverse giống như Skip
    } else if (card.value === "skip") {
      step = 2;
    } else if (card.value === "draw2") {
      step = 2;
      cardsToDraw = 2;
    } else if (card.value === "wild_draw4") {
      step = 2;
      cardsToDraw = 4;
    }

    const nextTurnIdx = getNextTurnIndex(currentTurnIndex, newDirection, step);
    const nextPlayer =
      players[getNextTurnIndex(currentTurnIndex, newDirection, 1)];

    if (cardsToDraw > 0) {
      const drawnCards = [];
      for (let i = 0; i < cardsToDraw; i++) {
        if (nextDeck.length === 0 && newDiscard.length > 1) {
          const top = newDiscard.pop()!;
          nextDeck = [...newDiscard];
          nextDeck = shuffleArray(nextDeck);
          newDiscard.length = 0;
          newDiscard.push(top);
        }
        if (nextDeck.length > 0) {
          drawnCards.push(nextDeck.shift()!);
        }
      }
      newHands[nextPlayer] = [...(newHands[nextPlayer] || []), ...drawnCards];
    }

    let newWinner: string | null = null;
    let message: string | null = null;

    if (newHand.length === 1) message = `${playerName} hô UNO!`;
    if (newHand.length === 0) {
      newWinner = playerName;
      message = `${playerName} đã hết bài và giành chiến thắng!`;
    }

    setHands(newHands);
    setDiscardPile(newDiscard);
    setDeck(nextDeck);
    setCurrentTurnIndex(nextTurnIdx);
    setDirection(newDirection);
    setActiveColor(selectedColor);
    setWinner(newWinner);
    setShowColorPicker(false);
    setPendingCard(null);
    setHasDrawn(false);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          hands: newHands,
          discardPile: newDiscard,
          deck: nextDeck,
          currentTurnIndex: nextTurnIdx,
          direction: newDirection,
          activeColor: selectedColor,
          winner: newWinner,
          message,
          hasDrawn: false,
        },
      });
    }

    if (message) toast(message, { icon: newWinner ? "🏆" : "⚠️" });
  };

  const handlePlayCard = (card: UnoCard) => {
    if (winner || players[currentTurnIndex] !== playerName) return;

    const topCard = discardPile[discardPile.length - 1];
    const isPlayable =
      card.color === "black" ||
      card.color === activeColor ||
      card.value === topCard?.value;

    if (!isPlayable) return;

    if (card.color === "black") {
      setPendingCard(card);
      setShowColorPicker(true);
      return;
    }

    executePlayCard(card, card.color);
  };

  const handleDrawCard = () => {
    if (winner || players[currentTurnIndex] !== playerName || hasDrawn) return;

    let nextDeck = [...deck];
    const newDiscard = [...discardPile];

    if (nextDeck.length === 0 && newDiscard.length > 1) {
      const top = newDiscard.pop()!;
      nextDeck = [...newDiscard];
      nextDeck = shuffleArray(nextDeck);
      newDiscard.length = 0;
      newDiscard.push(top);
    }

    if (nextDeck.length === 0) return;

    const drawnCard = nextDeck.shift()!;
    const newHand = [...hands[playerName], drawnCard];
    const newHands = { ...hands, [playerName]: newHand };

    const topCard = newDiscard[newDiscard.length - 1];
    const isPlayable =
      drawnCard.color === "black" ||
      drawnCard.color === activeColor ||
      drawnCard.value === topCard?.value;

    if (isPlayable) {
      setHands(newHands);
      setDeck(nextDeck);
      setDiscardPile(newDiscard);
      setHasDrawn(true);
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-game",
          payload: {
            hands: newHands,
            deck: nextDeck,
            discardPile: newDiscard,
            hasDrawn: true,
            message: `${playerName} rút được bài hợp lệ và đang quyết định đánh.`,
          },
        });
      }
      toast.success(
        "Lá bài vừa rút hợp lệ! Bạn có thể đánh ngay hoặc Bỏ lượt.",
      );
    } else {
      const nextTurnIdx = getNextTurnIndex(currentTurnIndex, direction, 1);
      setHands(newHands);
      setDeck(nextDeck);
      setDiscardPile(newDiscard);
      setHasDrawn(false);
      setCurrentTurnIndex(nextTurnIdx);
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-game",
          payload: {
            hands: newHands,
            deck: nextDeck,
            discardPile: newDiscard,
            currentTurnIndex: nextTurnIdx,
            hasDrawn: false,
            message: `${playerName} đã rút bài nhưng không hợp lệ, mất lượt.`,
          },
        });
      }
      toast.error(`Rút được lá ${drawnCard.color} không hợp lệ, bạn mất lượt.`);
    }
  };

  const handlePassTurn = () => {
    if (winner || players[currentTurnIndex] !== playerName || !hasDrawn) return;
    const nextTurnIdx = getNextTurnIndex(currentTurnIndex, direction, 1);
    setHasDrawn(false);
    setCurrentTurnIndex(nextTurnIdx);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          currentTurnIndex: nextTurnIdx,
          hasDrawn: false,
          message: `${playerName} đã quyết định bỏ lượt.`,
        },
      });
    }
  };

  const renderCard = (
    card: UnoCard,
    onClick?: () => void,
    isPlayable?: boolean,
    motionProps?: any,
  ) => {
    const colorClass = getCardColorClass(card.color);
    const value = card.value;

    let content;

    if (!isNaN(Number(value))) {
      content = (
        <div
          className={`flex h-16 w-12 sm:h-20 sm:w-14 items-center justify-center rounded-[1.5rem] bg-white transform -rotate-12 shadow-inner`}
        >
          <span
            className={`text-2xl sm:text-3xl font-black drop-shadow-sm ${getCardTextColor(card.color)}`}
          >
            {value}
          </span>
        </div>
      );
    } else if (value === "skip") {
      content = (
        <div
          className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
        >
          <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12">
            <div className="absolute inset-0 rounded-full border-4 sm:border-[6px] border-current opacity-90"></div>
            <div className="absolute inset-0 transform rotate-45">
              <div className="absolute top-1/2 left-1 sm:left-1.5 right-1 sm:right-1.5 h-1 sm:h-1.5 bg-current -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      );
    } else if (value === "reverse") {
      content = (
        <div
          className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
        >
          <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
          <svg
            className="relative w-10 h-10 sm:w-12 sm:h-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 2.1l4 4-4 4" />
            <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
            <path d="M7 21.9l-4-4 4-4" />
            <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
      );
    } else if (value === "draw2") {
      content = (
        <div
          className={`relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center ${getCardTextColor(card.color)}`}
        >
          <div className="absolute inset-0 bg-white rounded-full transform -rotate-12 shadow-inner"></div>
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <div className="absolute w-6 h-9 sm:w-7 sm:h-10 rounded-sm sm:rounded-md bg-white shadow-md transform -rotate-12 border-2 border-current opacity-90"></div>
            <div className="absolute w-6 h-9 sm:w-7 sm:h-10 rounded-sm sm:rounded-md bg-white shadow-lg transform rotate-12 border-2 border-current"></div>
            <span className="relative text-xl sm:text-2xl font-black text-current drop-shadow-lg">
              +2
            </span>
          </div>
        </div>
      );
    } else if (value === "wild") {
      content = (
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500 rounded-tl-full"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tr-full"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500 rounded-bl-full"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-500 rounded-br-full"></div>
          <div className="absolute inset-2 bg-zinc-900 rounded-full flex items-center justify-center text-white font-black text-lg sm:text-xl tracking-wider">
            UNO
          </div>
        </div>
      );
    } else if (value === "wild_draw4") {
      content = (
        <div className="relative w-16 h-16 sm:w-20 sm:w-20 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-500 rounded-tl-full"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500 rounded-tr-full"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-500 rounded-bl-full"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-green-500 rounded-br-full"></div>
          <span className="relative text-4xl sm:text-5xl font-black text-white drop-shadow-md">
            +4
          </span>
        </div>
      );
    }

    return (
      <motion.div
        layoutId={card.id}
        key={card.id}
        onClick={isPlayable ? onClick : undefined}
        className={`relative flex h-28 w-20 sm:h-36 sm:w-24 shrink-0 flex-col items-center justify-center rounded-xl border-4 ${colorClass} shadow-xl ${isPlayable !== undefined ? (isPlayable ? "cursor-pointer hover:z-10 hover:-translate-y-6 hover:shadow-2xl transition-transform duration-200" : "opacity-70 transition-opacity duration-200") : ""}`}
        {...motionProps}
      >
        {content}
      </motion.div>
    );
  };

  const handleEndGame = () => {
    if (playerName !== hostName) return;
    setGameStarted(false);
    setReadyPlayers([]);
    setDeck([]);
    setDiscardPile([]);
    setHands({});
    setCurrentTurnIndex(0);
    setDirection(1);
    setActiveColor(null);
    setWinner(null);
    setHasDrawn(false);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "reset-game",
        payload: {},
      });
    }
  };

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
            title="Chỉnh sửa tên"
          >
            {playerName ? playerName.charAt(0).toUpperCase() : <FaUser />}
          </button>
        </div>
      )}

      <Modal
        isOpen={showNameModal}
        title={
          hasInitialized
            ? "Chỉnh sửa tên"
            : roomParam
              ? "Tham gia phòng chơi"
              : "Tạo phòng chơi mới"
        }
      >
        <form onSubmit={handleJoinRoom} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-500">
            Vui lòng nhập tên của bạn để bắt đầu.
          </p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />

          {!hasInitialized && roomParam && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Bạn muốn tham gia với tư cách:
              </label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center space-x-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="role"
                    value="player"
                    checked={requestedRole === "player"}
                    onChange={(e) =>
                      setRequestedRole(e.target.value as "player" | "spectator")
                    }
                    className="accent-zinc-900"
                  />
                  <span>Người chơi</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="role"
                    value="spectator"
                    checked={requestedRole === "spectator"}
                    onChange={(e) =>
                      setRequestedRole(e.target.value as "player" | "spectator")
                    }
                    className="accent-zinc-900"
                  />
                  <span>Người xem</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={showColorPicker} title="Chọn màu cho lượt tiếp theo">
        <div className="flex justify-around py-4">
          {["red", "blue", "green", "yellow"].map((c) => (
            <button
              key={c}
              onClick={() => executePlayCard(pendingCard!, c as CardColor)}
              className={`w-16 h-16 rounded-full border-4 border-white shadow-lg transform transition-transform hover:scale-110 ${getCardColorClass(c as CardColor).split(" ")[0]}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => {
              setShowColorPicker(false);
              setPendingCard(null);
            }}
            className="cursor-pointer rounded-lg bg-zinc-200 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300"
          >
            Hủy đánh lá này
          </button>
        </div>
      </Modal>

      <div className="flex w-full max-w-[1200px] flex-1 flex-col items-center gap-8">
        {/* Bàn chơi chính */}
        <div className="flex w-full flex-col items-center justify-center">
          <div className="relative flex h-[70vh] w-full max-w-[1000px] items-center justify-center rounded-[3rem] border-8 border-amber-800 bg-emerald-700 shadow-2xl overflow-hidden">
            {/* Direction Indicator */}
            {gameStarted && !winner && (
              <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-2xl font-bold text-white">
                {direction === 1 ? "↻" : "↺"}
              </div>
            )}

            {/* Color Indicator */}
            {gameStarted && activeColor && (
              <div className="absolute left-6 top-6 flex flex-col items-center">
                <span className="mb-1 text-[10px] font-bold tracking-widest text-white opacity-70">
                  MÀU HIỆN TẠI
                </span>
                <div
                  className={`h-8 w-8 rounded-full border-2 border-white shadow-md ${getCardColorClass(activeColor).split(" ")[0]}`}
                />
              </div>
            )}

            {/* Khu vực giữa bàn: Chồng bài rút và bài đánh ra */}
            {gameStarted ? (
              <div className="flex space-x-6 sm:space-x-12">
                {/* Bài rút */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDrawCard}
                  className={`flex h-32 w-24 sm:h-40 sm:w-28 items-center justify-center rounded-xl border-4 border-white bg-zinc-900 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] z-10 ${players[currentTurnIndex] === playerName && !winner && !hasDrawn ? "cursor-pointer" : "opacity-90 cursor-not-allowed"}`}
                >
                  <span className="rotate-45 text-xl sm:text-2xl font-black tracking-wider text-red-500 drop-shadow-md">
                    UNO
                  </span>
                </motion.div>
                {/* Bài trên bàn */}
                <div className="rotate-3 relative h-32 w-24 sm:h-40 sm:w-28">
                  <AnimatePresence>
                    {discardPile.length > 0 ? (
                      <div
                        key={discardPile[discardPile.length - 1].id}
                        className="absolute inset-0"
                      >
                        {renderCard(
                          discardPile[discardPile.length - 1],
                          undefined,
                          undefined,
                          {
                            initial: {
                              scale: 1.5,
                              opacity: 0,
                              y: -100,
                              rotate: -15,
                            },
                            animate: { scale: 1, opacity: 1, y: 0, rotate: 0 },
                            exit: {
                              opacity: 0,
                              scale: 0.8,
                              transition: { duration: 0.2 },
                            },
                            transition: {
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            },
                          },
                        )}
                      </div>
                    ) : (
                      <div
                        key="empty"
                        className="absolute inset-0 rounded-xl bg-zinc-200/20"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="text-2xl font-black tracking-[0.3em] text-white/40">
                UNO LOBBY
              </div>
            )}

            {/* Hiển thị bài đối thủ ở các góc */}
            {(() => {
              if (!gameStarted) return null;
              const baseIdx = players.includes(playerName)
                ? players.indexOf(playerName)
                : 0;
              let topP: string | null = null,
                leftP: string | null = null,
                rightP: string | null = null;

              if (players.length === 2) {
                topP = players[(baseIdx + 1) % 2];
              } else if (players.length === 3) {
                leftP = players[(baseIdx + 1) % 3];
                topP = players[(baseIdx + 2) % 3];
              } else if (players.length === 4) {
                leftP = players[(baseIdx + 1) % 4];
                topP = players[(baseIdx + 2) % 4];
                rightP = players[(baseIdx + 3) % 4];
              }

              const renderOpponent = (
                pName: string | null,
                pos: "top" | "left" | "right",
              ) => {
                if (!pName) return null;
                const handCount = hands[pName]?.length || 0;
                const isTurn = players[currentTurnIndex] === pName;

                let posClass = "";
                let cardStackClass = "";
                let cardClass = "";

                if (pos === "top") {
                  posClass =
                    "absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none";
                  cardStackClass =
                    "flex space-x-[-1rem] sm:space-x-[-1.5rem] mt-2";
                  cardClass = "w-10 h-14 sm:w-16 sm:h-24";
                } else if (pos === "left") {
                  posClass =
                    "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none";
                  cardStackClass =
                    "flex flex-col space-y-[-1rem] sm:space-y-[-1.5rem] mt-2";
                  cardClass = "w-14 h-10 sm:w-24 sm:h-16";
                } else if (pos === "right") {
                  posClass =
                    "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none";
                  cardStackClass =
                    "flex flex-col space-y-[-1rem] sm:space-y-[-1.5rem] mt-2";
                  cardClass = "w-14 h-10 sm:w-24 sm:h-16";
                }

                return (
                  <div className={posClass}>
                    <div
                      className={`flex items-center gap-1 sm:gap-2 bg-black/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white backdrop-blur-sm shadow-md ${isTurn ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" : ""}`}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-inner">
                        {pName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] sm:text-sm font-semibold truncate max-w-[60px] sm:max-w-[80px]">
                        {pName}
                      </span>
                      <span className="text-[10px] sm:text-xs bg-red-500 px-1.5 py-0.5 rounded-md font-bold">
                        {handCount}
                      </span>
                    </div>
                    <div className={cardStackClass}>
                      {Array.from({ length: Math.min(handCount, 15) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`${cardClass} rounded-md sm:rounded-lg border-2 border-white bg-red-500 shadow-md flex items-center justify-center`}
                          >
                            <div className="w-[60%] h-[60%] rounded-full bg-red-600 border border-white/50 flex items-center justify-center transform -rotate-12">
                              <span className="text-white/50 text-[6px] sm:text-[10px] font-bold">
                                UNO
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderOpponent(topP, "top")}
                  {renderOpponent(leftP, "left")}
                  {renderOpponent(rightP, "right")}
                </>
              );
            })()}

            {/* Thông tin chính mình ở cạnh dưới */}
            {gameStarted && players.includes(playerName) && (
              <div
                className={`absolute bottom-[35%] sm:bottom-[30%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-auto`}
              >
                {hasDrawn &&
                  players[currentTurnIndex] === playerName &&
                  !winner && (
                    <button
                      onClick={handlePassTurn}
                      className="mb-3 px-6 py-2 bg-red-600 border border-white text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-colors animate-bounce cursor-pointer"
                    >
                      Bỏ lượt
                    </button>
                  )}
                <div
                  className={`flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-white backdrop-blur-sm ${players[currentTurnIndex] === playerName && !winner ? "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" : ""}`}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                    {playerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-[150px]">
                    {playerName}
                  </span>
                </div>
              </div>
            )}

            {/* Vị trí bài trên tay người chơi */}
            {gameStarted && hands[playerName] && (
              <div className="absolute bottom-0 left-0 w-full pointer-events-none">
                <div className="custom-scrollbar flex flex-col w-full overflow-x-auto pt-24 pb-4 sm:pb-8 pointer-events-auto gap-y-2 sm:gap-y-4">
                  {(hands[playerName].length > 10
                    ? [
                        hands[playerName].slice(
                          0,
                          Math.ceil(hands[playerName].length / 2),
                        ),
                        hands[playerName].slice(
                          Math.ceil(hands[playerName].length / 2),
                        ),
                      ]
                    : [hands[playerName]]
                  ).map((rowCards, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="flex items-end space-x-[-2rem] sm:space-x-[-1.5rem] px-8 transition-all hover:space-x-1 mx-auto"
                    >
                      <AnimatePresence mode="popLayout">
                        {rowCards.map((card) => {
                          const topCard = discardPile[discardPile.length - 1];
                          const isPlayable =
                            players[currentTurnIndex] === playerName &&
                            !winner &&
                            (card.color === "black" ||
                              card.color === activeColor ||
                              card.value === topCard?.value);
                          return renderCard(
                            card,
                            () => handlePlayCard(card),
                            isPlayable,
                            {
                              initial: { opacity: 0, y: 50, scale: 0.8 },
                              animate: { opacity: 1, y: 0, scale: 1 },
                              exit: {
                                opacity: 0,
                                y: -50,
                                scale: 0.5,
                                transition: { duration: 0.2 },
                              },
                              transition: {
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                              },
                            },
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin bên dưới */}
        <div className="grid w-full max-w-[1000px] grid-cols-1 gap-8 md:grid-cols-2">
          {/* Cột trái */}
          <div className="flex w-full flex-col items-center text-center md:items-start md:text-left">
            <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
              Bài Uno
            </h1>

            {!gameStarted ? (
              <div className="mt-4 flex w-full flex-col items-center md:items-start">
                <p className="mb-3 text-sm text-zinc-500">
                  Đang chờ người chơi tham gia ({players.length}/
                  {gameMode === "2p" ? 2 : 4})...
                </p>

                {playerName === hostName && (
                  <div className="w-full mt-2 mb-4 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                    <label className="block text-sm font-semibold mb-2 text-zinc-700">
                      Chế độ chơi:
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-600">
                        <input
                          type="radio"
                          checked={gameMode === "2p"}
                          onChange={() => handleChangeGameMode("2p")}
                          className="accent-zinc-900"
                        />
                        2 Người
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-600">
                        <input
                          type="radio"
                          checked={gameMode === "4p"}
                          onChange={() => handleChangeGameMode("4p")}
                          className="accent-zinc-900"
                        />
                        4 Người
                      </label>
                    </div>
                  </div>
                )}

                {playerName !== hostName && (
                  <p className="mb-4 text-sm font-medium text-zinc-700">
                    Chế độ: {gameMode === "2p" ? "2 Người" : "4 Người"}
                  </p>
                )}

                <div className="flex w-full items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm mb-4">
                  <span className="flex-1 select-all truncate text-left text-xs text-zinc-500">
                    {typeof window !== "undefined" ? window.location.href : ""}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="cursor-pointer whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    {linkCopied ? "Đã copy!" : "Copy Link"}
                  </button>
                </div>

                {players.includes(playerName) && (
                  <div className="w-full">
                    {playerName === hostName ? (
                      <button
                        onClick={handleStartGame}
                        disabled={
                          players.length !== (gameMode === "2p" ? 2 : 4) ||
                          players
                            .filter((p) => p !== hostName)
                            .some((p) => !readyPlayers.includes(p))
                        }
                        className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
                      >
                        {players.length !== (gameMode === "2p" ? 2 : 4)
                          ? `Đợi đủ ${gameMode === "2p" ? 2 : 4} người`
                          : players
                                .filter((p) => p !== hostName)
                                .some((p) => !readyPlayers.includes(p))
                            ? "Đợi người chơi sẵn sàng..."
                            : "Bắt đầu Game"}
                      </button>
                    ) : (
                      <button
                        onClick={handleReady}
                        disabled={readyPlayers.includes(playerName)}
                        className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
                      >
                        {readyPlayers.includes(playerName)
                          ? "Đã sẵn sàng"
                          : "Sẵn sàng"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 w-full text-left">
                {winner ? (
                  <div className="w-full text-center py-4 bg-green-100 rounded-xl mb-4 border border-green-300">
                    <span className="text-xl font-bold text-green-700">
                      🏆 {winner} chiến thắng!
                    </span>
                  </div>
                ) : (
                  <div className="mb-6 flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900"></div>
                    <div className="p-4 sm:p-5 flex flex-col gap-3 relative">
                      {/* Current Turn */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold shadow-sm ${players[currentTurnIndex] === playerName ? "bg-zinc-900 ring-4 ring-zinc-100" : "bg-zinc-500"}`}
                          >
                            {(
                              players[currentTurnIndex]?.charAt(0) || ""
                            ).toUpperCase()}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              Lượt hiện tại
                            </span>
                            <span className="text-lg font-black text-zinc-900 leading-none mt-0.5">
                              {players[currentTurnIndex] || "..."}
                            </span>
                          </div>
                        </div>
                        {players[currentTurnIndex] === playerName && (
                          <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-800 animate-pulse shadow-sm border border-zinc-200">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
                            </span>
                            Tới lượt bạn!
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-zinc-100"></div>

                      {/* Next Turn */}
                      <div className="flex items-center gap-3 opacity-80">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold border border-zinc-200 shadow-inner">
                          {(
                            players[
                              getNextTurnIndex(currentTurnIndex, direction, 1)
                            ]?.charAt(0) || ""
                          ).toUpperCase()}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            Tiếp theo
                          </span>
                          <span className="text-sm font-bold text-zinc-700 leading-none mt-0.5">
                            {players[
                              getNextTurnIndex(currentTurnIndex, direction, 1)
                            ] || "..."}
                          </span>
                        </div>
                        <div className="ml-auto text-lg text-zinc-500 bg-zinc-50 rounded-full w-8 h-8 flex items-center justify-center border border-zinc-200">
                          {direction === 1 ? "↻" : "↺"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {playerName === hostName &&
                  (!winner ? (
                    <button
                      onClick={handleEndGame}
                      className="w-full cursor-pointer rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      Kết thúc trận
                    </button>
                  ) : (
                    <button
                      onClick={handleEndGame}
                      className="w-full cursor-pointer rounded-lg border border-green-500 bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-green-700"
                    >
                      Chơi lại
                    </button>
                  ))}
              </div>
            )}

            <div className="mt-8 flex w-full justify-center md:justify-start">
              <Link
                href="/"
                className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Đổi trò chơi
              </Link>
            </div>
          </div>

          {/* Cột phải: Danh sách người chơi */}
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                  <span className="text-lg">🎮</span> Người chơi
                </h3>
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700">
                  {players.length}/{gameMode === "2p" ? 2 : 4}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4 sm:p-6">
                {players.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${gameStarted && players[currentTurnIndex] === p ? "bg-blue-600 ring-2 ring-blue-300" : "bg-zinc-800"}`}
                      >
                        {p.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-800">
                        {p} {p === hostName && "👑"}
                      </span>
                    </div>
                    {gameStarted && (
                      <span className="text-xs font-bold text-zinc-500">
                        {hands[p]?.length || 0} lá
                      </span>
                    )}
                    {!gameStarted && (
                      <span className="text-xs font-bold text-zinc-500">
                        {p === hostName
                          ? ""
                          : readyPlayers.includes(p)
                            ? "✅ Sẵn sàng"
                            : "⌛ Đang chờ"}
                      </span>
                    )}
                  </div>
                ))}
                {!gameStarted &&
                  players.length < (gameMode === "2p" ? 2 : 4) && (
                    <div className="rounded-lg border border-dashed p-2 text-center text-sm text-zinc-400">
                      Đang chờ người chơi...
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UnoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn Uno...
        </div>
      }
    >
      <UnoGame />
    </Suspense>
  );
}
