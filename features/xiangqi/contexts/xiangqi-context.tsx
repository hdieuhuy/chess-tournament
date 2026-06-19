"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import {
  XiangqiContextValue,
  XiangqiHistory,
  Move,
} from "../types";
import { INITIAL_BOARD, INITIAL_TIME } from "../constants";
import { shuffleCoupBoard, isValidMove, isKingInCheck, hasValidMoves } from "../utils/game-logic";
import { useRouter } from "next/navigation";

const XiangqiContext = createContext<XiangqiContextValue | undefined>(undefined);

export function XiangqiProvider({
  children,
  roomId,
  playerName,
  requestedRole,
  isCreator,
  hasInitialized,
}: {
  children: ReactNode;
  roomId: string | null;
  playerName: string;
  requestedRole: "player" | "spectator";
  isCreator: boolean;
  hasInitialized: boolean;
}) {
  const router = useRouter();

  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [isRedTurn, setIsRedTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [captures, setCaptures] = useState<{ r: string[]; b: string[] }>({
    r: [],
    b: [],
  });
  const [gameMode, setGameMode] = useState<"1v1" | "2v2">("1v1");
  const [chessVariant, setChessVariant] = useState<"standard" | "coup">("standard");
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [history, setHistory] = useState<XiangqiHistory[]>([]);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [player3Name, setPlayer3Name] = useState<string | null>(null);
  const [player4Name, setPlayer4Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);
  const [initialTime, setInitialTime] = useState<number>(INITIAL_TIME);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isRedTurn,
    winner,
    lastMove,
    captures,
    gameMode,
    chessVariant,
    turnIndex,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      spectators,
      board,
      isRedTurn,
      winner,
      lastMove,
      captures,
      gameMode,
      chessVariant,
      turnIndex,
      history,
      undoRequestedBy,
      gameStarted,
      readyPlayers,
      player1Time,
      player2Time,
      initialTime,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isRedTurn,
    winner,
    lastMove,
    captures,
    gameMode,
    chessVariant,
    turnIndex,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
  ]);

  const currentStateForReview: XiangqiHistory = {
    board,
    isRedTurn,
    turnIndex,
    winner,
    lastMove,
    captures,
    player1Time,
    player2Time,
  };
  const fullHistory = [...history, currentStateForReview];
  const isInReview = reviewIndex !== null;
  const displayState =
    reviewIndex !== null && fullHistory[reviewIndex]
      ? fullHistory[reviewIndex]
      : currentStateForReview;

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      setPlayer1Name(playerName);
      stateRef.current.hostName = playerName;
      stateRef.current.player1Name = playerName;
    }

    const roomChannel = supabase.channel(`xiangqi-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { history: newHistory, ...data } = payload.payload;

        setBoard(data.board);
        setIsRedTurn(data.isRedTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.captures) setCaptures(data.captures);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(data.player1Time);
        setPlayer2Time(data.player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsRedTurn(true);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setCaptures({ r: [], b: [] });
        setTurnIndex(0);
        setHistory([]);
        setUndoRequestedBy(null);
        setGameStarted(false);
        setReadyPlayers([]);
        setReviewIndex(null);
        setPlayer1Time(stateRef.current.initialTime);
        setPlayer2Time(stateRef.current.initialTime);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer]
        );
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        if (payload.payload.board) {
          setBoard(payload.payload.board);
          stateRef.current.board = payload.payload.board;
        }
        setPlayer1Time(payload.payload.initialTime || INITIAL_TIME);
        setPlayer2Time(payload.payload.initialTime || INITIAL_TIME);
        setReviewIndex(null);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer =
            newPlayer === state.player1Name ||
            newPlayer === newP2 ||
            newPlayer === state.player3Name ||
            newPlayer === state.player4Name;
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
              hostName: state.hostName,
              player1Name: state.player1Name,
              player2Name: newP2,
              player3Name: state.player3Name,
              player4Name: state.player4Name,
              spectators: newSpecs,
              board: state.board,
              isRedTurn: state.isRedTurn,
              winner: state.winner,
              lastMove: state.lastMove,
              captures: state.captures,
              gameMode: state.gameMode,
              chessVariant: state.chessVariant,
              turnIndex: state.turnIndex,
              history: state.history,
              undoRequestedBy: state.undoRequestedBy,
              gameStarted: state.gameStarted,
              readyPlayers: state.readyPlayers,
              player1Time: state.player1Time,
              player2Time: state.player2Time,
              initialTime: state.initialTime,
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
        setIsRedTurn(data.isRedTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.captures) setCaptures(data.captures);
        if (data.gameMode !== undefined) setGameMode(data.gameMode);
        if (data.chessVariant !== undefined) setChessVariant(data.chessVariant);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined)
          setUndoRequestedBy(data.undoRequestedBy);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.initialTime !== undefined) setInitialTime(data.initialTime);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayer1Name((prev) => (prev === oldName ? newName : prev));
        setPlayer2Name((prev) => (prev === oldName ? newName : prev));
        setPlayer3Name((prev) => (prev === oldName ? newName : prev));
        setPlayer4Name((prev) => (prev === oldName ? newName : prev));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
        setReadyPlayers((prev) =>
          prev.map((p) => (p === oldName ? newName : p))
        );
      })
      .on("broadcast", { event: "join-rejected" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error(payload.payload.reason || "Không thể tham gia phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/xiangqi");
          setTimeout(() => { window.location.reload() }, 1000);
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/xiangqi");
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
              (p) => p !== reqPlayer
            );

            let newP1 =
              state.player1Name === reqPlayer ? null : state.player1Name;
            let newP2 =
              state.player2Name === reqPlayer ? null : state.player2Name;
            let newP3 =
              state.player3Name === reqPlayer ? null : state.player3Name;
            let newP4 =
              state.player4Name === reqPlayer ? null : state.player4Name;

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
                payload: {
                  ...stateRef.current,
                },
              });
            }
          } else {
            let newP1 = state.player1Name;
            let newP2 = state.player2Name;
            let newP3 = state.player3Name;
            let newP4 = state.player4Name;
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer
            );

            if (newP1 === reqPlayer) newP1 = null;
            if (newP2 === reqPlayer) newP2 = null;
            if (newP3 === reqPlayer) newP3 = null;
            if (newP4 === reqPlayer) newP4 = null;

            const newSpecs = [...state.spectators];
            if (!newSpecs.includes(reqPlayer)) newSpecs.push(reqPlayer);

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
              payload: {
                ...stateRef.current,
              },
            });
          }
        }
      })
      .on("broadcast", { event: "update-time" }, (payload) => {
        const { p1Time, p2Time } = payload.payload;
        setPlayer1Time(p1Time);
        setPlayer2Time(p2Time);
      })
      .on("broadcast", { event: "time-up" }, (payload) => {
        const { winner: timeoutWinner } = payload.payload;
        setWinner(timeoutWinner);
      })
      .on("broadcast", { event: "request-undo" }, (payload) => {
        setUndoRequestedBy(payload.payload.playerName);
      })
      .on("broadcast", { event: "accept-undo" }, () => {
        const h = stateRef.current.history;
        if (h.length > 0) {
          const prevState = h[h.length - 1];
          setBoard(prevState.board);
          setIsRedTurn(prevState.isRedTurn);
          setTurnIndex(prevState.turnIndex);
          setLastMove(prevState.lastMove);
          setCaptures(prevState.captures);
          setPlayer1Time(prevState.player1Time);
          setPlayer2Time(prevState.player2Time);
          const newHistory = h.slice(0, -1);
          setHistory(newHistory);
          stateRef.current.board = prevState.board;
          stateRef.current.isRedTurn = prevState.isRedTurn;
          stateRef.current.turnIndex = prevState.turnIndex;
          stateRef.current.lastMove = prevState.lastMove;
          stateRef.current.captures = prevState.captures;
          stateRef.current.history = newHistory;
        }
        setUndoRequestedBy(null);
      })
      .on("broadcast", { event: "reject-undo" }, () => {
        setUndoRequestedBy(null);
        if (stateRef.current.undoRequestedBy === playerName) {
          toast.error("Đối thủ không đồng ý cho đi lại!");
        }
      })
      .on("broadcast", { event: "resign" }, (payload) => {
        const { player } = payload.payload;
        const resignerIsRed =
          player === stateRef.current.player1Name ||
          player === stateRef.current.player3Name;
        setWinner(resignerIsRed ? "b" : "r");
      });

    roomChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        if (!isCreator) {
          roomChannel.send({
            type: "broadcast",
            event: "request-join",
            payload: { playerName, requestedRole },
          });
        }
      }
    });

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, playerName, hasInitialized, isCreator, requestedRole, router]);

  useEffect(() => {
    if (!gameStarted || winner || !roomId) return;
    const interval = setInterval(() => {
      if (isRedTurn) {
        setPlayer1Time((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            supabase.channel(`xiangqi-room-${roomId}`).send({
              type: "broadcast",
              event: "time-up",
              payload: { winner: "b" },
            });
            setWinner("b");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setPlayer2Time((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            supabase.channel(`xiangqi-room-${roomId}`).send({
              type: "broadcast",
              event: "time-up",
              payload: { winner: "r" },
            });
            setWinner("r");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, winner, isRedTurn, roomId]);

  useEffect(() => {
    if (gameStarted && !winner && roomId) {
      if (playerName === hostName) {
        supabase.channel(`xiangqi-room-${roomId}`).send({
          type: "broadcast",
          event: "update-time",
          payload: { p1Time: player1Time, p2Time: player2Time },
        });
      }
    }
  }, [player1Time, player2Time, gameStarted, winner, roomId, playerName, hostName]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator || isInReview) return;

      const expectedPlayer =
        gameMode === "2v2"
          ? turnIndex === 0
            ? player1Name
            : turnIndex === 1
              ? player2Name
              : turnIndex === 2
                ? player3Name
                : player4Name
          : isRedTurn
            ? player1Name
            : player2Name;

      if (playerName !== expectedPlayer) return;

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        if (fr === r && fc === c) {
          setSelectedPos(null);
          return;
        }

        const currentTurn = isRedTurn ? "r" : "b";
        if (isValidMove(board, fr, fc, r, c, currentTurn, chessVariant)) {
          const newBoard = board.map((row) => [...row]);
          const piece = board[fr][fc];
          const target = board[r][c];

          let isRedTarget = false;
          if (target) {
            const tIsFaceDown = target.startsWith("?");
            isRedTarget = tIsFaceDown
              ? target[1] === target[1].toUpperCase()
              : target === target.toUpperCase();
          }

          const isFaceDown = piece!.startsWith("?");
          const movingPiece = isFaceDown ? piece![1] : piece;

          newBoard[r][c] = movingPiece;
          newBoard[fr][fc] = null;

          const newCaptures = { r: [...captures.r], b: [...captures.b] };
          if (target) {
            if (isRedTarget) newCaptures.b.push(target);
            else newCaptures.r.push(target);
          }

          let newWinner = null;
          if (target === "K") newWinner = "b";
          else if (target === "k") newWinner = "r";
          else {
            const opponentHasMoves = hasValidMoves(newBoard, !isRedTurn, chessVariant);
            if (!opponentHasMoves) {
              newWinner = isRedTurn ? "r" : "b";
            }
          }

          const h: XiangqiHistory = {
            board,
            isRedTurn,
            turnIndex,
            winner,
            lastMove,
            captures,
            player1Time,
            player2Time,
          };

          const newTurnIndex =
            gameMode === "2v2" ? (turnIndex + 1) % 4 : (turnIndex + 1) % 2;

          setBoard(newBoard);
          setIsRedTurn(!isRedTurn);
          setSelectedPos(null);
          setLastMove({ from: [fr, fc], to: [r, c] });
          setCaptures(newCaptures);
          setWinner(newWinner);
          setTurnIndex(newTurnIndex);
          setHistory((prev) => [...prev, h]);

          supabase.channel(`xiangqi-room-${roomId}`).send({
            type: "broadcast",
            event: "sync-move",
            payload: {
              board: newBoard,
              isRedTurn: !isRedTurn,
              winner: newWinner,
              lastMove: { from: [fr, fc], to: [r, c] },
              captures: newCaptures,
              turnIndex: newTurnIndex,
              history: [...history, h],
              player1Time,
              player2Time,
            },
          });
        } else {
          const target = board[r][c];
          if (target) {
            const tIsFaceDown = target.startsWith("?");
            const isRedTarget = tIsFaceDown
              ? target[1] === target[1].toUpperCase()
              : target === target.toUpperCase();
            if (isRedTarget === isRedTurn) {
              setSelectedPos([r, c]);
            } else {
              setSelectedPos(null);
            }
          } else {
            setSelectedPos(null);
          }
        }
      } else {
        const piece = board[r][c];
        if (piece) {
          const isFaceDown = piece.startsWith("?");
          const isRed = isFaceDown
            ? piece[1] === piece[1].toUpperCase()
            : piece === piece.toUpperCase();
          if (isRed === isRedTurn) setSelectedPos([r, c]);
        }
      }
    },
    [
      board,
      isRedTurn,
      winner,
      gameStarted,
      isSpectator,
      isInReview,
      gameMode,
      turnIndex,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      playerName,
      selectedPos,
      chessVariant,
      captures,
      lastMove,
      player1Time,
      player2Time,
      history,
      roomId,
    ]
  );

  const resetGame = useCallback(() => {
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "reset-game",
    });
    setBoard(INITIAL_BOARD);
    setIsRedTurn(true);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setCaptures({ r: [], b: [] });
    setTurnIndex(0);
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setReviewIndex(null);
    setPlayer1Time(stateRef.current.initialTime);
    setPlayer2Time(stateRef.current.initialTime);
  }, [roomId]);

  const handleKickPlayer = useCallback(
    (targetName: string) => {
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "kick-player",
        payload: { playerName: targetName },
      });
    },
    [roomId]
  );

  const handleSlotClick = useCallback(
    (slot: number) => {
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player", targetSlot: slot },
      });
    },
    [roomId, playerName]
  );

  const handleBecomeSpectator = useCallback(() => {
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "request-role-change",
      payload: { playerName, newRole: "spectator" },
    });
  }, [roomId, playerName]);

  const handleChangeGameMode = useCallback(
    (mode: "1v1" | "2v2") => {
      if (playerName !== hostName || gameStarted) return;
      let newMode = mode;
      if (
        mode === "1v1" &&
        (stateRef.current.player3Name || stateRef.current.player4Name)
      ) {
        newMode = "2v2";
      }
      setGameMode(newMode);
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current, gameMode: newMode },
      });
    },
    [playerName, hostName, gameStarted, roomId]
  );

  const handleChangeVariant = useCallback(
    (variant: "standard" | "coup") => {
      if (playerName !== hostName || gameStarted) return;
      setChessVariant(variant);
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "room-sync",
        payload: { ...stateRef.current, chessVariant: variant },
      });
    },
    [playerName, hostName, gameStarted, roomId]
  );

  const handleTimeChange = useCallback(
    (seconds: number) => {
      if (playerName !== hostName || gameStarted) return;
      setInitialTime(seconds);
      setPlayer1Time(seconds);
      setPlayer2Time(seconds);
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "room-sync",
        payload: {
          ...stateRef.current,
          initialTime: seconds,
          player1Time: seconds,
          player2Time: seconds,
        },
      });
    },
    [playerName, hostName, gameStarted, roomId]
  );

  const handleStartClick = useCallback(() => {
    if (isSpectator) return;
    if (readyPlayers.includes(playerName)) return;
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "player-ready",
      payload: { playerName },
    });
    setReadyPlayers((prev) => [...prev, playerName]);
    const requiredPlayers = gameMode === "1v1" ? 2 : 4;
    if (readyPlayers.length + 1 >= requiredPlayers) {
      let b = INITIAL_BOARD;
      if (chessVariant === "coup") b = shuffleCoupBoard();
      supabase.channel(`xiangqi-room-${roomId}`).send({
        type: "broadcast",
        event: "game-start",
        payload: { board: b, initialTime: stateRef.current.initialTime },
      });
      setGameStarted(true);
      setBoard(b);
      setPlayer1Time(stateRef.current.initialTime);
      setPlayer2Time(stateRef.current.initialTime);
    }
  }, [isSpectator, readyPlayers, playerName, roomId, gameMode, chessVariant]);

  const handleRequestUndo = useCallback(() => {
    if (history.length < 2 || isSpectator || winner) return;
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "request-undo",
      payload: { playerName },
    });
  }, [history.length, isSpectator, winner, roomId, playerName]);

  const handleAcceptUndo = useCallback(() => {
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "accept-undo",
    });
  }, [roomId]);

  const handleRejectUndo = useCallback(() => {
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "reject-undo",
    });
  }, [roomId]);

  const handleResign = useCallback(() => {
    if (winner || !gameStarted || isSpectator) return;
    const isPlayer1 = playerName === stateRef.current.player1Name;
    const isPlayer3 = playerName === stateRef.current.player3Name;
    const resignerIsRed = isPlayer1 || isPlayer3;
    const newWinner = resignerIsRed ? "b" : "r";
    setWinner(newWinner);
    
    supabase.channel(`xiangqi-room-${roomId}`).send({
      type: "broadcast",
      event: "resign",
      payload: { player: playerName },
    });
  }, [winner, gameStarted, isSpectator, roomId, playerName]);

  const validMoves = useMemo(() => {
    if (!selectedPos || isInReview || winner || !gameStarted || isSpectator) return [];
    const [fr, fc] = selectedPos;
    const moves: [number, number][] = [];
    const currentTurn = isRedTurn ? "r" : "b";
    
    const piece = board[fr][fc];
    if (!piece) return [];
    const isFaceDown = piece.startsWith("?");
    const isRed = isFaceDown ? piece[1] === piece[1].toUpperCase() : piece === piece.toUpperCase();
    if ((isRed && currentTurn === "b") || (!isRed && currentTurn === "r")) return [];
    if (isRed !== isRedTurn) return [];

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (isValidMove(board, fr, fc, r, c, currentTurn, chessVariant)) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  }, [selectedPos, board, isRedTurn, isInReview, winner, gameStarted, isSpectator, chessVariant]);

  const inCheck = useMemo(() => {
    if (!gameStarted || winner) return null;
    if (isKingInCheck(displayState.board, true, chessVariant)) return "r";
    if (isKingInCheck(displayState.board, false, chessVariant)) return "b";
    return null;
  }, [displayState.board, gameStarted, winner, chessVariant]);

  return (
    <XiangqiContext.Provider
      value={{
        roomId,
        playerName,
        hostName,
        player1Name,
        player2Name,
        player3Name,
        player4Name,
        spectators,
        board,
        isRedTurn,
        winner,
        lastMove,
        captures,
        gameMode,
        chessVariant,
        turnIndex,
        history,
        undoRequestedBy,
        gameStarted,
        readyPlayers,
        player1Time,
        player2Time,
        isPlayer1,
        isPlayer2,
        isSpectator,
        selectedPos,
        validMoves,
        inCheck,
        reviewIndex,
        isInReview,
        displayState,
        initialTime,
        handleCellClick,
        resetGame,
        handleKickPlayer,
        handleSlotClick,
        handleBecomeSpectator,
        handleChangeGameMode,
        handleChangeVariant,
        handleTimeChange,
        handleStartClick,
        handleRequestUndo,
        handleAcceptUndo,
        handleRejectUndo,
        handleResign,
        setReviewIndex,
        setSelectedPos,
      }}
    >
      {children}
    </XiangqiContext.Provider>
  );
}

export function useXiangqi() {
  const context = useContext(XiangqiContext);
  if (context === undefined) {
    throw new Error("useXiangqi must be used within a XiangqiProvider");
  }
  return context;
}
