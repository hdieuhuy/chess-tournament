"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { UnoCard, CardColor } from "../types";
import { generateUnoDeck, shuffleArray } from "../utils/game-logic";

interface UnoContextValue {
  roomId: string | null;
  playerName: string;
  isSpectator: boolean;
  hostName: string | null;
  players: string[];
  spectators: string[];
  gameStarted: boolean;
  gameMode: "2p" | "4p";
  readyPlayers: string[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  hands: Record<string, UnoCard[]>;
  currentTurnIndex: number;
  direction: 1 | -1;
  activeColor: CardColor | null;
  winner: string | null;
  hasDrawn: boolean;
  drawStack: number;
  stackPending: boolean;
  stackEndTime: number | null;
  
  handleChangeGameMode: (mode: "2p" | "4p") => void;
  handleKickPlayer: (targetName: string) => void;
  handleToggleReady: () => void;
  handleStartClick: () => void;
  handleBecomeSpectator: () => void;
  
  // Gameplay functions
  playCard: (card: UnoCard) => void;
  drawCard: () => void;
  passTurn: () => void;
  setPendingCard: (card: UnoCard | null) => void;
  setShowColorPicker: (show: boolean) => void;
  handleColorSelect: (color: CardColor) => void;
  
  pendingCard: UnoCard | null;
  showColorPicker: boolean;
  handleResolveStack: () => void;
}

const UnoContext = createContext<UnoContextValue | undefined>(undefined);

export function UnoProvider({
  children,
  roomId,
  playerName,
  requestedRole,
  hasInitialized,
  isCreator,
}: {
  children: ReactNode;
  roomId: string | null;
  playerName: string;
  requestedRole: "player" | "spectator";
  hasInitialized: boolean;
  isCreator: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Multiplayer States
  const [gameMode, setGameMode] = useState<"2p" | "4p">("4p");
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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
  const [drawStack, setDrawStack] = useState<number>(0);
  const [stackPending, setStackPending] = useState<boolean>(false);
  const [stackEndTime, setStackEndTime] = useState<number | null>(null);

  const isSpectator = spectators.includes(playerName);

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
    drawStack,
    stackPending,
    stackEndTime,
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
      drawStack,
      stackPending,
      stackEndTime,
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
    drawStack,
    stackPending,
    stackEndTime,
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

    if (isCreator && !hostName) {
      setHostName(playerName);
      setPlayers([playerName]);
      stateRef.current.hostName = playerName;
      stateRef.current.players = [playerName];
    }

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
        if (data.drawStack !== undefined) setDrawStack(data.drawStack);
        if (data.stackPending !== undefined) setStackPending(data.stackPending);
        if (data.stackEndTime !== undefined) setStackEndTime(data.stackEndTime);
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
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
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
        if (data.drawStack !== undefined) setDrawStack(data.drawStack);
        if (data.stackPending !== undefined) setStackPending(data.stackPending);
        if (data.stackEndTime !== undefined) setStackEndTime(data.stackEndTime);
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
  }, [roomId, playerName, hasInitialized, requestedRole, router, isCreator, pathname]);

  const handleChangeGameMode = useCallback((mode: "2p" | "4p") => {
    if (playerName !== hostName || gameStarted) return;

    let newPlayers = [...players];

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
  }, [playerName, hostName, gameStarted, players, channel]);

