"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Cell, GamePhase, AnimationState } from "../types";
import { createInitialBoard, delay } from "../constants";

interface OAnQuanContextType {
  roomId: string;
  playerName: string;
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  spectators: string[];
  
  board: Cell[];
  isP1Turn: boolean;
  p1Score: number;
  p2Score: number;
  winner: string | null;
  
  readyPlayers: string[];
  gameStartTime: number | null;
  elapsedTime: number;
  
  isSpectator: boolean;
  gamePhase: GamePhase;
  
  animationState: AnimationState;
  
  handleReady: () => void;
  handleResign: () => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2) => void;
  handleBecomeSpectator: () => void;
  
  handleCellClick: (index: number) => void;
  handleDirectionSelect: (direction: "cw" | "ccw", startIndex?: number) => void;
  setSelectedCell: (index: number | null) => void;
}

const OAnQuanContext = createContext<OAnQuanContextType | undefined>(undefined);

export function OAnQuanProvider({
  children,
  roomId,
  playerName,
  requestedRole,
  isCreator,
  hasInitialized,
}: {
  children: ReactNode;
  roomId: string;
  playerName: string;
  requestedRole: "player" | "spectator";
  isCreator: boolean;
  hasInitialized: boolean;
}) {
  const router = useRouter();

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [board, setBoard] = useState<Cell[]>(createInitialBoard());
  const [isP1Turn, setIsP1Turn] = useState<boolean>(true);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);

  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Animation states
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [captureIndices, setCaptureIndices] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  let gamePhase: GamePhase = "waiting";
  if (winner) {
    gamePhase = "ended";
  } else if (gameStarted) {
    gamePhase = "playing";
  }

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isP1Turn,
    p1Score,
    p2Score,
    winner,
    readyPlayers,
    gameStartTime,
    gameStarted,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      isP1Turn,
      p1Score,
      p2Score,
      winner,
      readyPlayers,
      gameStartTime,
      gameStarted,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isP1Turn,
    p1Score,
    p2Score,
    winner,
    readyPlayers,
    gameStartTime,
    gameStarted,
  ]);

  const executeMoveAndAnimate = useCallback(async (startIndex: number, direction: "cw" | "ccw") => {
    setIsAnimating(true);
    setDropIndex(null);
    setCaptureIndices([]);
    const state = stateRef.current;
    const newBoard = state.board.map((c) => ({ ...c }));
    let currentIdx = startIndex;
    let stonesInHand = newBoard[currentIdx].stones;
    newBoard[currentIdx] = { ...newBoard[currentIdx], stones: 0 };

    let currentP1Score = state.p1Score;
    let currentP2Score = state.p2Score;
    const currentP1Turn = state.isP1Turn;
    let currentWinner = state.winner;

    setBoard([...newBoard]);
    await delay(300);

    const step = direction === "ccw" ? 1 : -1;
    const nextIndex = (i: number) => (i + step + 12) % 12;

    let isDistributing = true;

    while (isDistributing) {
      while (stonesInHand > 0) {
        currentIdx = nextIndex(currentIdx);
        newBoard[currentIdx] = {
          ...newBoard[currentIdx],
          stones: newBoard[currentIdx].stones + 1,
        };
        stonesInHand--;
        setBoard([...newBoard]);
        setDropIndex(currentIdx);
        await delay(300);
      }
      setDropIndex(null);

      const checkIdx = nextIndex(currentIdx);

      if (checkIdx === 5 || checkIdx === 11) {
        isDistributing = false;
      } else if (newBoard[checkIdx].stones > 0) {
        stonesInHand = newBoard[checkIdx].stones;
        newBoard[checkIdx] = { ...newBoard[checkIdx], stones: 0 };
        currentIdx = checkIdx;
        setBoard([...newBoard]);
        setDropIndex(currentIdx);
        await delay(300);
        setDropIndex(null);
      } else {
        isDistributing = false;

        let captureCheckIdx = checkIdx;
        let targetIdx = nextIndex(captureCheckIdx);

        while (
          newBoard[captureCheckIdx].stones === 0 &&
          (newBoard[targetIdx].stones > 0 || newBoard[targetIdx].quan > 0)
        ) {
          setCaptureIndices((prev) => [...prev, targetIdx]);
          await delay(300);

          const capturedStones = newBoard[targetIdx].stones;
          const capturedQuan = newBoard[targetIdx].quan;

          newBoard[targetIdx] = {
            ...newBoard[targetIdx],
            stones: 0,
            quan: 0,
          };

          const points = capturedStones + capturedQuan * 10;
          if (currentP1Turn) currentP1Score += points;
          else currentP2Score += points;

          setP1Score(currentP1Score);
          setP2Score(currentP2Score);
          setBoard([...newBoard]);
          setCaptureIndices([]);
          await delay(400);

          captureCheckIdx = nextIndex(targetIdx);
          targetIdx = nextIndex(captureCheckIdx);
        }
      }
    }

    const nextTurnIsP1 = !currentP1Turn;

    if (
      newBoard[5].quan === 0 &&
      newBoard[5].stones === 0 &&
      newBoard[11].quan === 0 &&
      newBoard[11].stones === 0
    ) {
      for (let i = 0; i < 5; i++) {
        currentP1Score += newBoard[i].stones;
        newBoard[i] = { ...newBoard[i], stones: 0 };
      }
      for (let i = 6; i < 11; i++) {
        currentP2Score += newBoard[i].stones;
        newBoard[i] = { ...newBoard[i], stones: 0 };
      }
      currentWinner =
        currentP1Score > currentP2Score
          ? "P1"
          : currentP1Score < currentP2Score
            ? "P2"
            : "Draw";
      setBoard([...newBoard]);
      setP1Score(currentP1Score);
      setP2Score(currentP2Score);
    } else {
      if (nextTurnIsP1) {
        const p1Stones = newBoard.slice(0, 5).reduce((sum, c) => sum + c.stones, 0);
        if (p1Stones === 0) {
          currentP1Score -= 5;
          for (let i = 0; i < 5; i++) newBoard[i] = { ...newBoard[i], stones: 1 };
          setBoard([...newBoard]);
          setP1Score(currentP1Score);
          await delay(400);
        }
      } else {
        const p2Stones = newBoard.slice(6, 11).reduce((sum, c) => sum + c.stones, 0);
        if (p2Stones === 0) {
          currentP2Score -= 5;
          for (let i = 6; i < 11; i++) newBoard[i] = { ...newBoard[i], stones: 1 };
          setBoard([...newBoard]);
          setP2Score(currentP2Score);
          await delay(400);
        }
      }
    }

    setBoard(newBoard);
    setP1Score(currentP1Score);
    setP2Score(currentP2Score);
    setIsP1Turn(nextTurnIsP1);
    setWinner(currentWinner);
    setSelectedCell(null);
    setIsAnimating(false);

    if (channel && playerName === stateRef.current.hostName) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: newBoard,
          isP1Turn: nextTurnIsP1,
          p1Score: currentP1Score,
          p2Score: currentP2Score,
          winner: currentWinner,
          gameStartTime: stateRef.current.gameStartTime,
        },
      });
    }
  }, [channel, playerName]);

  const executeMoveAndAnimateRef = useRef(executeMoveAndAnimate);
  useEffect(() => {
    executeMoveAndAnimateRef.current = executeMoveAndAnimate;
  }, [executeMoveAndAnimate]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      if (requestedRole === "player") setPlayer1Name(playerName);
      else setSpectators([playerName]);
    }

    const roomChannel = supabase.channel(`oanquan-room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const data = payload.payload;
        setBoard(data.board);
        setIsP1Turn(data.isP1Turn);
        setP1Score(data.p1Score);
        setP2Score(data.p2Score);
        setWinner(data.winner);
        setSelectedCell(null);
        if (data.gameStartTime) setGameStartTime(data.gameStartTime);
      })
      .on("broadcast", { event: "play-animation" }, (payload) => {
        const { startIndex, direction } = payload.payload;
        if (executeMoveAndAnimateRef.current) {
          executeMoveAndAnimateRef.current(startIndex, direction);
        }
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(createInitialBoard());
        setIsP1Turn(true);
        setP1Score(0);
        setP2Score(0);
        setWinner(null);
        setSelectedCell(null);
        setGameStarted(false);
        setReadyPlayers([]);
        setGameStartTime(null);
        setElapsedTime(0);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) => (prev.includes(readyPlayer) ? prev : [...prev, readyPlayer]));
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        setGameStartTime(payload.payload.gameStartTime);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP1 = state.player1Name;
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer = newPlayer === newP1 || newPlayer === newP2;
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (!newP1) {
                newP1 = newPlayer;
                setPlayer1Name(newP1);
                stateRef.current.player1Name = newP1;
              } else if (!newP2) {
                newP2 = newPlayer;
                setPlayer2Name(newP2);
                stateRef.current.player2Name = newP2;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Phòng đã đủ 2 người chơi, vui lòng tham gia với tư cách Người xem!",
                  },
                });
                return;
              }
            } else {
              if (newSpecs.length < 10) {
                newSpecs.push(newPlayer);
                setSpectators(newSpecs);
                stateRef.current.spectators = newSpecs;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Phòng đã đầy người xem!",
                  },
                });
                return;
              }
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: {
              ...stateRef.current,
              player1Name: newP1,
              player2Name: newP2,
              spectators: newSpecs,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        setSpectators(data.spectators || []);
        
        setBoard(data.board || createInitialBoard());
        if (data.isP1Turn !== undefined) setIsP1Turn(data.isP1Turn);
        if (data.p1Score !== undefined) setP1Score(data.p1Score);
        if (data.p2Score !== undefined) setP2Score(data.p2Score);
        setWinner(data.winner || null);
        
        if (data.gameStartTime !== undefined) setGameStartTime(data.gameStartTime);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
      })
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error(payload.payload.reason || "Không thể tham gia phòng!");
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          router.replace("/");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole, targetSlot } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player") {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            const newReadyPlayers = state.readyPlayers.filter((p) => p !== reqPlayer);

            let newP1 = state.player1Name === reqPlayer ? null : state.player1Name;
            let newP2 = state.player2Name === reqPlayer ? null : state.player2Name;

            let success = false;

            if (targetSlot === 1 && !newP1) {
              newP1 = reqPlayer;
              success = true;
            } else if (targetSlot === 2 && !newP2) {
              newP2 = reqPlayer;
              success = true;
            }

            if (!success && !targetSlot) {
              if (!newP1) {
                newP1 = reqPlayer;
                success = true;
              } else if (!newP2) {
                newP2 = reqPlayer;
                success = true;
              }
            }

            if (success) {
              setPlayer1Name(newP1);
              setPlayer2Name(newP2);
              setSpectators(newSpecs);
              setReadyPlayers(newReadyPlayers);

              stateRef.current.player1Name = newP1;
              stateRef.current.player2Name = newP2;
              stateRef.current.spectators = newSpecs;
              stateRef.current.readyPlayers = newReadyPlayers;

              roomChannel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current },
              });
            }
          } else if (newRole === "spectator") {
            const newP1 = state.player1Name === reqPlayer ? null : state.player1Name;
            const newP2 = state.player2Name === reqPlayer ? null : state.player2Name;
            const newSpecs = [...state.spectators];
            if (!newSpecs.includes(reqPlayer)) {
              newSpecs.push(reqPlayer);
            }
            const newReadyPlayers = state.readyPlayers.filter((p) => p !== reqPlayer);

            setPlayer1Name(newP1);
            setPlayer2Name(newP2);
            setSpectators(newSpecs);
            setReadyPlayers(newReadyPlayers);

            stateRef.current.player1Name = newP1;
            stateRef.current.player2Name = newP2;
            stateRef.current.spectators = newSpecs;
            stateRef.current.readyPlayers = newReadyPlayers;

            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current },
            });
          }
        }
      })
      .on("broadcast", { event: "leave-room" }, (payload) => {
        const state = stateRef.current;
        const leavingPlayer = payload.payload.playerName;

        let newP1 = state.player1Name;
        let newP2 = state.player2Name;
        if (newP1 === leavingPlayer) newP1 = null;
        if (newP2 === leavingPlayer) newP2 = null;

        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);
        const newReadyPlayers = state.readyPlayers.filter((p) => p !== leavingPlayer);

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newP1 || newP2 || newSpecs[0] || null;
        }

        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);
        setHostName(newHostName);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReadyPlayers;
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
        if (status === "SUBSCRIBED" && !isCreator) {
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
  }, [roomId, playerName, hasInitialized, isCreator, requestedRole, router]);

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
    if (gameStarted || !player1Name || !player2Name || !channel) return;

    const p1Ready = readyPlayers.includes(player1Name);
    const p2Ready = readyPlayers.includes(player2Name);

    if (p1Ready && p2Ready && playerName === hostName) {
      const startTime = Date.now();
      setGameStarted(true);
      setGameStartTime(startTime);
      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: { gameStartTime: startTime },
      });
    }
  }, [readyPlayers, player1Name, player2Name, gameStarted, playerName, hostName, channel]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStartTime && !winner) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStartTime, winner]);

  const handleReady = () => {
    if (gamePhase !== "waiting") return;
    if (!playerName || readyPlayers.includes(playerName)) return;
    setReadyPlayers((prev) => [...prev, playerName]);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-ready",
        payload: { playerName },
      });
    }
  };

  const handleCellClick = (index: number) => {
    if (isSpectator || !gameStarted || winner || isAnimating) return;

    const isMyTurn = (isPlayer1 && isP1Turn) || (isPlayer2 && !isP1Turn);
    if (!isMyTurn) return;

    const isMyCell =
      (isPlayer1 && index >= 0 && index <= 4) ||
      (isPlayer2 && index >= 6 && index <= 10);
    if (!isMyCell) return;

    if (board[index].stones === 0) return;

    setSelectedCell((prev) => (prev === index ? null : index));
  };

  const handleDirectionSelect = (direction: "cw" | "ccw", startIndex?: number) => {
    const activeIndex = startIndex ?? selectedCell;
    if (activeIndex === null || isAnimating) return;

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "play-animation",
        payload: { startIndex: activeIndex, direction },
      });
    }
    if (executeMoveAndAnimateRef.current) {
      executeMoveAndAnimateRef.current(activeIndex, direction);
    }
    setSelectedCell(null);
  };

  const handleResign = () => {
    if (!gameStarted || winner || isSpectator) return;
    const myColor = isPlayer1 ? "P1" : isPlayer2 ? "P2" : null;
    if (!myColor) return;

    const newWinner = myColor === "P1" ? "P2" : "P1";
    setWinner(newWinner);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: { ...stateRef.current, winner: newWinner },
      });
    }
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setIsP1Turn(true);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setSelectedCell(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setGameStartTime(null);
    setElapsedTime(0);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "reset-game",
        payload: {},
      });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName) return;
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "kick-player",
        payload: { playerName: targetName },
      });
      channel.send({
        type: "broadcast",
        event: "leave-room",
        payload: { playerName: targetName },
      });
    }
  };

  const handleSlotClick = (targetSlot: 1 | 2) => {
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player", targetSlot },
      });
    }
  };

  const handleBecomeSpectator = () => {
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "spectator" },
      });
    }
  };

  const value: OAnQuanContextType = {
    roomId,
    playerName,
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isP1Turn,
    p1Score,
    p2Score,
    winner,
    readyPlayers,
    gameStartTime,
    elapsedTime,
    isSpectator,
    gamePhase,
    animationState: {
      isAnimating,
      dropIndex,
      captureIndices,
      selectedCell,
    },
    handleReady,
    handleResign,
    resetGame,
    handleKickPlayer,
    handleSlotClick,
    handleBecomeSpectator,
    handleCellClick,
    handleDirectionSelect,
    setSelectedCell,
  };

  return (
    <OAnQuanContext.Provider value={value}>
      {children}
    </OAnQuanContext.Provider>
  );
}

export function useOAnQuan() {
  const context = useContext(OAnQuanContext);
  if (context === undefined) {
    throw new Error("useOAnQuan must be used within an OAnQuanProvider");
  }
  return context;
}
