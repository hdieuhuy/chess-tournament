import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { CARD_DEFINITIONS } from "../constants";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { CardInstance, CardType } from "../types";
import { dealCards, shuffle } from "../utils/game-logic";
import confetti from "canvas-confetti";

export interface ExplodingKittensContextType {
  playerHands: Record<string, CardInstance[]>;
  setPlayerHands: React.Dispatch<React.SetStateAction<Record<string, CardInstance[]>>>;
  linkCopied: boolean;
  setLinkCopied: any;
  getNextAlivePlayerIndexState: any;
  executeComboAction: any;


  handleDrawCard: (...args: any[]) => void;
  handlePlaceBomb: (...args: any[]) => void;
  handlePlaceImplodingKitten: (...args: any[]) => void;
  handlePlayNope: (...args: any[]) => void;
  handlePlayCard: (...args: any[]) => void;
  handleSelectTarget: (...args: any[]) => void;
  handleGiveFavorCard: (...args: any[]) => void;
  handleStartGame: (...args: any[]) => void;
  handleResetGame: (...args: any[]) => void;

  roomId: string | null;
  playerName: string;
  requestedRole: "player" | "spectator";
  hasInitialized: boolean;
  isCreator: boolean;
  hostName: string | null;
  setHostName: React.Dispatch<React.SetStateAction<string | null>>;
  players: string[];
  setPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  gameStarted: boolean;
  setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  readyPlayers: string[];
  setReadyPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  spectators: string[];
  setSpectators: React.Dispatch<React.SetStateAction<string[]>>;
  channel: RealtimeChannel | null;
  setChannel: React.Dispatch<React.SetStateAction<RealtimeChannel | null>>;
  drawPile: CardInstance[];
  setDrawPile: React.Dispatch<React.SetStateAction<CardInstance[]>>;
  discardPile: CardInstance[];
  setDiscardPile: React.Dispatch<React.SetStateAction<CardInstance[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  winner: string | null;
  setWinner: React.Dispatch<React.SetStateAction<string | null>>;
  direction: 1 | -1;
  setDirection: React.Dispatch<React.SetStateAction<1 | -1>>;
  deadPlayers: string[];
  setDeadPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  turnsLeft: number;
  setTurnsLeft: React.Dispatch<React.SetStateAction<number>>;
  isDefusing: boolean;
  setIsDefusing: React.Dispatch<React.SetStateAction<boolean>>;
  drawnBomb: CardInstance | null;
  setDrawnBomb: React.Dispatch<React.SetStateAction<CardInstance | null>>;
  peekedCards: CardInstance[] | null;
  setPeekedCards: React.Dispatch<React.SetStateAction<CardInstance[] | null>>;
  targetSelectMode: 
    "favor" | "combo2" | "combo3" | "combo5" | "targeted-attack" | null
  ;
  setTargetSelectMode: React.Dispatch<React.SetStateAction<
    "favor" | "combo2" | "combo3" | "combo5" | "targeted-attack" | null
  >>;
  combo2Target: string | null;
  setCombo2Target: React.Dispatch<React.SetStateAction<string | null>>;
  selectedHandCards: CardInstance[];
  setSelectedHandCards: React.Dispatch<React.SetStateAction<CardInstance[]>>;
  pendingComboCards: CardInstance[];
  setPendingComboCards: React.Dispatch<React.SetStateAction<CardInstance[]>>;
  favorRequest: {
    from: string;
    to: string;
  } | null;
  setFavorRequest: React.Dispatch<React.SetStateAction<{
    from: string;
    to: string;
  } | null>>;
  actionLog: string[];
  setActionLog: React.Dispatch<React.SetStateAction<string[]>>;
  isShuffling: boolean;
  setIsShuffling: React.Dispatch<React.SetStateAction<boolean>>;
  pendingAction: {
    id: string;
    player: string;
    cardType: string;
    playedCards: CardInstance[];
    targetPlayer: string | null;
    targetCardId: string | null;
    requestedType: CardType | null;
    nopeCount: number;
  } | null;
  setPendingAction: React.Dispatch<React.SetStateAction<{
    id: string;
    player: string;
    cardType: string;
    playedCards: CardInstance[];
    targetPlayer: string | null;
    targetCardId: string | null;
    requestedType: CardType | null;
    nopeCount: number;
  } | null>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  localEndTime: number | null;
  setLocalEndTime: React.Dispatch<React.SetStateAction<number | null>>;
  bombAlert: {
    message: string;
    type: "defusing" | "exploded";
  } | null;
  setBombAlert: React.Dispatch<React.SetStateAction<{
    message: string;
    type: "defusing" | "exploded";
  } | null>>;
  isAlteringFuture: boolean;
  setIsAlteringFuture: React.Dispatch<React.SetStateAction<boolean>>;
  alterCards: CardInstance[];
  setAlterCards: React.Dispatch<React.SetStateAction<CardInstance[]>>;
  isPlacingImplodingKitten: boolean;
  setIsPlacingImplodingKitten: React.Dispatch<React.SetStateAction<boolean>>;
  handlePlaySelected: (...args: any[]) => void;
  handleReorderHand: (newHand: CardInstance[]) => void;
}



const ExplodingKittensContext = createContext<ExplodingKittensContextType | undefined>(undefined);


const generateId = () => Math.random().toString(36).substring(2, 10);
const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

export const useExplodingKittens = () => {
  const context = useContext(ExplodingKittensContext);
  if (!context) throw new Error("useExplodingKittens must be used within ExplodingKittensProvider");
  return context;
};

export const ExplodingKittensProvider: React.FC<{
  children: React.ReactNode;
  roomId: string | null;
  playerName: string;
  requestedRole: "player" | "spectator";
  hasInitialized: boolean;
  isCreator: boolean;
}> = ({ children, roomId, playerName, requestedRole, hasInitialized, isCreator }) => {

  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Multiplayer States
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);