  const handleKickPlayer = useCallback((targetName: string) => {
    if (playerName !== hostName) return;

    const newPlayers = players.filter((p) => p !== targetName);
    const newSpecs = spectators.filter((p) => p !== targetName);
    const newReady = readyPlayers.filter((p) => p !== targetName);

    setPlayers(newPlayers);
    setSpectators(newSpecs);
    setReadyPlayers(newReady);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "kick-player",
        payload: { playerName: targetName },
      });
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: {
          ...stateRef.current,
          players: newPlayers,
          spectators: newSpecs,
          readyPlayers: newReady,
        },
      });
    }
  }, [playerName, hostName, players, spectators, readyPlayers, channel]);

  const handleToggleReady = useCallback(() => {
    if (!players.includes(playerName)) return;
    setReadyPlayers((prev) => {
      const newReady = prev.includes(playerName)
        ? prev.filter((p) => p !== playerName)
        : [...prev, playerName];

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "player-ready",
          payload: { playerName },
        });
      }
      return newReady;
    });
  }, [players, playerName, channel]);

  const handleStartClick = useCallback(() => {
    if (playerName !== hostName) return;
    if (players.length < 2) {
      toast.error("Cần ít nhất 2 người để chơi!");
      return;
    }
    const maxPlayers = gameMode === "2p" ? 2 : 4;
    if (players.length !== maxPlayers) {
      toast.error(`Chế độ ${maxPlayers} người cần đủ ${maxPlayers} người chơi!`);
      return;
    }
    if (readyPlayers.length < players.length - 1) {
      toast.error("Vui lòng đợi mọi người sẵn sàng!");
      return;
    }

    const newDeck = shuffleArray(generateUnoDeck());
    const newHands: Record<string, UnoCard[]> = {};

    players.forEach((p) => {
      newHands[p] = newDeck.splice(0, 7);
    });

    let firstCard = newDeck.shift()!;
    while (
      firstCard.color === "black" ||
      ["skip", "reverse", "draw2"].includes(firstCard.value)
    ) {
      newDeck.push(firstCard);
      firstCard = newDeck.shift()!;
    }

    const newDiscardPile = [firstCard];
    
    setGameStarted(true);
    setDeck(newDeck);
    setDiscardPile(newDiscardPile);
    setHands(newHands);
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
          deck: newDeck,
          discardPile: newDiscardPile,
          hands: newHands,
          currentTurnIndex: 0,
          direction: 1,
          activeColor: firstCard.color,
        },
      });
    }
  }, [playerName, hostName, players, gameMode, readyPlayers, channel]);

  const handleBecomeSpectator = useCallback(() => {
    if (gameStarted) {
      toast.error("Trận đấu đang diễn ra!");
      return;
    }

    const newPlayers = players.filter((p) => p !== playerName);
    const newSpecs = [...spectators];
    if (!newSpecs.includes(playerName)) {
      newSpecs.push(playerName);
    }
    
    const newReady = readyPlayers.filter(p => p !== playerName);

    let newHost = hostName;
    if (hostName === playerName) {
      newHost = newPlayers[0] || newSpecs[0] || null;
    }

    setPlayers(newPlayers);
    setSpectators(newSpecs);
    setReadyPlayers(newReady);
    setHostName(newHost);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: {
          ...stateRef.current,
          players: newPlayers,
          spectators: newSpecs,
          readyPlayers: newReady,
          hostName: newHost,
        },
      });
    }
  }, [gameStarted, players, playerName, spectators, readyPlayers, hostName, channel]);

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

  const executePlayCard = useCallback((card: UnoCard, selectedColor: CardColor) => {
    const newHand = hands[playerName].filter((c) => c.id !== card.id);
    const newHands = { ...hands, [playerName]: newHand };
    const newDiscard = [...discardPile, card];

    let newDirection = direction;
    let step = 1;
    let nextDeck = [...deck];
    
    let newDrawStack = drawStack;
    let newStackPending = false;
    let newStackEndTime = null;

    if (card.value === "reverse") {
      newDirection = (direction * -1) as 1 | -1;
      if (players.length === 2) step = 2;
    } else if (card.value === "skip") {
      step = 2;
    } else if (card.value === "draw2") {
      newDrawStack += 2;
      newStackPending = true;
      newStackEndTime = Date.now() + 5000;
      step = 1;
    } else if (card.value === "wild_draw4") {
      newDrawStack += 4;
      newStackPending = true;
      newStackEndTime = Date.now() + 5000;
      step = 1;
    }

    const nextTurnIdx = getNextTurnIndex(currentTurnIndex, newDirection, step);

    let newWinner: string | null = null;
    let message: string | null = null;

    if (newHand.length === 1) message = `${playerName} hô UNO!`;
    if (newHand.length === 0) {
      newWinner = playerName;
      message = `${playerName} đã hết bài và giành chiến thắng!`;
      newStackPending = false;
      newStackEndTime = null;
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
    setDrawStack(newDrawStack);
    setStackPending(newStackPending);
    setStackEndTime(newStackEndTime);

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
          drawStack: newDrawStack,
          stackPending: newStackPending,
          stackEndTime: newStackEndTime,
        },
      });
    }

    if (message) toast(message, { icon: newWinner ? "🏆" : "⚠️" });
  }, [playerName, hands, discardPile, direction, deck, players, currentTurnIndex, drawStack, channel]);

  const handleResolveStack = useCallback(() => {
    if (!stackPending || players[currentTurnIndex] !== playerName) return;

    let nextDeck = [...deck];
    const newDiscard = [...discardPile];
    const newHands = { ...hands };
    
    const drawnCards = [];
    for (let i = 0; i < drawStack; i++) {
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
    
    newHands[playerName] = [...(newHands[playerName] || []), ...drawnCards];
    
    const nextTurnIdx = getNextTurnIndex(currentTurnIndex, direction, 1);

    setHands(newHands);
    setDeck(nextDeck);
    setDiscardPile(newDiscard);
    setCurrentTurnIndex(nextTurnIdx);
    setDrawStack(0);
    setStackPending(false);
    setStackEndTime(null);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          hands: newHands,
          deck: nextDeck,
          discardPile: newDiscard,
          currentTurnIndex: nextTurnIdx,
          drawStack: 0,
          stackPending: false,
          stackEndTime: null,
          direction,
          activeColor,
          winner,
          hasDrawn: false,
        },
      });
    }
  }, [stackPending, players, currentTurnIndex, playerName, deck, discardPile, hands, drawStack, direction, activeColor, winner, channel]);

  const playCard = useCallback((card: UnoCard) => {
    if (winner || players[currentTurnIndex] !== playerName) return;

    const topCard = discardPile[discardPile.length - 1];

    if (stackPending) {
      let isPlayableStack = false;
      if (topCard?.value === "draw2") {
        isPlayableStack = card.value === "draw2" || card.value === "wild_draw4";
      } else if (topCard?.value === "wild_draw4") {
        isPlayableStack = card.value === "wild_draw4";
      }

      if (!isPlayableStack) {
        toast.error("Bạn chỉ có thể đánh lá phù hợp để cộng dồn!");
        return;
      }

      if (card.color === "black") {
        setPendingCard(card);
        setShowColorPicker(true);
        return;
      }

      executePlayCard(card, card.color);
      return;
    }

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
  }, [winner, players, currentTurnIndex, playerName, discardPile, activeColor, executePlayCard, stackPending]);

  const drawCard = useCallback(() => {
    if (winner || players[currentTurnIndex] !== playerName || hasDrawn || stackPending) return;

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
  }, [winner, players, currentTurnIndex, playerName, hasDrawn, deck, discardPile, hands, activeColor, direction, channel]);

  const passTurn = useCallback(() => {
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
  }, [winner, players, currentTurnIndex, playerName, hasDrawn, direction, channel]);

  const handleColorSelect = useCallback((color: CardColor) => {
    if (pendingCard) {
      executePlayCard(pendingCard, color);
    }
  }, [pendingCard, executePlayCard]);

  useEffect(() => {
    if (!stackPending || !stackEndTime) return;

    const interval = setInterval(() => {
      const remaining = stackEndTime - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        if (players[currentTurnIndex] === playerName) {
          handleResolveStack();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [stackPending, stackEndTime, players, currentTurnIndex, playerName, handleResolveStack]);

  return (
    <UnoContext.Provider
      value={{
        roomId,
        playerName,
        isSpectator,
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
        drawStack,
        stackPending,
        stackEndTime,
        handleChangeGameMode,
        handleKickPlayer,
        handleToggleReady,
        handleStartClick,
        handleBecomeSpectator,
        playCard,
        drawCard,
        passTurn,
        setPendingCard,
        setShowColorPicker,
        handleColorSelect,
        pendingCard,
        showColorPicker,
        handleResolveStack,
      }}
    >
      {children}
    </UnoContext.Provider>
  );
}

export function useUno() {
  const context = useContext(UnoContext);
  if (!context) {
    throw new Error("useUno must be used within a UnoProvider");
  }
  return context;
}
