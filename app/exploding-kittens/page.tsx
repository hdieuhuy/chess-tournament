"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { CARD_DEFINITIONS, CardInstance, CardType } from "./constants";
import { Card } from "./Card";
import { dealCards } from "./utils";
import { motion, AnimatePresence } from "framer-motion";

function ExplodingKittensGame() {
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
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  // Game Logic States (To be expanded)
  const [playerHands, setPlayerHands] = useState<
    Record<string, CardInstance[]>
  >({});
  const [drawPile, setDrawPile] = useState<CardInstance[]>([]);
  const [discardPile, setDiscardPile] = useState<CardInstance[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const myHand = playerHands[playerName] || [];

  // Advanced Game Logic States
  const [deadPlayers, setDeadPlayers] = useState<string[]>([]);
  const [turnsLeft, setTurnsLeft] = useState<number>(1);
  const [isDefusing, setIsDefusing] = useState<boolean>(false);
  const [drawnBomb, setDrawnBomb] = useState<CardInstance | null>(null);
  const [peekedCards, setPeekedCards] = useState<CardInstance[] | null>(null);
  const [targetSelectMode, setTargetSelectMode] = useState<
    "favor" | "combo2" | "combo3" | "combo5" | null
  >(null);
  const [combo2Target, setCombo2Target] = useState<string | null>(null);
  const [selectedHandCards, setSelectedHandCards] = useState<CardInstance[]>(
    [],
  );
  const [pendingComboCards, setPendingComboCards] = useState<CardInstance[]>(
    [],
  );
  const [favorRequest, setFavorRequest] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    player: string;
    cardType: string;
    playedCards: CardInstance[];
    targetPlayer: string | null;
    targetCardId: string | null;
    requestedType: CardType | null;
    nopeCount: number;
    endTime: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const stateRef = useRef({
    hostName,
    players,
    spectators,
    gameStarted,
    readyPlayers,
    currentTurnIndex,
    winner,
    playerHands,
    drawPile,
    discardPile,
    deadPlayers,
    turnsLeft,
    actionLog,
    favorRequest,
    pendingAction,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      players,
      spectators,
      gameStarted,
      readyPlayers,
      currentTurnIndex,
      winner,
      playerHands,
      drawPile,
      discardPile,
      deadPlayers,
      turnsLeft,
      actionLog,
      favorRequest,
      pendingAction,
    };
  }, [
    hostName,
    players,
    spectators,
    gameStarted,
    readyPlayers,
    currentTurnIndex,
    winner,
    playerHands,
    drawPile,
    discardPile,
    deadPlayers,
    turnsLeft,
    actionLog,
    favorRequest,
    pendingAction,
  ]);

  // Realtime channel setup
  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`exploding-kittens-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        if (data.hostName !== undefined) setHostName(data.hostName);
        if (data.players !== undefined) setPlayers(data.players);
        if (data.spectators !== undefined) setSpectators(data.spectators);
        if (data.readyPlayers !== undefined) setReadyPlayers(data.readyPlayers);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.playerHands !== undefined) setPlayerHands(data.playerHands);
        if (data.drawPile !== undefined) setDrawPile(data.drawPile);
        if (data.discardPile !== undefined) setDiscardPile(data.discardPile);
        if (data.deadPlayers !== undefined) setDeadPlayers(data.deadPlayers);
        if (data.turnsLeft !== undefined) setTurnsLeft(data.turnsLeft);
        if (data.actionLog !== undefined) setActionLog(data.actionLog);
        if (data.favorRequest !== undefined) setFavorRequest(data.favorRequest);
        if (data.pendingAction !== undefined)
          setPendingAction(data.pendingAction);
      })
      .on("broadcast", { event: "sync-game" }, (payload) => {
        const data = payload.payload;
        if (data.playerHands !== undefined) setPlayerHands(data.playerHands);
        if (data.drawPile !== undefined) setDrawPile(data.drawPile);
        if (data.discardPile !== undefined) setDiscardPile(data.discardPile);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.deadPlayers !== undefined) setDeadPlayers(data.deadPlayers);
        if (data.turnsLeft !== undefined) setTurnsLeft(data.turnsLeft);
        if (data.actionLog !== undefined) setActionLog(data.actionLog);
        if (data.favorRequest !== undefined) setFavorRequest(data.favorRequest);
        if (data.pendingAction !== undefined)
          setPendingAction(data.pendingAction);
      })
      .on("broadcast", { event: "resolve-action" }, (payload) => {
        const data = payload.payload;
        setPendingAction(null);
        setPlayerHands(data.playerHands);
        setDrawPile(data.drawPile);
        setDiscardPile(data.discardPile);
        setTurnsLeft(data.turnsLeft);
        setCurrentTurnIndex(data.currentTurnIndex);
        setActionLog(data.actionLog);
        setFavorRequest(data.favorRequest);

        if (
          data.cardType === "see-the-future" &&
          !data.isNoped &&
          data.actionPlayer === playerName
        ) {
          setPeekedCards(data.drawPile.slice(-3).reverse());
        }
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newPlayers = [...state.players];
          const newSpecs = [...state.spectators];
          const maxPlayers = 5; // Exploding Kittens usually 2-5 players

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
      .on("broadcast", { event: "shuffle-deck" }, () => {
        setIsShuffling(true);
        setTimeout(() => setIsShuffling(false), 800);
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
  }, [roomId, playerName, hasInitialized, requestedRole]);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);
      if (!roomParam) {
        setShowNameModal(false);
        setHasInitialized(true);
        const newRoomId = Math.random().toString(36).substring(2, 10);
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
  }, [pathname, roomParam, router]);

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
        const newRoomId = Math.random().toString(36).substring(2, 10);
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
    }
  };

  const getNextAlivePlayerIndexState = (
    currentIndex: number,
    playersList: string[],
    deadList: string[],
  ) => {
    let nextIndex = currentIndex;
    let count = 0;
    do {
      nextIndex = (nextIndex + 1) % playersList.length;
      count++;
    } while (
      deadList.includes(playersList[nextIndex]) &&
      count < playersList.length
    );
    return nextIndex;
  };

  const resolvePendingAction = useCallback(() => {
    const state = stateRef.current;
    if (!state.pendingAction) return;

    const {
      cardType,
      targetPlayer,
      targetCardId,
      requestedType,
      nopeCount,
      player,
    } = state.pendingAction;
    const isNoped = nopeCount % 2 !== 0;

    const newLog = [...state.actionLog];
    let newTurnsLeft = state.turnsLeft;
    let nextTurnIdx = state.currentTurnIndex;
    let newDrawPile = [...state.drawPile];
    const newPlayerHands = { ...state.playerHands };
    const newDiscardPile = [...state.discardPile];
    let newFavorRequest = state.favorRequest;

    if (isNoped) {
      newLog.unshift(`Hành động của ${player} đã bị NOPE hủy bỏ!`);
    } else {
      if (cardType === "attack") {
        newLog.unshift(`${player} đánh lá Attack.`);
        newTurnsLeft = 2;
        nextTurnIdx = getNextAlivePlayerIndexState(
          state.currentTurnIndex,
          state.players,
          state.deadPlayers,
        );
      } else if (cardType === "skip") {
        newLog.unshift(`${player} đánh lá Skip.`);
        newTurnsLeft -= 1;
        if (newTurnsLeft <= 0) {
          newTurnsLeft = 1;
          nextTurnIdx = getNextAlivePlayerIndexState(
            state.currentTurnIndex,
            state.players,
            state.deadPlayers,
          );
        }
      } else if (cardType === "shuffle") {
        newLog.unshift(`${player} đánh lá Shuffle.`);
        newDrawPile = [...state.drawPile].sort(() => Math.random() - 0.5);
        setIsShuffling(true);
        setTimeout(() => setIsShuffling(false), 800);
        if (channel)
          channel.send({
            type: "broadcast",
            event: "shuffle-deck",
            payload: {},
          });
      } else if (cardType === "see-the-future") {
        newLog.unshift(`${player} đánh lá See the Future.`);
        if (player === playerName) {
          setPeekedCards(newDrawPile.slice(-3).reverse());
        }
      } else if (cardType === "favor" && targetPlayer) {
        newLog.unshift(`${player} dùng Favor lên ${targetPlayer}.`);
        newFavorRequest = { from: player, to: targetPlayer };
      } else if (cardType === "combo2" && targetPlayer && targetCardId) {
        const targetHand = [...(newPlayerHands[targetPlayer] || [])];
        const cardIdx = targetHand.findIndex((c) => c.id === targetCardId);
        if (cardIdx !== -1) {
          const stolenCard = targetHand.splice(cardIdx, 1)[0];
          newPlayerHands[player] = [
            ...(newPlayerHands[player] || []),
            stolenCard,
          ];
          newPlayerHands[targetPlayer] = targetHand;
          newLog.unshift(
            `${player} dùng bộ đôi cướp ngẫu nhiên bài của ${targetPlayer}.`,
          );
        } else {
          newLog.unshift(
            `${player} cướp bài của ${targetPlayer} nhưng đối thủ không có.`,
          );
        }
      } else if (cardType === "combo3" && targetPlayer && requestedType) {
        const targetHand = [...(newPlayerHands[targetPlayer] || [])];
        const cardIdx = targetHand.findIndex((c) => c.type === requestedType);
        if (cardIdx !== -1) {
          const stolenCard = targetHand.splice(cardIdx, 1)[0];
          newPlayerHands[player] = [
            ...(newPlayerHands[player] || []),
            stolenCard,
          ];
          newPlayerHands[targetPlayer] = targetHand;
          newLog.unshift(
            `${player} dùng bộ 3 lấy thành công lá ${CARD_DEFINITIONS[requestedType].name} từ ${targetPlayer}.`,
          );
        } else {
          newLog.unshift(
            `${player} dùng bộ 3 gọi ${CARD_DEFINITIONS[requestedType].name} từ ${targetPlayer} nhưng đối thủ không có.`,
          );
        }
      } else if (cardType === "combo5" && targetCardId) {
        const cardIndex = newDiscardPile.findIndex(
          (c) => c.id === targetCardId,
        );
        if (cardIndex !== -1) {
          const takenCard = newDiscardPile[cardIndex];
          newDiscardPile.splice(cardIndex, 1);
          newPlayerHands[player] = [
            ...(newPlayerHands[player] || []),
            takenCard,
          ];
          newLog.unshift(
            `${player} dùng bộ 5 lấy lại ${CARD_DEFINITIONS[takenCard.type].name} từ chồng bài bỏ.`,
          );
        }
      }
    }

    setPendingAction(null);
    setPlayerHands(newPlayerHands);
    setDrawPile(newDrawPile);
    setDiscardPile(newDiscardPile);
    setTurnsLeft(newTurnsLeft);
    setCurrentTurnIndex(nextTurnIdx);
    setActionLog(newLog);
    setFavorRequest(newFavorRequest);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "resolve-action",
        payload: {
          actionPlayer: player,
          cardType,
          isNoped,
          playerHands: newPlayerHands,
          drawPile: newDrawPile,
          discardPile: newDiscardPile,
          turnsLeft: newTurnsLeft,
          currentTurnIndex: nextTurnIdx,
          actionLog: newLog,
          favorRequest: newFavorRequest,
        },
      });
    }
  }, [channel, playerName]);

  useEffect(() => {
    if (pendingAction && hostName === playerName) {
      const timeLeftMS = pendingAction.endTime - Date.now();
      if (timeLeftMS > 0) {
        const timer = setTimeout(() => {
          resolvePendingAction();
        }, timeLeftMS);
        return () => clearTimeout(timer);
      } else {
        resolvePendingAction();
      }
    }
  }, [pendingAction, hostName, playerName, resolvePendingAction]);

  useEffect(() => {
    if (pendingAction) {
      const updateTimer = () => {
        const t = pendingAction.endTime - Date.now();
        setTimeLeft(Math.max(0, Math.ceil(t / 1000)));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 100);
      return () => clearInterval(interval);
    }
  }, [pendingAction]);

  const getNextAlivePlayerIndex = (currentIndex: number) => {
    let nextIndex = currentIndex;
    let count = 0;
    do {
      nextIndex = (nextIndex + 1) % players.length;
      count++;
    } while (
      deadPlayers.includes(players[nextIndex]) &&
      count < players.length
    );
    return nextIndex;
  };

  const handleDrawCard = () => {
    if (
      players[currentTurnIndex] !== playerName ||
      winner ||
      isDefusing ||
      deadPlayers.includes(playerName) ||
      favorRequest ||
      pendingAction
    )
      return;
    if (drawPile.length === 0) return;

    const newDrawPile = [...drawPile];
    const drawnCard = newDrawPile.pop()!;

    if (drawnCard.type === "exploding-kitten") {
      const hasDefuse = myHand.some((c) => c.type === "defuse");
      if (hasDefuse) {
        setIsDefusing(true);
        setDrawnBomb(drawnCard);
        setDrawPile(newDrawPile);

        const newLog = [
          `${playerName} rút trúng Mèo Nổ và đang dùng Defuse!`,
          ...actionLog,
        ];
        setActionLog(newLog);
        if (channel)
          channel.send({
            type: "broadcast",
            event: "sync-game",
            payload: { drawPile: newDrawPile, actionLog: newLog },
          });
      } else {
        const newDeadPlayers = [...deadPlayers, playerName];
        const newLog = [`💥 BOOM! ${playerName} đã nổ tung!`, ...actionLog];

        let newWinner = null;
        if (newDeadPlayers.length === players.length - 1) {
          newWinner = players.find((p) => !newDeadPlayers.includes(p)) || null;
          newLog.unshift(`🏆 ${newWinner} giành chiến thắng!`);
        }

        const nextTurnIdx = getNextAlivePlayerIndex(currentTurnIndex);

        setDeadPlayers(newDeadPlayers);
        setDrawPile(newDrawPile);
        setCurrentTurnIndex(nextTurnIdx);
        setTurnsLeft(1);
        setWinner(newWinner);
        setActionLog(newLog);

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "sync-game",
            payload: {
              drawPile: newDrawPile,
              deadPlayers: newDeadPlayers,
              currentTurnIndex: nextTurnIdx,
              turnsLeft: 1,
              winner: newWinner,
              actionLog: newLog,
            },
          });
        }
      }
    } else {
      const newHand = [...myHand, drawnCard];
      const newPlayerHands = { ...playerHands, [playerName]: newHand };

      let newTurnsLeft = turnsLeft - 1;
      let nextTurnIdx = currentTurnIndex;

      if (newTurnsLeft <= 0) {
        newTurnsLeft = 1;
        nextTurnIdx = getNextAlivePlayerIndex(currentTurnIndex);
      }

      const newLog = [`${playerName} đã rút bài kết thúc lượt.`, ...actionLog];

      setDrawPile(newDrawPile);
      setPlayerHands(newPlayerHands);
      setTurnsLeft(newTurnsLeft);
      setCurrentTurnIndex(nextTurnIdx);
      setActionLog(newLog);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-game",
          payload: {
            drawPile: newDrawPile,
            playerHands: newPlayerHands,
            turnsLeft: newTurnsLeft,
            currentTurnIndex: nextTurnIdx,
            actionLog: newLog,
          },
        });
      }
    }
  };

  const handlePlaceBomb = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDefusing || !drawnBomb) return;

    const formData = new FormData(e.currentTarget);
    const indexFromTop = Number(formData.get("bombPosition") || 0);

    const defuseCardIndex = myHand.findIndex((c) => c.type === "defuse");
    if (defuseCardIndex === -1) return;

    const defuseCard = myHand[defuseCardIndex];
    const newHand = [...myHand];
    newHand.splice(defuseCardIndex, 1);

    const newDiscardPile = [...discardPile, defuseCard];
    const newDrawPile = [...drawPile];
    newDrawPile.splice(newDrawPile.length - indexFromTop, 0, drawnBomb);

    const newPlayerHands = { ...playerHands, [playerName]: newHand };

    let newTurnsLeft = turnsLeft - 1;
    let nextTurnIdx = currentTurnIndex;
    if (newTurnsLeft <= 0) {
      newTurnsLeft = 1;
      nextTurnIdx = getNextAlivePlayerIndex(currentTurnIndex);
    }

    const newLog = [
      `${playerName} đã giấu Mèo Nổ trở lại và kết thúc lượt.`,
      ...actionLog,
    ];

    setIsDefusing(false);
    setDrawnBomb(null);
    setPlayerHands(newPlayerHands);
    setDiscardPile(newDiscardPile);
    setDrawPile(newDrawPile);
    setTurnsLeft(newTurnsLeft);
    setCurrentTurnIndex(nextTurnIdx);
    setActionLog(newLog);

    if (channel)
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: newPlayerHands,
          discardPile: newDiscardPile,
          drawPile: newDrawPile,
          turnsLeft: newTurnsLeft,
          currentTurnIndex: nextTurnIdx,
          actionLog: newLog,
        },
      });
  };

  const toggleCardSelection = (card: CardInstance) => {
    if (
      players[currentTurnIndex] !== playerName ||
      winner ||
      isDefusing ||
      deadPlayers.includes(playerName) ||
      favorRequest ||
      pendingAction
    )
      return;
    if (card.type === "defuse" || card.type === "exploding-kitten") return;

    if (selectedHandCards.some((c) => c.id === card.id)) {
      setSelectedHandCards((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setSelectedHandCards((prev) => [...prev, card]);
    }
  };

  const handlePlaySelected = () => {
    if (
      players[currentTurnIndex] !== playerName ||
      winner ||
      isDefusing ||
      deadPlayers.includes(playerName) ||
      favorRequest
    )
      return;

    const basicCatCards = [
      "tacocat",
      "cattermelon",
      "hairy-potato-cat",
      "beard-cat",
      "rainbow-ralphing-cat",
    ];

    if (selectedHandCards.length === 1) {
      const card = selectedHandCards[0];
      if (basicCatCards.includes(card.type)) {
        toast.error(
          "Bài mèo cơ bản phải đánh theo đôi, bộ 3 hoặc bộ 5 lá khác nhau!",
        );
        return;
      }
      handlePlayCard(card);
      setSelectedHandCards([]);
    } else {
      const isAllBasicCats = selectedHandCards.every((c) =>
        basicCatCards.includes(c.type),
      );
      if (!isAllBasicCats) {
        toast.error("Combo (bộ 2, 3, 5) chỉ áp dụng cho các lá Mèo cơ bản!");
        return;
      }

      if (selectedHandCards.length === 2) {
        if (
          selectedHandCards.every((c) => c.type === selectedHandCards[0].type)
        ) {
          setPendingComboCards(selectedHandCards);
          setTargetSelectMode("combo2");
        } else toast.error("Bộ đôi phải gồm 2 lá có cùng loại!");
      } else if (selectedHandCards.length === 3) {
        if (
          selectedHandCards.every((c) => c.type === selectedHandCards[0].type)
        ) {
          setPendingComboCards(selectedHandCards);
          setTargetSelectMode("combo3");
        } else toast.error("Bộ 3 phải gồm 3 lá có cùng loại!");
      } else if (selectedHandCards.length === 5) {
        if (new Set(selectedHandCards.map((c) => c.type)).size === 5) {
          setPendingComboCards(selectedHandCards);
          setTargetSelectMode("combo5");
        } else toast.error("Bộ 5 lá phải có loại khác nhau hoàn toàn!");
      } else toast.error("Số lượng bài không hợp lệ cho bất kỳ combo nào!");
    }
  };

  const handlePlayNope = (card: CardInstance) => {
    if (!pendingAction) {
      toast.error("Chỉ có thể đánh Nope để chặn một hành động!");
      return;
    }

    const newHand = myHand.filter((c) => c.id !== card.id);
    const newDiscardPile = [...discardPile, card];
    const newPendingAction = {
      ...pendingAction,
      nopeCount: pendingAction.nopeCount + 1,
      endTime: Date.now() + 3000,
    };

    const newLog = [`${playerName} đánh NOPE!`, ...actionLog];

    setPlayerHands({ ...playerHands, [playerName]: newHand });
    setDiscardPile(newDiscardPile);
    setPendingAction(newPendingAction);
    setActionLog(newLog);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: { ...playerHands, [playerName]: newHand },
          discardPile: newDiscardPile,
          pendingAction: newPendingAction,
          actionLog: newLog,
        },
      });
    }
  };

  const handlePlayCard = (card: CardInstance) => {
    if (card.type === "defuse" || card.type === "exploding-kitten") return;

    if (card.type === "nope") {
      handlePlayNope(card);
      return;
    }

    if (
      players[currentTurnIndex] !== playerName ||
      winner ||
      isDefusing ||
      deadPlayers.includes(playerName) ||
      favorRequest ||
      pendingAction
    )
      return;

    const cardIndex = myHand.findIndex((c) => c.id === card.id);
    const newHand = [...myHand];
    newHand.splice(cardIndex, 1);

    const newPlayerHands = { ...playerHands, [playerName]: newHand };
    const newDiscardPile = [...discardPile, card];

    if (["attack", "skip", "shuffle", "see-the-future"].includes(card.type)) {
      const pAction = {
        id: Math.random().toString(),
        player: playerName,
        cardType: card.type,
        playedCards: [card],
        targetPlayer: null,
        targetCardId: null,
        requestedType: null,
        nopeCount: 0,
        endTime: Date.now() + 3000,
      };
      setPlayerHands(newPlayerHands);
      setDiscardPile(newDiscardPile);
      setPendingAction(pAction);

      const newLog = [
        `${playerName} muốn đánh ${CARD_DEFINITIONS[card.type].name}...`,
        ...actionLog,
      ];
      setActionLog(newLog);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-game",
          payload: {
            playerHands: newPlayerHands,
            discardPile: newDiscardPile,
            pendingAction: pAction,
            actionLog: newLog,
          },
        });
      }
    } else if (card.type === "favor") {
      setTargetSelectMode("favor");
      setPendingComboCards([card]);
      setSelectedHandCards([]);
    }
  };

  const executeComboAction = (
    comboType: "combo2" | "combo3" | "combo5",
    targetPlayer: string | null,
    requestedType: CardType | null,
    targetCardId: string | null,
  ) => {
    const myNewHand = myHand.filter(
      (c) => !pendingComboCards.find((pc) => pc.id === c.id),
    );
    const newPlayerHands = { ...playerHands, [playerName]: myNewHand };
    const newDiscardPile = [...discardPile, ...pendingComboCards];

    const comboName =
      comboType === "combo2"
        ? "bộ Đôi"
        : comboType === "combo3"
          ? "bộ 3"
          : "bộ 5";
    const newLog = [`${playerName} muốn dùng ${comboName}...`, ...actionLog];

    const pAction = {
      id: Math.random().toString(),
      player: playerName,
      cardType: comboType,
      playedCards: pendingComboCards,
      targetPlayer,
      targetCardId,
      requestedType,
      nopeCount: 0,
      endTime: Date.now() + 3000,
    };

    setPlayerHands(newPlayerHands);
    setDiscardPile(newDiscardPile);
    setPendingAction(pAction);
    setActionLog(newLog);
    setTargetSelectMode(null);
    setSelectedHandCards([]);
    setPendingComboCards([]);
    setCombo2Target(null);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: newPlayerHands,
          discardPile: newDiscardPile,
          pendingAction: pAction,
          actionLog: newLog,
        },
      });
    }
  };

  const handleFavorTarget = (targetPlayer: string) => {
    setTargetSelectMode(null);
    const targetHand = [...playerHands[targetPlayer]];
    if (targetHand.length === 0) {
      const newLog = [
        `${playerName} muốn dùng Favor với ${targetPlayer} nhưng họ không còn lá nào!`,
        ...actionLog,
      ];
      setActionLog(newLog);
      setPendingComboCards([]); // Reset
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-game",
          payload: { actionLog: newLog },
        });
      }
      return;
    }

    const card = pendingComboCards[0];
    const newHand = myHand.filter((c) => c.id !== card.id);
    const newDiscardPile = [...discardPile, card];
    const newPlayerHands = { ...playerHands, [playerName]: newHand };

    const pAction = {
      id: Math.random().toString(),
      player: playerName,
      cardType: "favor",
      playedCards: [card],
      targetPlayer,
      targetCardId: null,
      requestedType: null,
      nopeCount: 0,
      endTime: Date.now() + 3000,
    };

    const newLog = [
      `${playerName} muốn dùng Favor lên ${targetPlayer}...`,
      ...actionLog,
    ];

    setPlayerHands(newPlayerHands);
    setDiscardPile(newDiscardPile);
    setPendingAction(pAction);
    setPendingComboCards([]);
    setActionLog(newLog);

    if (channel)
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: newPlayerHands,
          discardPile: newDiscardPile,
          pendingAction: pAction,
          actionLog: newLog,
        },
      });
  };

  const handleGiveFavorCard = (card: CardInstance) => {
    if (!favorRequest || favorRequest.to !== playerName) return;

    const myNewHand = myHand.filter((c) => c.id !== card.id);
    const requesterHand = playerHands[favorRequest.from] || [];
    const requesterNewHand = [...requesterHand, card];

    const newPlayerHands = {
      ...playerHands,
      [playerName]: myNewHand,
      [favorRequest.from]: requesterNewHand,
    };
    const newLog = [
      `${playerName} đã đưa 1 lá bài cho ${favorRequest.from}.`,
      ...actionLog,
    ];

    setPlayerHands(newPlayerHands);
    setFavorRequest(null);
    setActionLog(newLog);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: newPlayerHands,
          favorRequest: null,
          actionLog: newLog,
        },
      });
    }
  };

  const handleStartGame = () => {
    if (playerName !== hostName) return;
    if (players.length < 2) {
      toast.error("Cần ít nhất 2 người chơi để bắt đầu!");
      return;
    }

    const { playerHands: initialHands, drawPile: initialDrawPile } =
      dealCards(players);

    const newGameState = {
      ...stateRef.current,
      gameStarted: true,
      playerHands: initialHands,
      drawPile: initialDrawPile,
      discardPile: [],
      currentTurnIndex: 0, // Người host đi trước
      winner: null,
      deadPlayers: [],
      turnsLeft: 1,
      actionLog: ["Trận đấu bắt đầu!"],
      favorRequest: null,
      pendingAction: null,
    };

    // Cập nhật trạng thái cho host
    setGameStarted(newGameState.gameStarted);
    setPlayerHands(newGameState.playerHands);
    setDrawPile(newGameState.drawPile);
    setDiscardPile(newGameState.discardPile);
    setCurrentTurnIndex(newGameState.currentTurnIndex);
    setDeadPlayers(newGameState.deadPlayers);
    setTurnsLeft(newGameState.turnsLeft);
    setActionLog(newGameState.actionLog);
    setFavorRequest(newGameState.favorRequest);
    setPendingAction(newGameState.pendingAction);

    // Gửi trạng thái game mới cho tất cả người chơi
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: newGameState,
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
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      {/* Modal Defuse Bomb */}
      <Modal isOpen={isDefusing} title="GỠ BOM THÀNH CÔNG">
        <form onSubmit={handlePlaceBomb} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-600">
            Bạn đã dùng lá Defuse! Giờ hãy chọn vị trí để giấu Mèo Nổ trở lại
            chồng bài rút (0 là trên cùng).
          </p>
          <input
            type="number"
            name="bombPosition"
            min={0}
            max={drawPile.length}
            defaultValue={0}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700"
          >
            Đặt Mèo Nổ
          </button>
        </form>
      </Modal>

      {/* Modal See The Future */}
      <Modal isOpen={peekedCards !== null} title="Xem trước 3 lá bài">
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="flex justify-center gap-4">
            {peekedCards?.map((card, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="mb-2 text-xs font-bold text-zinc-500">
                  {i === 0 ? "Trên cùng" : `Thứ ${i + 1}`}
                </span>
                <Card
                  card={CARD_DEFINITIONS[card.type]}
                  variantIndex={card.variantIndex}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setPeekedCards(null)}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white font-medium hover:bg-zinc-800"
          >
            Đóng
          </button>
        </div>
      </Modal>

      {/* Modal Favor */}
      <Modal
        isOpen={targetSelectMode === "favor"}
        title="Chọn mục tiêu xin bài"
      >
        <div className="flex flex-col space-y-2 py-4">
          {players
            .filter((p) => p !== playerName && !deadPlayers.includes(p))
            .map((p) => (
              <button
                key={p}
                onClick={() => handleFavorTarget(p)}
                className="w-full rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 text-zinc-800 font-medium hover:bg-zinc-200"
              >
                Xin của {p} ({playerHands[p]?.length || 0} lá)
              </button>
            ))}
          {players.filter((p) => p !== playerName && !deadPlayers.includes(p))
            .length === 0 && (
            <p className="text-center text-sm text-zinc-500">
              Không còn ai sống để xin!
            </p>
          )}
          <button
            onClick={() => setTargetSelectMode(null)}
            className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </div>
      </Modal>

      {/* Modal Combo 2 */}
      <Modal
        isOpen={targetSelectMode === "combo2"}
        title={
          combo2Target
            ? `Chọn lá bài của ${combo2Target}`
            : "Chọn mục tiêu cướp bài (Bộ Đôi)"
        }
      >
        <div className="flex flex-col space-y-2 py-4">
          {!combo2Target ? (
            <>
              {players
                .filter((p) => p !== playerName && !deadPlayers.includes(p))
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      if ((playerHands[p]?.length || 0) > 0) {
                        setCombo2Target(p);
                      } else {
                        toast.error("Người chơi này không có bài!");
                      }
                    }}
                    className="w-full rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 text-zinc-800 font-medium hover:bg-zinc-200"
                  >
                    Cướp ngẫu nhiên của {p} ({playerHands[p]?.length || 0} lá)
                  </button>
                ))}
              <button
                onClick={() => {
                  setTargetSelectMode(null);
                  setSelectedHandCards([]);
                  setPendingComboCards([]);
                  setCombo2Target(null);
                }}
                className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-zinc-600 mb-2">
                Bạn đang lấy 1 lá ngẫu nhiên từ {combo2Target}. Hãy chọn 1 lá:
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                {playerHands[combo2Target]?.map((cardInstance) => (
                  <div
                    key={cardInstance.id}
                    className="relative group cursor-pointer hover:-translate-y-2 transition-transform"
                  >
                    <Card
                      card={CARD_DEFINITIONS["exploding-kitten"]}
                      isFaceDown={true}
                      onClick={() =>
                        executeComboAction(
                          "combo2",
                          combo2Target,
                          null,
                          cardInstance.id,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCombo2Target(null)}
                className="mt-4 w-full rounded-lg bg-zinc-100 px-4 py-3 text-zinc-600 font-medium hover:bg-zinc-200"
              >
                Quay lại chọn người khác
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Combo 3 */}
      <Modal
        isOpen={targetSelectMode === "combo3"}
        title="Chỉ định lá bài muốn cướp (Bộ 3)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            executeComboAction(
              "combo3",
              fd.get("targetPlayer") as string,
              fd.get("cardType") as CardType,
              null,
            );
          }}
          className="flex flex-col space-y-4 py-4"
        >
          <label className="text-sm font-medium text-zinc-700">
            Chọn người chơi:
          </label>
          <select
            name="targetPlayer"
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
            required
          >
            <option value="">-- Chọn mục tiêu --</option>
            {players
              .filter((p) => p !== playerName && !deadPlayers.includes(p))
              .map((p) => (
                <option key={p} value={p}>
                  {p} ({playerHands[p]?.length || 0} lá)
                </option>
              ))}
          </select>
          <label className="text-sm font-medium text-zinc-700">
            Chọn lá bài muốn lấy:
          </label>
          <select
            name="cardType"
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 focus:outline-none"
            required
          >
            <option value="">-- Chọn bài --</option>
            {Object.entries(CARD_DEFINITIONS)
              .filter(([type]) => type !== "exploding-kitten")
              .map(([type, def]) => (
                <option key={type} value={type}>
                  {def.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700"
          >
            Xác nhận Cướp
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetSelectMode(null);
              setSelectedHandCards([]);
              setPendingComboCards([]);
              setCombo2Target(null);
            }}
            className="w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </form>
      </Modal>

      {/* Modal Combo 5 */}
      <Modal
        isOpen={targetSelectMode === "combo5"}
        title="Lấy lại bài từ Chồng bài bỏ (Bộ 5)"
      >
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
            {discardPile.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                Chồng bài bỏ hiện đang trống!
              </p>
            ) : (
              discardPile.map((cardInstance) => (
                <div
                  key={cardInstance.id}
                  className="relative group cursor-pointer hover:-translate-y-2 transition-transform"
                  onClick={() =>
                    executeComboAction("combo5", null, null, cardInstance.id)
                  }
                >
                  <Card
                    card={CARD_DEFINITIONS[cardInstance.type]}
                    variantIndex={cardInstance.variantIndex}
                  />
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setTargetSelectMode(null);
              setSelectedHandCards([]);
              setPendingComboCards([]);
              setCombo2Target(null);
            }}
            className="mt-4 w-full rounded-lg bg-red-100 px-4 py-3 text-red-600 font-medium hover:bg-red-200"
          >
            Hủy
          </button>
        </div>
      </Modal>

      {/* Modal Give Favor Card */}
      <Modal
        isOpen={favorRequest !== null && favorRequest.to === playerName}
        title="Yêu cầu Favor"
      >
        <div className="flex flex-col space-y-4 py-4">
          <p className="text-center text-sm text-zinc-600">
            <span className="font-bold">{favorRequest?.from}</span> đã dùng lá
            Favor lên bạn. Hãy chọn 1 lá bài để đưa cho họ.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
            {myHand.map((cardInstance) => (
              <div key={cardInstance.id} className="relative group">
                <Card
                  card={CARD_DEFINITIONS[cardInstance.type]}
                  variantIndex={cardInstance.variantIndex}
                  onClick={() => handleGiveFavorCard(cardInstance)}
                  className="hover:-translate-y-2"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Thông báo cho người dùng Favor */}
      <Modal
        isOpen={favorRequest !== null && favorRequest.from === playerName}
        title="Đang chờ bài..."
      >
        <div className="flex flex-col space-y-4 py-8 items-center">
          <p className="text-center text-sm text-zinc-600">
            Đang chờ <span className="font-bold">{favorRequest?.to}</span> chọn
            bài để đưa cho bạn...
          </p>
          <div className="mt-4 text-3xl animate-bounce">⏳</div>
        </div>
      </Modal>

      <div className="grid w-full max-w-[1600px] flex-1 grid-cols-1 place-items-center gap-6 px-2 md:px-6 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        {/* Cột trái: Thông tin hiển thị */}
        <div className="mb-8 flex w-full flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
            Mèo Nổ
          </h1>

          {!gameStarted && (
            <div className="mt-4 flex w-full flex-col items-center xl:items-start">
              <p className="mb-3 text-sm text-zinc-500">
                Đang chờ người chơi tham gia ({players.length}/5)...
              </p>
              <div className="mb-4 flex w-full max-w-md items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
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
              {playerName === hostName && (
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className="w-full max-w-md cursor-pointer rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:bg-zinc-400"
                >
                  {players.length < 2 ? "Cần ít nhất 2 người" : "Bắt đầu Game"}
                </button>
              )}
            </div>
          )}

          {gameStarted && (
            <div className="mt-6 flex w-full flex-col items-center xl:items-start space-y-4">
              <div className="flex w-full max-w-sm flex-col items-center xl:items-start justify-center rounded-2xl bg-white p-5 shadow-sm border border-zinc-200">
                <div className="text-lg font-black text-red-600 uppercase tracking-wider">
                  LƯỢT CỦA: {players[currentTurnIndex]}
                </div>
                <div className="mt-1 text-sm font-semibold text-orange-800">
                  Tiếp theo:{" "}
                  {players[getNextAlivePlayerIndex(currentTurnIndex)]}
                </div>
                {turnsLeft > 1 && (
                  <div className="mt-3 text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-full animate-bounce shadow-md text-center">
                    ⚔️ Đang bị Attack!
                    <br />
                    Còn {turnsLeft} lượt phải rút.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex w-full justify-center xl:justify-start">
            <Link
              href="/"
              className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đổi trò chơi
            </Link>
          </div>

          {pendingAction && (
            <div className="mt-4 w-full max-w-sm rounded-xl border-4 border-red-500 bg-red-950 p-4 shadow-2xl xl:items-start text-center xl:text-left">
              <div className="text-red-400 font-black text-xl mb-1 uppercase tracking-wider">
                Chờ 3s đợi đối thủ đánh nope không
              </div>
              <p className="text-white text-sm font-medium">
                <span className="font-bold text-blue-300">
                  {pendingAction.player}
                </span>{" "}
                muốn dùng{" "}
                <span className="text-yellow-400 font-bold">
                  {pendingAction.cardType.toUpperCase()}
                </span>
                .
              </p>
              <div className="text-4xl text-white font-black mt-2">
                {timeLeft}s
              </div>
              <div className="mt-2 text-sm font-bold">
                {pendingAction.nopeCount % 2 === 0 ? (
                  <span className="text-green-400">Trạng thái: HỢP LỆ ✅</span>
                ) : (
                  <span className="text-red-400">
                    Trạng thái: BỊ NOPE CHẶN ❌
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-zinc-400 font-medium">
                Số Nope đã đánh: {pendingAction.nopeCount}
              </div>
              {myHand.some((c) => c.type === "nope") &&
                !deadPlayers.includes(playerName) && (
                  <button
                    onClick={() => {
                      const nopeCard = myHand.find((c) => c.type === "nope");
                      if (nopeCard) handlePlayNope(nopeCard);
                    }}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    Đánh NOPE!
                  </button>
                )}
            </div>
          )}
        </div>

        {/* Cột giữa: Khu vực Game */}
        <div className="flex w-full flex-col items-center justify-center">
          {gameStarted ? (
            <div className="relative flex w-full max-w-6xl flex-col items-center justify-between min-h-[80vh] rounded-3xl border-4 border-red-500 bg-orange-100 p-4 sm:p-8 shadow-xl overflow-hidden">
              {/* Opponents around the table */}
              {players
                .filter((p) => p !== playerName)
                .map((p, index, arr) => {
                  const isDead = deadPlayers.includes(p);
                  const isTurn = players[currentTurnIndex] === p;
                  let posClass = "";
                  if (arr.length === 1)
                    posClass = "top-4 left-1/2 -translate-x-1/2";
                  else if (arr.length === 2) {
                    if (index === 0)
                      posClass = "top-1/4 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-1/4 right-4 -translate-y-1/2";
                  } else if (arr.length === 3) {
                    if (index === 0)
                      posClass = "top-1/4 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-4 left-1/2 -translate-x-1/2";
                    if (index === 2)
                      posClass = "top-1/4 right-4 -translate-y-1/2";
                  } else if (arr.length === 4) {
                    if (index === 0)
                      posClass = "top-1/3 left-4 -translate-y-1/2";
                    if (index === 1)
                      posClass = "top-4 left-1/3 -translate-x-1/2";
                    if (index === 2)
                      posClass = "top-4 left-2/3 -translate-x-1/2";
                    if (index === 3)
                      posClass = "top-1/3 right-4 -translate-y-1/2";
                  }

                  return (
                    <div
                      key={p}
                      className={`absolute ${posClass} flex flex-col items-center rounded-xl border-2 bg-white px-4 py-2 shadow-md transition-all z-10 ${isTurn ? "border-red-500 ring-4 ring-red-200 scale-110" : "border-zinc-200"} ${isDead ? "opacity-40 grayscale" : ""}`}
                    >
                      <span className="text-sm font-bold text-zinc-800 whitespace-nowrap">
                        {p} {isDead && "👻"}
                      </span>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {isDead ? "Đã nổ" : `${playerHands[p]?.length || 0} lá`}
                      </span>
                    </div>
                  );
                })}

              {/* Khoảng trống cho các đối thủ ở trên */}
              <div className="h-16 sm:h-24 w-full shrink-0" />

              {winner && (
                <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-yellow-100 border-4 border-yellow-400 p-6 rounded-2xl shadow-2xl">
                  <h2 className="text-2xl font-black text-yellow-700">
                    🏆 CHIẾN THẮNG: {winner}
                  </h2>
                </div>
              )}

              {/* Game board center (draw/discard piles) */}
              <div className="flex flex-col items-center gap-6 w-full z-0 my-auto">
                <div className="flex items-center gap-8 sm:gap-12">
                  <div className="flex flex-col items-center relative">
                    <div className="relative">
                      {/* Hiệu ứng các lá bài ảo bay ra khi Shuffle */}
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                                x: [0, -40, 0, -40, 0],
                                y: [0, 15, 0, 15, 0],
                                rotate: [0, -20, 0, -20, 0],
                                opacity: [0, 1, 1, 1, 0],
                              }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                                x: [0, 40, 0, 40, 0],
                                y: [0, 10, 0, 10, 0],
                                rotate: [0, 20, 0, 20, 0],
                                opacity: [0, 1, 1, 1, 0],
                              }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                                y: [0, -30, 0, -30, 0],
                                rotate: [0, 10, 0, 10, 0],
                                opacity: [0, 1, 1, 1, 0],
                              }
                            : { opacity: 0 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                        />
                      </motion.div>

                      {/* Lá bài chính (chồng bài rút) */}
                      <motion.div
                        animate={
                          isShuffling
                            ? {
                                y: [0, -10, 10, -10, 0],
                                scale: [1, 1.05, 1.05, 1.05, 1],
                                zIndex: 10,
                              }
                            : { zIndex: 10 }
                        }
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative z-10"
                      >
                        <Card
                          card={CARD_DEFINITIONS["exploding-kitten"]}
                          isFaceDown={true}
                          onClick={handleDrawCard}
                          className={
                            players[currentTurnIndex] === playerName && !winner
                              ? "ring-[6px] ring-red-500 animate-pulse cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                              : "opacity-90"
                          }
                        />
                      </motion.div>
                    </div>
                    <p className="mt-3 text-center text-sm font-bold text-zinc-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                      Rút bài ({drawPile.length})
                    </p>
                  </div>
                  {discardPile.length > 0 && (
                    <div className="flex flex-col items-center">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={discardPile[discardPile.length - 1].id}
                          initial={{
                            scale: 0.5,
                            opacity: 0,
                            x: -50,
                            rotate: -20,
                          }}
                          animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                          }}
                        >
                          <Card
                            card={
                              CARD_DEFINITIONS[
                                discardPile[discardPile.length - 1].type
                              ]
                            }
                            variantIndex={
                              discardPile[discardPile.length - 1].variantIndex
                            }
                          />
                        </motion.div>
                      </AnimatePresence>
                      <p className="mt-3 text-center text-sm font-bold text-zinc-800 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                        Bài bỏ
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Player's Hand */}
              <div className="mt-8 flex flex-col items-center w-full z-20">
                <div className="flex w-full justify-center -space-x-8 sm:-space-x-12 pb-6 px-2 hover:-space-x-2 sm:hover:-space-x-4 transition-all duration-300">
                  <AnimatePresence>
                    {myHand.map((cardInstance, idx) => {
                      const isSelected = selectedHandCards.some(
                        (c) => c.id === cardInstance.id,
                      );
                      return (
                        <motion.div
                          key={cardInstance.id}
                          layout
                          initial={{ opacity: 0, y: 50, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.2 },
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          className="relative hover:z-40 transition-transform duration-200"
                          style={{ zIndex: isSelected ? 50 : idx }}
                        >
                          <Card
                            card={CARD_DEFINITIONS[cardInstance.type]}
                            variantIndex={cardInstance.variantIndex}
                            onClick={() => toggleCardSelection(cardInstance)}
                            className={`${players[currentTurnIndex] === playerName && !winner && cardInstance.type !== "defuse" && cardInstance.type !== "exploding-kitten" ? "cursor-pointer" : "opacity-80 cursor-not-allowed"} ${isSelected ? "ring-[5px] ring-blue-500 -translate-y-8 shadow-2xl" : "hover:-translate-y-6 shadow-xl"}`}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex w-full min-h-[60vh] items-center justify-center rounded-3xl border-4 border-red-500 bg-orange-100 shadow-xl">
              <div className="text-2xl font-black uppercase tracking-widest text-red-500/50">
                Lobby Mèo Nổ
              </div>
            </div>
          )}
        </div>

        {/* Cột phải: Bảng người chơi & Log */}
        <div className="flex w-full flex-col space-y-6 w-full max-w-md mx-auto xl:mx-0 xl:justify-self-end">
          {/* Players List */}
          <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-lg">🎮</span> Người chơi
              </h3>
              <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700">
                {players.length}/5
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {players.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                    {p.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-800">
                    {p} {p === hostName && "👑"} {playerName === p && "(Bạn)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {gameStarted && (
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <span className="text-lg">📜</span> Lịch sử (Log)
                </h3>
              </div>
              <div className="h-[300px] overflow-y-auto p-4 flex flex-col gap-2 bg-zinc-100 text-sm custom-scrollbar">
                {actionLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-white px-3 py-2 rounded shadow-sm border border-zinc-200"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedHandCards.length > 0 && (
            <button
              onClick={handlePlaySelected}
              className="mt-2 w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:bg-blue-700 hover:scale-105 transition-all"
            >
              Đánh bài đã chọn ({selectedHandCards.length})
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ExplodingKittensPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <ExplodingKittensGame />
    </Suspense>
  );
}
