"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { GomokuState, GameMode } from "../types";
import { createEmptyBoard, BOARD_SIZE } from "../constants";
import { checkWinner } from "../utils/game-logic";
import toast from "react-hot-toast";

interface GomokuContextValue extends GomokuState {
  roomId: string | null;
  playerName: string;
  isSpectator: boolean;
  elapsedTime: number;
  handleCellClick: (row: number, col: number) => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2 | 3 | 4) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleStartClick: () => void;
  handleResign: () => void;
  handleChangeGameMode: (mode: GameMode) => void;
}

const GomokuContext = createContext<GomokuContextValue | undefined>(undefined);

export function GomokuProvider({
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
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [isBlackNext, setIsBlackNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCells, setWinningCells] = useState<number[][]>([]);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("1v1");
  const [turnIndex, setTurnIndex] = useState<number>(0);

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [player3Name, setPlayer3Name] = useState<string | null>(null);
  const [player4Name, setPlayer4Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isBlackNext,
    winner,
    winningCells,
    lastMove,
    history,
    undoRequestedBy,
    gameStartTime,
    gameStarted,
    readyPlayers,
    gameMode,
    player3Name,
    player4Name,
    turnIndex,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      isBlackNext,
      winner,
      winningCells,
      lastMove,
      history,
      undoRequestedBy,
      gameStartTime,
      gameStarted,
      readyPlayers,
      gameMode,
      player3Name,
      player4Name,
      turnIndex,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isBlackNext,
    winner,
    winningCells,
    lastMove,
    history,
    undoRequestedBy,
    gameStartTime,
    gameStarted,
    readyPlayers,
    gameMode,
    player3Name,
    player4Name,
    turnIndex,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      setPlayer1Name(playerName);
      stateRef.current.hostName = playerName;
      stateRef.current.player1Name = playerName;
    }

    const roomChannel = supabase.channel(`gomoku-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const data = payload.payload;
        setBoard(data.board);
        setIsBlackNext(data.isBlackNext);
        setWinner(data.winner);
        if (data.winningCells !== undefined) setWinningCells(data.winningCells);
        setLastMove(data.lastMove);
        if (data.history) setHistory(data.history);
        setUndoRequestedBy(null);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        if (data.gameStartTime) setGameStartTime(data.gameStartTime);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(createEmptyBoard());
        setIsBlackNext(true);
        setWinner(null);
        setWinningCells([]);
        setLastMove(null);
        setGameStartTime(null);
        setElapsedTime(0);
        setGameStarted(false);
        setReadyPlayers([]);
        setTurnIndex(0);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer],
        );
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        setGameStartTime(payload.payload.gameStartTime);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer =
            newPlayer === state.player1Name || newPlayer === newP2;
          const isAlreadySpec =
            newSpecs.includes(newPlayer) ||
            newPlayer === state.player3Name ||
            newPlayer === state.player4Name;

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (!state.player1Name) {
                setPlayer1Name(newPlayer);
                stateRef.current.player1Name = newPlayer;
              } else if (!newP2) {
                newP2 = newPlayer;
                setPlayer2Name(newP2);
                stateRef.current.player2Name = newP2;
              } else if (state.gameMode === "2v2" && !state.player3Name) {
                setPlayer3Name(newPlayer);
                stateRef.current.player3Name = newPlayer;
              } else if (state.gameMode === "2v2" && !state.player4Name) {
                setPlayer4Name(newPlayer);
                stateRef.current.player4Name = newPlayer;
              } else {
                if (newSpecs.length < 10) {
                  newSpecs.push(newPlayer);
                  setSpectators(newSpecs);
                  stateRef.current.spectators = newSpecs;
                  
                  roomChannel.send({
                    type: "broadcast",
                    event: "force-spectator",
                    payload: { playerName: newPlayer }
                  });
                } else {
                  roomChannel.send({
                    type: "broadcast",
                    event: "join-rejected",
                    payload: {
                      playerName: newPlayer,
                      reason:
                        state.gameMode === "2v2"
                          ? "Phòng đã đủ 4 người chơi và khán giả!"
                          : "Phòng đã đủ 2 người chơi và khán giả!",
                    },
                  });
                  return;
                }
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
              player2Name: newP2,
              spectators: newSpecs,
              readyPlayers: [],
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        if (data.player3Name !== undefined) setPlayer3Name(data.player3Name);
        if (data.player4Name !== undefined) setPlayer4Name(data.player4Name);
        setSpectators(data.spectators);
        setBoard(data.board);
        setIsBlackNext(data.isBlackNext);
        setWinner(data.winner);
        if (data.winningCells) setWinningCells(data.winningCells);
        setLastMove(data.lastMove);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined)
          setUndoRequestedBy(data.undoRequestedBy);
        if (data.gameStartTime !== undefined)
          setGameStartTime(data.gameStartTime);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.gameMode !== undefined) setGameMode(data.gameMode);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayer1Name((prev) => (prev === oldName ? newName : prev));
        setPlayer2Name((prev) => (prev === oldName ? newName : prev));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setPlayer3Name((prev) => (prev === oldName ? newName : prev));
        setPlayer4Name((prev) => (prev === oldName ? newName : prev));
        setReadyPlayers((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/gomoku");
          setTimeout(() => { window.location.reload() }, 1000);
        }
      })
      .on("broadcast", { event: "force-spectator" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.success("Phòng đã đủ người chơi, bạn được xếp vào khán giả!");
          localStorage.setItem(`joinedRoom_${roomId}`, "spectator");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole, targetSlot } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player") {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer,
            );

            let newP1 = state.player1Name === reqPlayer ? null : state.player1Name;
            let newP2 = state.player2Name === reqPlayer ? null : state.player2Name;
            let newP3 = state.player3Name === reqPlayer ? null : state.player3Name;
            let newP4 = state.player4Name === reqPlayer ? null : state.player4Name;

            let success = false;

            if (targetSlot === 1 && !newP1) {
              newP1 = reqPlayer;
              success = true;
            } else if (targetSlot === 2 && !newP2) {
              newP2 = reqPlayer;
              success = true;
            } else if (targetSlot === 3 && state.gameMode === "2v2" && !newP3) {
              newP3 = reqPlayer;
              success = true;
            } else if (targetSlot === 4 && state.gameMode === "2v2" && !newP4) {
              newP4 = reqPlayer;
              success = true;
            }

            if (!success && !targetSlot) {
              if (!newP1) {
                newP1 = reqPlayer;
                success = true;
              } else if (!newP2) {
                newP2 = reqPlayer;
                success = true;
              } else if (state.gameMode === "2v2" && !newP3) {
                newP3 = reqPlayer;
                success = true;
              } else if (state.gameMode === "2v2" && !newP4) {
                newP4 = reqPlayer;
                success = true;
              }
            }

            if (success) {
              setPlayer1Name(newP1);
              setPlayer2Name(newP2);
              setPlayer3Name(newP3);
              setPlayer4Name(newP4);
              setSpectators(newSpecs);
              setReadyPlayers(newReadyPlayers);

              stateRef.current.player1Name = newP1;
              stateRef.current.player2Name = newP2;
              stateRef.current.player3Name = newP3;
              stateRef.current.player4Name = newP4;
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
            const newP3 = state.player3Name === reqPlayer ? null : state.player3Name;
            const newP4 = state.player4Name === reqPlayer ? null : state.player4Name;
            const newSpecs = [...state.spectators];
            if (!newSpecs.includes(reqPlayer)) {
              newSpecs.push(reqPlayer);
            }
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer,
            );

            setPlayer1Name(newP1);
            setPlayer2Name(newP2);
            setPlayer3Name(newP3);
            setPlayer4Name(newP4);
            setSpectators(newSpecs);
            setReadyPlayers(newReadyPlayers);

            stateRef.current.player1Name = newP1;
            stateRef.current.player2Name = newP2;
            stateRef.current.player3Name = newP3;
            stateRef.current.player4Name = newP4;
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
        let newP3 = state.player3Name;
        let newP4 = state.player4Name;
        if (newP1 === leavingPlayer) newP1 = null;
        if (newP2 === leavingPlayer) newP2 = null;
        if (newP3 === leavingPlayer) newP3 = null;
        if (newP4 === leavingPlayer) newP4 = null;

        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);
        const newReadyPlayers = state.readyPlayers.filter(
          (p) => p !== leavingPlayer,
        );

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newP1 || newP2 || newP3 || newP4 || newSpecs[0] || null;
        }

        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setPlayer3Name(newP3);
        setPlayer4Name(newP4);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);
        setHostName(newHostName);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.player3Name = newP3;
        stateRef.current.player4Name = newP4;
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
      .on("broadcast", { event: "request-undo" }, (payload) => {
        setUndoRequestedBy(payload.payload.playerName);
      })
      .on("broadcast", { event: "reject-undo" }, () => {
        const state = stateRef.current;
        if (playerName === state.undoRequestedBy) {
          toast.error("Đối thủ đã từ chối yêu cầu đi lại.");
        }
        setUndoRequestedBy(null);
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
    const p3Ready =
      gameMode === "1v1" || (player3Name && readyPlayers.includes(player3Name));
    const p4Ready =
      gameMode === "1v1" || (player4Name && readyPlayers.includes(player4Name));

    if (
      p1Ready &&
      p2Ready &&
      p3Ready &&
      p4Ready &&
      (gameMode === "1v1" || (player3Name && player4Name))
    ) {
      if (playerName === hostName) {
        const startTime = Date.now();
        setGameStarted(true);
        setGameStartTime(startTime);
        channel.send({
          type: "broadcast",
          event: "game-start",
          payload: { gameStartTime: startTime },
        });
      }
    }
  }, [
    readyPlayers,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    gameMode,
    gameStarted,
    playerName,
    hostName,
    channel,
  ]);

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

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (board[row][col] || winner || !gameStarted || isSpectator) return;

      const expectedPlayer =
        gameMode === "2v2"
          ? turnIndex === 0
            ? player1Name
            : turnIndex === 1
              ? player2Name
              : turnIndex === 2
                ? player3Name
                : player4Name
          : isBlackNext
            ? player1Name
            : player2Name;
      if (playerName !== expectedPlayer) return;

      const currentState = {
        board: stateRef.current.board,
        isBlackNext: stateRef.current.isBlackNext,
        winner: stateRef.current.winner,
        winningCells: stateRef.current.winningCells,
        lastMove: stateRef.current.lastMove,
      };
      const newHistory = [...stateRef.current.history, currentState];
      setHistory(newHistory);

      const currentPlayer = isBlackNext ? "B" : "W";
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = currentPlayer;

      const winCells = checkWinner(newBoard, row, col, currentPlayer);
      const nextTurnIndex = (turnIndex + 1) % (gameMode === "2v2" ? 4 : 2);
      const nextTurn = nextTurnIndex % 2 === 0;
      const newWinner = winCells ? currentPlayer : null;
      const newWinningCells = winCells ? winCells : [];

      setBoard(newBoard);
      setIsBlackNext(nextTurn);
      setTurnIndex(nextTurnIndex);
      setWinner(newWinner);
      setWinningCells(newWinningCells);
      setLastMove([row, col]);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isBlackNext: nextTurn,
            turnIndex: nextTurnIndex,
            winner: newWinner,
            winningCells: newWinningCells,
            lastMove: [row, col],
            history: newHistory,
            gameStartTime: gameStartTime,
          },
        });
      }
    },
    [
      board,
      isBlackNext,
      winner,
      channel,
      gameStartTime,
      isSpectator,
      gameStarted,
      gameMode,
      turnIndex,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      playerName,
    ]
  );

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setIsBlackNext(true);
    setWinner(null);
    setWinningCells([]);
    setLastMove(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStartTime(null);
    setElapsedTime(0);
    setGameStarted(false);
    setReadyPlayers([]);
    setTurnIndex(0);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleChangeGameMode = (mode: GameMode) => {
    if (playerName !== hostName || gameStarted) return;

    const newSpecs = [...spectators];
    let newP3 = player3Name;
    let newP4 = player4Name;
    let newReadyPlayers = [...readyPlayers];

    if (mode === "1v1") {
      if (newP3) {
        newSpecs.push(newP3);
        newReadyPlayers = newReadyPlayers.filter((p) => p !== newP3);
        newP3 = null;
      }
      if (newP4) {
        newSpecs.push(newP4);
        newReadyPlayers = newReadyPlayers.filter((p) => p !== newP4);
        newP4 = null;
      }
    }

    setGameMode(mode);
    setPlayer3Name(newP3);
    setPlayer4Name(newP4);
    setSpectators(newSpecs);
    setReadyPlayers(newReadyPlayers);

    stateRef.current.gameMode = mode;
    stateRef.current.player3Name = newP3;
    stateRef.current.player4Name = newP4;
    stateRef.current.spectators = newSpecs;
    stateRef.current.readyPlayers = newReadyPlayers;

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if (
      (targetName === player1Name ||
        targetName === player2Name ||
        targetName === player3Name ||
        targetName === player4Name) &&
      gameStarted && !winner
    )
      return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    if (targetName === player2Name) {
      setPlayer2Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) resetGame();
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player2Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
          },
        });
      }, 50);
    } else if (targetName === player3Name) {
      setPlayer3Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) resetGame();
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player3Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
          },
        });
      }, 50);
    } else if (targetName === player4Name) {
      setPlayer4Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) resetGame();
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player4Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
          },
        });
      }, 50);
    } else if (spectators.includes(targetName)) {
      const newSpecs = spectators.filter((s) => s !== targetName);
      setSpectators(newSpecs);
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current, spectators: newSpecs },
      });
    }
  };

  const handleSlotClick = (targetSlot: 1 | 2 | 3 | 4) => {
    if (!channel || (gameStarted && !winner)) return;
    if (targetSlot === 1 && player1Name) return;
    if (targetSlot === 2 && player2Name) return;
    if (targetSlot === 3 && player3Name) return;
    if (targetSlot === 4 && player4Name) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newSpecs = state.spectators.filter((s) => s !== playerName);
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);

      let newP1 = state.player1Name === playerName ? null : state.player1Name;
      let newP2 = state.player2Name === playerName ? null : state.player2Name;
      let newP3 = state.player3Name === playerName ? null : state.player3Name;
      let newP4 = state.player4Name === playerName ? null : state.player4Name;

      let success = false;

      if (targetSlot === 1 && !newP1) {
        newP1 = playerName;
        success = true;
      } else if (targetSlot === 2 && !newP2) {
        newP2 = playerName;
        success = true;
      } else if (targetSlot === 3 && state.gameMode === "2v2" && !newP3) {
        newP3 = playerName;
        success = true;
      } else if (targetSlot === 4 && state.gameMode === "2v2" && !newP4) {
        newP4 = playerName;
        success = true;
      }

      if (success) {
        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setPlayer3Name(newP3);
        setPlayer4Name(newP4);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.player3Name = newP3;
        stateRef.current.player4Name = newP4;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReadyPlayers;

        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: { ...stateRef.current },
        });
      }
    } else {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player", targetSlot },
      });
    }
  };

  const handleBecomeSpectator = () => {
    if (!channel || (gameStarted && !winner)) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newP1 = state.player1Name === playerName ? null : state.player1Name;
      const newP2 = state.player2Name === playerName ? null : state.player2Name;
      const newP3 = state.player3Name === playerName ? null : state.player3Name;
      const newP4 = state.player4Name === playerName ? null : state.player4Name;
      const newSpecs = [...state.spectators];
      if (!newSpecs.includes(playerName)) {
        newSpecs.push(playerName);
      }
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);

      setPlayer1Name(newP1);
      setPlayer2Name(newP2);
      setPlayer3Name(newP3);
      setPlayer4Name(newP4);
      setSpectators(newSpecs);
      setReadyPlayers(newReadyPlayers);

      stateRef.current.player1Name = newP1;
      stateRef.current.player2Name = newP2;
      stateRef.current.player3Name = newP3;
      stateRef.current.player4Name = newP4;
      stateRef.current.spectators = newSpecs;
      stateRef.current.readyPlayers = newReadyPlayers;

      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current },
      });
    } else {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "spectator" },
      });
    }
  };

  const handleRequestUndo = () => {
    if (channel && !isSpectator) {
      setUndoRequestedBy(playerName);
      channel.send({
        type: "broadcast",
        event: "request-undo",
        payload: { playerName },
      });
    }
  };

  const handleAcceptUndo = () => {
    const state = stateRef.current;
    if (state.history.length > 0 && channel) {
      let targetIndex = state.history.length - 1;
      const requesterTurn = state.player1Name === state.undoRequestedBy || state.player3Name === state.undoRequestedBy; // B

      while (targetIndex >= 0) {
        if (state.history[targetIndex].isBlackNext === requesterTurn) {
          break;
        }
        targetIndex--;
      }

      if (targetIndex < 0) {
        toast.error("Không có nước cờ nào của bạn để đi lại.");
        setUndoRequestedBy(null);
        channel.send({
          type: "broadcast",
          event: "reject-undo",
          payload: {},
        });
        return;
      }

      const prevState = state.history[targetIndex];
      const newHistory = state.history.slice(0, targetIndex);

      setBoard(prevState.board);
      setIsBlackNext(prevState.isBlackNext);
      setWinner(prevState.winner);
      if (prevState.winningCells) setWinningCells(prevState.winningCells);
      setLastMove(prevState.lastMove);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isBlackNext: prevState.isBlackNext,
          winner: prevState.winner,
          winningCells: prevState.winningCells,
          lastMove: prevState.lastMove,
          history: newHistory,
          gameStartTime: state.gameStartTime,
        },
      });
    }
  };

  const handleRejectUndo = () => {
    setUndoRequestedBy(null);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "reject-undo",
        payload: {},
      });
    }
  };

  const handleStartClick = () => {
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

  const handleResign = () => {
    if (winner || !gameStarted || isSpectator) return;
    const myColor = (isPlayer1 || playerName === player3Name) ? "B" : "W";
    if (!myColor) return;

    const newWinner = myColor === "B" ? "W" : "B";
    setWinner(newWinner);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          ...stateRef.current,
          winner: newWinner,
        },
      });
    }
  };

  const value: GomokuContextValue = {
    roomId,
    playerName,
    isSpectator,
    elapsedTime,
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isBlackNext,
    winner,
    winningCells,
    lastMove,
    history,
    undoRequestedBy,
    gameStartTime,
    gameStarted,
    readyPlayers,
    gameMode,
    turnIndex,
    handleCellClick,
    resetGame,
    handleKickPlayer,
    handleSlotClick,
    handleBecomeSpectator,
    handleRequestUndo,
    handleAcceptUndo,
    handleRejectUndo,
    handleStartClick,
    handleResign,
    handleChangeGameMode,
  };

  return (
    <GomokuContext.Provider value={value}>
      {children}
    </GomokuContext.Provider>
  );
}

export function useGomoku() {
  const context = useContext(GomokuContext);
  if (context === undefined) {
    throw new Error("useGomoku must be used within a GomokuProvider");
  }
  return context;
}
