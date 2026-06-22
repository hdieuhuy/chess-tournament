"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CheckersState } from "../types";
import { INITIAL_BOARD, INITIAL_TIME } from "../constants";
import { getValidMoves } from "../utils/game-logic";
import toast from "react-hot-toast";

interface CheckersContextValue extends CheckersState {
  roomId: string | null;
  playerName: string;
  isSpectator: boolean;
  selectedPos: [number, number] | null;
  validMoves: any[];
  handleCellClick: (row: number, col: number) => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleStartClick: () => void;
  handleResign: () => void;
}

const CheckersContext = createContext<CheckersContextValue | undefined>(undefined);

export function CheckersProvider({
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
  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [isBlackTurn, setIsBlackTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [multiJumpPiece, setMultiJumpPiece] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);
  
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
    isBlackTurn,
    winner,
    lastMove,
    multiJumpPiece,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      isBlackTurn,
      winner,
      lastMove,
      multiJumpPiece,
      history,
      undoRequestedBy,
      gameStarted,
      readyPlayers,
      player1Time,
      player2Time,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isBlackTurn,
    winner,
    lastMove,
    multiJumpPiece,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      setPlayer1Name(playerName);
      stateRef.current.hostName = playerName;
      stateRef.current.player1Name = playerName;
    }

    const roomChannel = supabase.channel(`checkers-room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { history: newHistory, ...data } = payload.payload;
        setBoard(data.board);
        setIsBlackTurn(data.isBlackTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        setMultiJumpPiece(data.multiJumpPiece !== undefined ? data.multiJumpPiece : null);
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(data.player1Time);
        setPlayer2Time(data.player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsBlackTurn(true);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setMultiJumpPiece(null);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
        setGameStarted(false);
        setReadyPlayers([]);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer],
        );
      })
      .on("broadcast", { event: "game-start" }, () => {
        setGameStarted(true);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer = newPlayer === state.player1Name || newPlayer === newP2;
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (!state.player1Name) {
                setPlayer1Name(newPlayer);
                stateRef.current.player1Name = newPlayer;
              } else if (!newP2) {
                newP2 = newPlayer;
                setPlayer2Name(newP2);
                stateRef.current.player2Name = newP2;
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
                      reason: "Phòng đã đủ 2 người chơi và khán giả!",
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
              player1Time: INITIAL_TIME,
              player2Time: INITIAL_TIME,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        setSpectators(data.spectators);
        setBoard(data.board);
        setIsBlackTurn(data.isBlackTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        setMultiJumpPiece(data.multiJumpPiece !== undefined ? data.multiJumpPiece : null);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined) setUndoRequestedBy(data.undoRequestedBy);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayer1Name((prev) => (prev === oldName ? newName : prev));
        setPlayer2Name((prev) => (prev === oldName ? newName : prev));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setReadyPlayers((prev) => prev.map((p) => (p === oldName ? newName : p)));
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/checkers");
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

    if (p1Ready && p2Ready) {
      if (playerName === hostName) {
        setGameStarted(true);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
        channel.send({
          type: "broadcast",
          event: "game-start",
          payload: {},
        });
      }
    }
  }, [readyPlayers, player1Name, player2Name, gameStarted, playerName, hostName, channel]);

  // Logic Đếm giờ
  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isBlackTurn) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("R"); // Red wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "R", player1Time: 0 },
              });
            }
            clearInterval(timer);
            return 0;
          }
          return t - 1;
        });
      } else {
        setPlayer2Time((t) => {
          if (t <= 1) {
            setWinner("B"); // Black wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "B", player2Time: 0 },
              });
            }
            clearInterval(timer);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, winner, isBlackTurn, channel, playerName, hostName]);

  const validMoves = getValidMoves(board, isBlackTurn, multiJumpPiece);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator) return;

      const myColor = isPlayer1 ? "B" : isPlayer2 ? "R" : null;
      const currentTurnColor = isBlackTurn ? "B" : "R";

      if (myColor !== currentTurnColor) return;

      const piece = board[r][c];
      const isMyPiece =
        piece &&
        (isBlackTurn
          ? piece === "b" || piece === "B"
          : piece === "r" || piece === "R");

      if (isMyPiece) {
        if (multiJumpPiece) {
          if (r === multiJumpPiece[0] && c === multiJumpPiece[1]) {
            setSelectedPos([r, c]);
          }
        } else {
          const hasMoves = validMoves.some((m) => m.from[0] === r && m.from[1] === c);
          if (hasMoves) {
            setSelectedPos([r, c]);
          }
        }
        return;
      }

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        const move = validMoves.find(
          (m) =>
            m.from[0] === fr &&
            m.from[1] === fc &&
            m.to[0] === r &&
            m.to[1] === c,
        );

        if (move) {
          const currentState = {
            board: stateRef.current.board,
            isBlackTurn: stateRef.current.isBlackTurn,
            winner: stateRef.current.winner,
            lastMove: stateRef.current.lastMove,
            multiJumpPiece: stateRef.current.multiJumpPiece,
            player1Time: stateRef.current.player1Time,
            player2Time: stateRef.current.player2Time,
          };
          const newHistory = [...stateRef.current.history, currentState];
          setHistory(newHistory);

          const newBoard = board.map((row) => [...row]);
          const p = newBoard[fr][fc] as string;
          newBoard[fr][fc] = null;
          newBoard[r][c] = p;

          if (move.jumped) {
            newBoard[move.jumped[0]][move.jumped[1]] = null;
          }

          let promoted = false;
          if (p === "b" && r === 0) {
            newBoard[r][c] = "B";
            promoted = true;
          } else if (p === "r" && r === 7) {
            newBoard[r][c] = "R";
            promoted = true;
          }

          let nextMultiJumpPiece: [number, number] | null = null;
          let nextIsBlackTurn = isBlackTurn;

          if (move.jumped && !promoted) {
            const furtherMoves = getValidMoves(newBoard, isBlackTurn, [r, c]);
            if (furtherMoves.length > 0 && furtherMoves[0].jumped) {
              nextMultiJumpPiece = [r, c];
              setSelectedPos([r, c]);
            } else {
              nextIsBlackTurn = !isBlackTurn;
              setSelectedPos(null);
            }
          } else {
            nextIsBlackTurn = !isBlackTurn;
            setSelectedPos(null);
          }

          const nextPlayerMoves = getValidMoves(newBoard, nextIsBlackTurn, nextMultiJumpPiece);
          let newWinner = null;
          if (nextPlayerMoves.length === 0) {
            newWinner = isBlackTurn ? "B" : "R";
          } else {
            const nextPlayerPiece = nextIsBlackTurn ? "b" : "r";
            const nextPlayerKing = nextIsBlackTurn ? "B" : "R";
            let hasPieces = false;
            for (let rr = 0; rr < 8; rr++) {
              for (let cc = 0; cc < 8; cc++) {
                if (
                  newBoard[rr][cc] === nextPlayerPiece ||
                  newBoard[rr][cc] === nextPlayerKing
                ) {
                  hasPieces = true;
                  break;
                }
              }
            }
            if (!hasPieces) {
              newWinner = isBlackTurn ? "B" : "R";
            }
          }

          setBoard(newBoard);
          setIsBlackTurn(nextIsBlackTurn);
          setMultiJumpPiece(nextMultiJumpPiece);
          setLastMove({ from: [fr, fc], to: [r, c] });
          if (newWinner) setWinner(newWinner);

          if (channel) {
            channel.send({
              type: "broadcast",
              event: "sync-move",
              payload: {
                board: newBoard,
                isBlackTurn: nextIsBlackTurn,
                multiJumpPiece: nextMultiJumpPiece,
                lastMove: { from: [fr, fc], to: [r, c] },
                winner: newWinner,
                history: newHistory,
                player1Time,
                player2Time,
              },
            });
          }
        } else {
          if (!multiJumpPiece) setSelectedPos(null);
        }
      }
    },
    [
      board,
      isBlackTurn,
      winner,
      channel,
      player1Name,
      player2Name,
      playerName,
      selectedPos,
      multiJumpPiece,
      isSpectator,
      gameStarted,
      validMoves,
      isPlayer1,
      isPlayer2,
      player1Time,
      player2Time,
    ]
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsBlackTurn(true);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setMultiJumpPiece(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlayer1Time(INITIAL_TIME);
    setPlayer2Time(INITIAL_TIME);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if ((targetName === player1Name || targetName === player2Name) && gameStarted && !winner) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    if (targetName === player1Name) {
      setPlayer1Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) resetGame();
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player1Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
          },
        });
      }, 50);
    } else if (targetName === player2Name) {
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

  const handleSlotClick = (targetSlot: 1 | 2) => {
    if (!channel || (gameStarted && !winner)) return;
    if (targetSlot === 1 && player1Name) return;
    if (targetSlot === 2 && player2Name) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newSpecs = state.spectators.filter((s) => s !== playerName);
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);

      let newP1 = state.player1Name === playerName ? null : state.player1Name;
      let newP2 = state.player2Name === playerName ? null : state.player2Name;

      let success = false;

      if (targetSlot === 1 && !newP1) {
        newP1 = playerName;
        success = true;
      } else if (targetSlot === 2 && !newP2) {
        newP2 = playerName;
        success = true;
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
      const newSpecs = [...state.spectators];
      if (!newSpecs.includes(playerName)) {
        newSpecs.push(playerName);
      }
      const newReadyPlayers = state.readyPlayers.filter((p) => p !== playerName);

      setPlayer1Name(newP1);
      setPlayer2Name(newP2);
      setSpectators(newSpecs);
      setReadyPlayers(newReadyPlayers);

      stateRef.current.player1Name = newP1;
      stateRef.current.player2Name = newP2;
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
      const prevState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      setBoard(prevState.board);
      setIsBlackTurn(prevState.isBlackTurn);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setMultiJumpPiece(prevState.multiJumpPiece);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setHistory(newHistory);
      setUndoRequestedBy(null);
      setSelectedPos(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isBlackTurn: prevState.isBlackTurn,
          winner: prevState.winner,
          lastMove: prevState.lastMove,
          multiJumpPiece: prevState.multiJumpPiece,
          player1Time: prevState.player1Time,
          player2Time: prevState.player2Time,
          history: newHistory,
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
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "R" : null;
    if (!myColor) return;

    const newWinner = myColor === "B" ? "R" : "B";
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

  const value: CheckersContextValue = {
    roomId,
    playerName,
    isSpectator,
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isBlackTurn,
    winner,
    lastMove,
    multiJumpPiece,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    selectedPos,
    validMoves,
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
  };

  return (
    <CheckersContext.Provider value={value}>
      {children}
    </CheckersContext.Provider>
  );
}

export function useCheckers() {
  const context = useContext(CheckersContext);
  if (context === undefined) {
    throw new Error("useCheckers must be used within a CheckersProvider");
  }
  return context;
}