  // Game Logic States (To be expanded)
  const [playerHands, setPlayerHands] = useState<
    Record<string, CardInstance[]>
  >({});
  const [drawPile, setDrawPile] = useState<CardInstance[]>([]);
  const [discardPile, setDiscardPile] = useState<CardInstance[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const myHand = playerHands[playerName] || [];

  // Advanced Game Logic States
  const [deadPlayers, setDeadPlayers] = useState<string[]>([]);
  const [turnsLeft, setTurnsLeft] = useState<number>(1);
  const [isDefusing, setIsDefusing] = useState<boolean>(false);
  const [drawnBomb, setDrawnBomb] = useState<CardInstance | null>(null);
  const [peekedCards, setPeekedCards] = useState<CardInstance[] | null>(null);
  const [targetSelectMode, setTargetSelectMode] = useState<
    "favor" | "combo2" | "combo3" | "combo5" | "targeted-attack" | null
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
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [localEndTime, setLocalEndTime] = useState<number | null>(null);
  const [bombAlert, setBombAlert] = useState<{
    message: string;
    type: "defusing" | "exploded";
  } | null>(null);
  const [isAlteringFuture, setIsAlteringFuture] = useState<boolean>(false);
  const [alterCards, setAlterCards] = useState<CardInstance[]>([]);
  const [isPlacingImplodingKitten, setIsPlacingImplodingKitten] =
    useState<boolean>(false);

  useEffect(() => {
    if (bombAlert) {
      const timer = setTimeout(() => {
        setBombAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bombAlert]);

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
    direction,
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
      direction,
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
    direction,
    actionLog,
    favorRequest,
    pendingAction,
  ]);

  // Realtime channel setup
  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      setPlayers([playerName]);
      stateRef.current.hostName = playerName;
      stateRef.current.players = [playerName];
    }

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
        if (data.direction !== undefined) setDirection(data.direction);
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
        if (data.direction !== undefined) setDirection(data.direction);
        if (data.actionLog !== undefined) setActionLog(data.actionLog);
        if (data.favorRequest !== undefined) setFavorRequest(data.favorRequest);
        if (data.pendingAction !== undefined)
          setPendingAction(data.pendingAction);
        if (data.bombAlert !== undefined) {
          setBombAlert(data.bombAlert);
        }
      })
      .on("broadcast", { event: "resolve-action" }, (payload) => {
        const data = payload.payload;
        setPendingAction(null);
        setPlayerHands(data.playerHands);
        setDrawPile(data.drawPile);
        setDiscardPile(data.discardPile);
        setTurnsLeft(data.turnsLeft);
        setCurrentTurnIndex(data.currentTurnIndex);
        if (data.direction !== undefined) setDirection(data.direction);
        setActionLog(data.actionLog);
        setFavorRequest(data.favorRequest);
        if (data.deadPlayers) setDeadPlayers(data.deadPlayers);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.bombAlert !== undefined) setBombAlert(data.bombAlert);

        if (
          data.cardType === "see-the-future" &&
          !data.isNoped &&
          data.actionPlayer === playerName
        ) {
          setPeekedCards(data.drawPile.slice(-3).reverse());
        }

        if (
          data.cardType === "alter-the-future" &&
          !data.isNoped &&
          data.actionPlayer === playerName
        ) {
          setIsAlteringFuture(true);
          setAlterCards(data.drawPile.slice(-3).reverse());
        }

        if (data.drawnBombForPlayer === playerName && data.drawnBomb) {
          setIsDefusing(true);
          setDrawnBomb(data.drawnBomb);
        }
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setGameStarted(false);
        setReadyPlayers([]);
        setDrawPile([]);
        setDiscardPile([]);
        setPlayerHands({});
        setCurrentTurnIndex(0);
        setWinner(null);
        setDeadPlayers([]);
        setDirection(1);
        setTurnsLeft(1);
        setActionLog([]);
        setFavorRequest(null);
        setPendingAction(null);
        setCombo2Target(null);
        setSelectedHandCards([]);
        setPendingComboCards([]);
        setPeekedCards(null);
        setBombAlert(null);
        setIsAlteringFuture(false);
        setAlterCards([]);
        setIsPlacingImplodingKitten(false);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newPlayers = [...state.players];
          const newSpecs = [...state.spectators];
          const maxPlayers = 10; // Hỗ trợ Party Pack lên đến 10 người

          const isAlreadyPlayer = newPlayers.includes(newPlayer);
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (state.gameStarted) {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason:
                      "Trò chơi đang diễn ra, bạn không thể tham gia với tư cách Người chơi (hãy chọn Người xem)!",
                  },
                });
                return;
              }
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
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error(payload.payload.reason || "Không thể tham gia phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
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
  }, [roomId, playerName, hasInitialized, requestedRole]);

  const getNextAlivePlayerIndexState = (
    currentIndex: number,
    playersList: string[],
    deadList: string[],
    currentDirection: 1 | -1,
  ) => {
    let nextIndex = currentIndex;
    let count = 0;
    do {
      nextIndex =
        (nextIndex + currentDirection + playersList.length) %
        playersList.length;
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
    let newDirection = state.direction;
    let newDrawPile = [...state.drawPile];
    const newPlayerHands = { ...state.playerHands };
    const newDiscardPile = [...state.discardPile];
    let newFavorRequest = state.favorRequest;
    const newDeadPlayers = [...state.deadPlayers];
    let newWinner = state.winner;
    let newBombAlert: {
      message: string;
      type: "defusing" | "exploded";
    } | null = null;
    let drawnBombForPlayer: string | null = null;
    let drawnBomb: CardInstance | null = null;

    if (isNoped) {
      newLog.unshift(`Hành động của ${player} đã bị NOPE hủy bỏ!`);
    } else {
      if (cardType === "attack") {
        newLog.unshift(`${player} đánh lá Attack.`);
        newTurnsLeft = (state.turnsLeft || 1) + 1;
        nextTurnIdx = getNextAlivePlayerIndexState(
          state.currentTurnIndex,
          state.players,
          state.deadPlayers,
          state.direction,
        );
      } else if (cardType === "targeted-attack" && targetPlayer) {
        newLog.unshift(
          `${player} đánh lá Targeted Attack chỉ định ${targetPlayer}.`,
        );
        newTurnsLeft = (state.turnsLeft || 1) + 1;
        const targetIdx = state.players.indexOf(targetPlayer);
        nextTurnIdx =
          targetIdx !== -1 && !state.deadPlayers.includes(targetPlayer)
            ? targetIdx
            : getNextAlivePlayerIndexState(
                state.currentTurnIndex,
                state.players,
                state.deadPlayers,
                state.direction,
              );
      } else if (cardType === "reverse") {
        newLog.unshift(`${player} đánh lá Reverse.`);
        newDirection = (state.direction * -1) as 1 | -1;
        newTurnsLeft -= 1;
        if (newTurnsLeft <= 0) {
          newTurnsLeft = 1;
          nextTurnIdx = getNextAlivePlayerIndexState(
            state.currentTurnIndex,
            state.players,
            state.deadPlayers,
            newDirection,
          );
        }
      } else if (cardType === "skip") {
        newLog.unshift(`${player} đánh lá Skip.`);
        newTurnsLeft -= 1;
        if (newTurnsLeft <= 0) {
          newTurnsLeft = 1;
          nextTurnIdx = getNextAlivePlayerIndexState(
            state.currentTurnIndex,
            state.players,
            state.deadPlayers,
            state.direction,
          );
        }
      } else if (cardType === "shuffle") {
        newLog.unshift(`${player} đánh lá Shuffle.`);
        newDrawPile = shuffleArray(state.drawPile);
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
      } else if (cardType === "alter-the-future") {
        newLog.unshift(`${player} đánh lá Alter the Future.`);
        if (player === playerName) {
          setIsAlteringFuture(true);
          setAlterCards(newDrawPile.slice(-3).reverse());
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
            `${player} dùng bộ 3 gọi lá ${CARD_DEFINITIONS[requestedType].name} từ ${targetPlayer} nhưng đối thủ không có nên mất luôn chức năng.`,
          );
        }
      } else if (cardType === "combo5" && targetCardId) {
        if (targetCardId === "draw_from_pile") {
          let cardToGive: CardInstance | null = null;
          if (newDrawPile.length > 0) {
            const safeIndex = [...newDrawPile]
              .reverse()
              .findIndex(
                (c) =>
                  c.type !== "exploding-kitten" &&
                  c.type !== "imploding-kitten",
              );
            if (safeIndex !== -1) {
              const actualIndex = newDrawPile.length - 1 - safeIndex;
              cardToGive = newDrawPile.splice(actualIndex, 1)[0];
            } else {
              cardToGive = newDrawPile.pop()!;
            }
            if (cardToGive) {
              newPlayerHands[player] = [
                ...(newPlayerHands[player] || []),
                cardToGive,
              ];
              newLog.unshift(
                `${player} dùng bộ 5 lá, nhưng bài bỏ không có Defuse nên được hệ thống lấy 1 lá an toàn từ chồng bài rút.`,
              );
            }
          }
        } else {
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
      } else if (cardType === "draw-from-bottom") {
        newLog.unshift(`${player} đánh lá Draw from Bottom.`);
        const bottomCard = newDrawPile.shift();
        if (bottomCard) {
          if (
            bottomCard.type === "exploding-kitten" ||
            bottomCard.type === "imploding-kitten"
          ) {
            const hasDefuse = newPlayerHands[player]?.some(
              (c) => c.type === "defuse",
            );
            if (hasDefuse) {
              drawnBombForPlayer = player;
              drawnBomb = bottomCard;
              const alertMsg = `${player} rút trúng Mèo Nổ từ đáy và đang Gỡ Bom!`;
              newBombAlert = { message: alertMsg, type: "defusing" };
              newLog.unshift(
                `${player} rút trúng Mèo Nổ từ đáy và đang dùng Defuse!`,
              );
            } else {
              const alertMsg = `${player} rút trúng Mèo Nổ từ đáy và NỔ TUNG!`;
              newBombAlert = { message: alertMsg, type: "exploded" };
              newDeadPlayers.push(player);
              newLog.unshift(
                `💥 BOOM! ${player} rút trúng Mèo Nổ từ đáy và đã nổ tung!`,
              );

              if (newDeadPlayers.length === state.players.length - 1) {
                newWinner =
                  state.players.find((p) => !newDeadPlayers.includes(p)) ||
                  null;
                if (newWinner)
                  newLog.unshift(`🏆 ${newWinner} giành chiến thắng!`);
              }
              nextTurnIdx = getNextAlivePlayerIndexState(
                state.currentTurnIndex,
                state.players,
                newDeadPlayers,
                state.direction,
              );
              newTurnsLeft = 1;
            }
          } else {
            newPlayerHands[player] = [
              ...(newPlayerHands[player] || []),
              bottomCard,
            ];
            newLog.unshift(
              `${player} đã rút lá dưới cùng và kết thúc lượt an toàn.`,
            );
            newTurnsLeft -= 1;
            if (newTurnsLeft <= 0) {
              newTurnsLeft = 1;
              nextTurnIdx = getNextAlivePlayerIndexState(
                state.currentTurnIndex,
                state.players,
                state.deadPlayers,
                state.direction,
              );
            }
          }
        }
      }
    }

    setPendingAction(null);
    setPlayerHands(newPlayerHands);
    setDrawPile(newDrawPile);
    setDiscardPile(newDiscardPile);
    setTurnsLeft(newTurnsLeft);
    setCurrentTurnIndex(nextTurnIdx);
    setDirection(newDirection);
    setActionLog(newLog);
    setFavorRequest(newFavorRequest);
    setDeadPlayers(newDeadPlayers);
    setWinner(newWinner);
    if (newBombAlert) setBombAlert(newBombAlert);

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
          direction: newDirection,
          actionLog: newLog,
          favorRequest: newFavorRequest,
          deadPlayers: newDeadPlayers,
          winner: newWinner,
          bombAlert: newBombAlert,
          drawnBombForPlayer,
          drawnBomb,
        },
      });
    }
  }, [channel, playerName]);

  useEffect(() => {
    if (pendingAction && hostName === playerName) {
      const timer = setTimeout(() => {
        resolvePendingAction();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pendingAction, hostName, playerName, resolvePendingAction]);

  useEffect(() => {
    if (pendingAction) {
      setLocalEndTime(Date.now() + 5000);
    } else {
      setLocalEndTime(null);
    }
  }, [pendingAction]);

  useEffect(() => {
    if (localEndTime) {
      const updateTimer = () => {
        const t = localEndTime - Date.now();
        setTimeLeft(Math.max(0, Math.ceil(t / 1000)));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 100);
      return () => clearInterval(interval);
    }
  }, [localEndTime]);

  // Hiệu ứng pháo hoa chúc mừng khi có người chiến thắng
  useEffect(() => {
    if (winner) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          zIndex: 9999,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          zIndex: 9999,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winner]);

  const handleDrawCard = () => {
    const state = stateRef.current;
    if (
      state.players[state.currentTurnIndex] !== playerName ||
      state.winner ||
      isDefusing ||
      state.deadPlayers.includes(playerName) ||
      state.favorRequest ||
      state.pendingAction
    )
      return;
    if (state.drawPile.length === 0) return;

    const newDrawPile = [...state.drawPile];
    const drawnCard = newDrawPile.pop()!;

    if (drawnCard.type === "imploding-kitten") {
      if (drawnCard.isFaceUp) {
        // Nổ tung ngay lập tức, không thể gỡ
        const alertMsg = `💥 BOOM! ${playerName} rút trúng Mèo Nổ Sập và NỔ TUNG!`;
        setBombAlert({ message: alertMsg, type: "exploded" });

        const newDeadPlayers = [...state.deadPlayers, playerName];
        const newLog = [
          `💥 BOOM! ${playerName} đã nổ tung vì Mèo Nổ Sập!`,
          ...state.actionLog,
        ];

        let newWinner: string | null = null;
        if (newDeadPlayers.length === state.players.length - 1) {
          newWinner =
            state.players.find((p) => !newDeadPlayers.includes(p)) || null;
          if (newWinner) newLog.unshift(`🏆 ${newWinner} giành chiến thắng!`);
        }

        const nextTurnIdx = getNextAlivePlayerIndexState(
          state.currentTurnIndex,
          state.players,
          newDeadPlayers,
          state.direction,
        );

        setDeadPlayers(newDeadPlayers);
        setDrawPile(newDrawPile); // Lá bài bị loại khỏi game
        setCurrentTurnIndex(nextTurnIdx);
        setTurnsLeft(1); // Reset lượt
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
              bombAlert: { message: alertMsg, type: "exploded" },
            },
          });
        }
      } else {
        // Lần đầu rút phải, đặt lại vào chồng bài
        setIsPlacingImplodingKitten(true);
        setDrawnBomb(drawnCard);
        setDrawPile(newDrawPile);

        const newLog = [
          `...${playerName} đã rút phải Mèo Nổ Sập! Họ phải đặt nó lại vào chồng bài...`,
          ...state.actionLog,
        ];
        setActionLog(newLog);
        if (channel)
          channel.send({
            type: "broadcast",
            event: "sync-game",
            payload: {
              drawPile: newDrawPile,
              actionLog: newLog,
            },
          });
      }
    } else if (drawnCard.type === "exploding-kitten") {
      const hasDefuse = state.playerHands[playerName]?.some(
        (c) => c.type === "defuse",
      );
      if (hasDefuse) {
        setIsDefusing(true);
        setDrawnBomb(drawnCard);
        setDrawPile(newDrawPile);

        const alertMsg = `${playerName} vừa rút trúng Mèo Nổ và đang Gỡ Bom!`;
        setBombAlert({ message: alertMsg, type: "defusing" });

        const newLog = [
          `${playerName} rút trúng Mèo Nổ và đang dùng Defuse!`,
          ...state.actionLog,
        ];
        setActionLog(newLog);
        if (channel)
          channel.send({
            type: "broadcast",
            event: "sync-game",
            payload: {
              drawPile: newDrawPile,
              actionLog: newLog,
              bombAlert: { message: alertMsg, type: "defusing" },
            },
          });
      } else {
        const alertMsg = `${playerName} rút trúng Mèo Nổ và NỔ TUNG!`;
        setBombAlert({ message: alertMsg, type: "exploded" });

        const newDeadPlayers = [...state.deadPlayers, playerName];
        const newLog = [
          `💥 BOOM! ${playerName} đã nổ tung!`,
          ...state.actionLog,
        ];

        let newWinner: string | null = null;
        if (newDeadPlayers.length === state.players.length - 1) {
          newWinner =
            state.players.find((p) => !newDeadPlayers.includes(p)) || null;
          if (newWinner) newLog.unshift(`🏆 ${newWinner} giành chiến thắng!`);
        }

        const nextTurnIdx = getNextAlivePlayerIndexState(
          state.currentTurnIndex,
          state.players,
          newDeadPlayers,
          state.direction,
        );

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
              bombAlert: { message: alertMsg, type: "exploded" },
            },
          });
        }
      }
    } else {
      const newHand = [...(state.playerHands[playerName] || []), drawnCard];
      const newPlayerHands = { ...state.playerHands, [playerName]: newHand };

      let newTurnsLeft = state.turnsLeft - 1;
      let nextTurnIdx = state.currentTurnIndex;

      if (newTurnsLeft <= 0) {
        newTurnsLeft = 1;
        nextTurnIdx = getNextAlivePlayerIndexState(
          state.currentTurnIndex,
          state.players,
          state.deadPlayers,
          state.direction,
        );
      }

      const newLog = [
        `${playerName} đã rút bài kết thúc lượt.`,
        ...state.actionLog,
      ];

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
      nextTurnIdx = getNextAlivePlayerIndexState(
        currentTurnIndex,
        players,
        deadPlayers,
        direction,
      );
    }

    const newLog = [
      `${playerName} đã giấu Mèo Nổ trở lại và kết thúc lượt.`,
      ...actionLog,
    ];

    setIsDefusing(false);
    setDrawnBomb(null);
    setPlayerHands(newPlayerHands);
    setBombAlert(null);
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
          bombAlert: null,
        },
      });
  };

  const handlePlaceImplodingKitten = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isPlacingImplodingKitten || !drawnBomb) return;

    const formData = new FormData(e.currentTarget);
    const indexFromTop = Number(formData.get("bombPosition") || 0);

    const implodingKittenToPlace: CardInstance = {
      ...drawnBomb,
      isFaceUp: true,
    };

    const newDrawPile = [...drawPile];
    newDrawPile.splice(
      newDrawPile.length - indexFromTop,
      0,
      implodingKittenToPlace,
    );

    // Lượt của người chơi kết thúc
    let newTurnsLeft = turnsLeft - 1;
    let nextTurnIdx = currentTurnIndex;
    if (newTurnsLeft <= 0) {
      newTurnsLeft = 1;
      nextTurnIdx = getNextAlivePlayerIndexState(
        currentTurnIndex,
        players,
        deadPlayers,
        direction,
      );
    }

    const newLog = [
      `${playerName} đã giấu Mèo Nổ Sập trở lại và kết thúc lượt.`,
      ...actionLog,
    ];

    setIsPlacingImplodingKitten(false);
    setDrawnBomb(null);
    setDrawPile(newDrawPile);
    setTurnsLeft(newTurnsLeft);
    setCurrentTurnIndex(nextTurnIdx);
    setActionLog(newLog);

    if (channel)
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
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
      pendingAction ||
      isPlacingImplodingKitten
    )
      return;
    if (
      card.type === "defuse" ||
      card.type === "exploding-kitten" ||
      card.type === "imploding-kitten"
    )
      return;

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
      "feral-cat",
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
        const types = selectedHandCards.map((c) => c.type);
        const nonFeralTypes = types.filter((t) => t !== "feral-cat");
        const isValidPair = types[0] === types[1] || nonFeralTypes.length <= 1;

        if (isValidPair) {
          setPendingComboCards(selectedHandCards);
          setTargetSelectMode("combo2");
        } else {
          toast.error(
            "Bộ đôi phải gồm 2 lá cùng loại (Mèo hoang có thể thay thế)!",
          );
        }
      } else if (selectedHandCards.length === 3) {
        const types = selectedHandCards.map((c) => c.type);
        const nonFeralTypes = types.filter((t) => t !== "feral-cat");
        const isValidTriple = new Set(nonFeralTypes).size <= 1;

        if (isValidTriple) {
          setPendingComboCards(selectedHandCards);
          setTargetSelectMode("combo3");
        } else {
          toast.error(
            "Bộ 3 phải gồm 3 lá cùng loại (Mèo hoang có thể thay thế)!",
          );
        }
      } else if (selectedHandCards.length === 5) {
        const types = selectedHandCards.map((c) => c.type);
        const nonFeralTypes = types.filter((t) => t !== "feral-cat");
        const isValidFive =
          nonFeralTypes.length === new Set(nonFeralTypes).size;

        if (isValidFive) {
          const hasDefuse = discardPile.some((c) => c.type === "defuse");
          if (hasDefuse) {
            setPendingComboCards(selectedHandCards);
            setTargetSelectMode("combo5");
          } else {
            setPendingComboCards(selectedHandCards);
            executeComboAction("combo5", null, null, "draw_from_pile");
          }
        } else {
          toast.error(
            "Bộ 5 lá phải có loại khác nhau hoàn toàn (Mèo hoang có thể thay thế)!",
          );
        }
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
    if (
      card.type === "defuse" ||
      card.type === "exploding-kitten" ||
      card.type === "imploding-kitten"
    )
      return;

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
      pendingAction ||
      isPlacingImplodingKitten
    )
      return;

    const cardIndex = myHand.findIndex((c) => c.id === card.id);
    const newHand = [...myHand];
    newHand.splice(cardIndex, 1);

    const newPlayerHands = { ...playerHands, [playerName]: newHand };
    const newDiscardPile = [...discardPile, card];

    if (
      [
        "attack",
        "skip",
        "shuffle",
        "see-the-future",
        "reverse",
        "alter-the-future",
        "draw-from-bottom",
      ].includes(card.type)
    ) {
      const pAction = {
        id: generateId(),
        player: playerName,
        cardType: card.type,
        playedCards: [card],
        targetPlayer: null,
        targetCardId: null,
        requestedType: null,
        nopeCount: 0,
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
    } else if (card.type === "favor" || card.type === "targeted-attack") {
      setTargetSelectMode(card.type);
      setPendingComboCards([card]);
      setSelectedHandCards([]);
    }
  };

  const handleReorderHand = (newHand: CardInstance[]) => {
    const newPlayerHands = { ...playerHands, [playerName]: newHand };
    setPlayerHands(newPlayerHands);
    // Note: We don't need to sync on every drag frame, 
    // but we can sync the new order to other players if desired.
    // For Exploding Kittens, hand order is only visible to the local player anyway.
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-game",
        payload: {
          playerHands: newPlayerHands,
        },
      });
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
      id: generateId(),
      player: playerName,
      cardType: comboType,
      playedCards: pendingComboCards,
      targetPlayer,
      targetCardId,
      requestedType,
      nopeCount: 0,
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

  const handleSelectTarget = (targetPlayer: string) => {
    const mode = targetSelectMode;
    setTargetSelectMode(null);

    if (mode === "favor") {
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
    }

    const card = pendingComboCards[0];
    const newHand = myHand.filter((c) => c.id !== card.id);
    const newDiscardPile = [...discardPile, card];
    const newPlayerHands = { ...playerHands, [playerName]: newHand };

    const pAction = {
      id: generateId(),
      player: playerName,
      cardType: mode as string,
      playedCards: [card],
      targetPlayer,
      targetCardId: null,
      requestedType: null,
      nopeCount: 0,
    };

    const actionText = mode === "favor" ? "Favor" : "Targeted Attack";
    const newLog = [
      `${playerName} muốn dùng ${actionText} lên ${targetPlayer}...`,
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

    // Give me 1 defuse and 7 random cards
    const myHand = initialHands[playerName];
    if (myHand) {
      const cardsToAdd = 8 - myHand.length; // Target 8 cards (1 defuse + 7 random)
      if (cardsToAdd > 0) {
        for (let i = 0; i < cardsToAdd; i++) {
          if (initialDrawPile.length > 0) {
            myHand.push(initialDrawPile.pop()!);
          }
        }
      }
    }

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
      direction: 1 as 1 | -1,
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
    setDirection(newGameState.direction);
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

  const handleResetGame = () => {
    if (playerName !== hostName) return;

    setGameStarted(false);
    setReadyPlayers([]);
    setDrawPile([]);
    setDiscardPile([]);
    setPlayerHands({});
    setCurrentTurnIndex(0);
    setWinner(null);
    setDeadPlayers([]);
    setTurnsLeft(1);
    setDirection(1);
    setActionLog([]);
    setFavorRequest(null);
    setPendingAction(null);
    setCombo2Target(null);
    setSelectedHandCards([]);
    setPendingComboCards([]);
    setPeekedCards(null);
    setBombAlert(null);
    setIsAlteringFuture(false);
    setAlterCards([]);
    setIsPlacingImplodingKitten(false);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "reset-game",
        payload: {},
      });
    }
  };

  
  const value: ExplodingKittensContextType = {
    playerHands,

    setPlayerHands,
    linkCopied,
    setLinkCopied,
    getNextAlivePlayerIndexState,

    executeComboAction,

    handleDrawCard,
    handlePlaceBomb,
    handlePlaceImplodingKitten,
    handlePlayNope,
    handleSelectTarget,
    handleGiveFavorCard,
    handleStartGame,
    handleResetGame,

    roomId,
    playerName,
    requestedRole,
    hasInitialized,
    isCreator,
    hostName,
    setHostName,
    players,
    setPlayers,
    gameStarted,
    setGameStarted,
    readyPlayers,
    setReadyPlayers,
    spectators,
    setSpectators,
    channel,
    setChannel,
    drawPile,
    setDrawPile,
    discardPile,
    setDiscardPile,
    currentTurnIndex,
    setCurrentTurnIndex,
    winner,
    setWinner,
    direction,
    setDirection,
    deadPlayers,
    setDeadPlayers,
    turnsLeft,
    setTurnsLeft,
    isDefusing,
    setIsDefusing,
    drawnBomb,
    setDrawnBomb,
    peekedCards,
    setPeekedCards,
    targetSelectMode,
    setTargetSelectMode,
    combo2Target,
    setCombo2Target,
    selectedHandCards,
    setSelectedHandCards,
    pendingComboCards,
    setPendingComboCards,
    favorRequest,
    setFavorRequest,
    actionLog,
    setActionLog,
    isShuffling,
    setIsShuffling,
    pendingAction,
    setPendingAction,
    timeLeft,
    setTimeLeft,
    localEndTime,
    setLocalEndTime,
    bombAlert,
    setBombAlert,
    isAlteringFuture,
    setIsAlteringFuture,
    alterCards,
    setAlterCards,
    isPlacingImplodingKitten,
    setIsPlacingImplodingKitten,
    handlePlaySelected,
    handlePlayCard,
    handleReorderHand,
  };

  return (
    <ExplodingKittensContext.Provider value={value}>
      {children}
    </ExplodingKittensContext.Provider>
  );
};
