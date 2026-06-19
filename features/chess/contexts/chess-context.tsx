"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import {
  ChessContextValue,
  ChessHistory,
  CastlingRights,
  Move,
  PromotionPending,
  AnimatingMove,
} from "../types";
import { INITIAL_BOARD, INITIAL_TIME } from "../constants";
import { findKing, isAttacked, isLegalMove } from "../utils/game-logic";
import { useRouter } from "next/navigation";

const ChessContext = createContext<ChessContextValue | undefined>(undefined);

export function ChessProvider({
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
  const [isWhiteTurn, setIsWhiteTurn] = useState<boolean>(true);
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({
    wK: true,
    wQ: true,
    bK: true,
    bQ: true,
  });
  const [enPassantTarget, setEnPassantTarget] = useState<
    [number, number] | null
  >(null);
  const [captures, setCaptures] = useState<{ w: string[]; b: string[] }>({
    w: [],
    b: [],
  });
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [animatingMove, setAnimatingMove] = useState<AnimatingMove | null>(null);
  const [promotionPending, setPromotionPending] =
    useState<PromotionPending | null>(null);
  const [history, setHistory] = useState<ChessHistory[]>([]);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<"1v1" | "2v2">("1v1");
  const [turnIndex, setTurnIndex] = useState<number>(0);

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

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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
    isWhiteTurn,
    winner,
    castlingRights,
    enPassantTarget,
    captures,
    lastMove,
    history,
    gameMode,
    turnIndex,
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
      isWhiteTurn,
      winner,
      castlingRights,
      enPassantTarget,
      captures,
      lastMove,
      history,
      gameMode,
      turnIndex,
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
    isWhiteTurn,
    winner,
    castlingRights,
    enPassantTarget,
    captures,
    lastMove,
    history,
    gameMode,
    turnIndex,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
  ]);

  const currentStateForReview: ChessHistory = {
    board,
    isWhiteTurn,
    turnIndex,
    winner,
    castlingRights,
    enPassantTarget,
    captures,
    lastMove,
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

    const roomChannel = supabase.channel(`chess-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { history: newHistory, ...data } = payload.payload;

        if (data.lastMove) {
          const { from, to } = data.lastMove;
          const animId = Date.now().toString() + Math.random().toString();
          setAnimatingMove({
            id: animId,
            fr: from[0],
            fc: from[1],
            r: to[0],
            c: to[1],
          });
          setTimeout(() => {
            setAnimatingMove((prev) => (prev?.id === animId ? null : prev));
          }, 300);
        }

        setBoard(data.board);
        setIsWhiteTurn(data.isWhiteTurn);
        setWinner(data.winner);
        setCastlingRights(data.castlingRights);
        setEnPassantTarget(data.enPassantTarget);
        if (data.captures) setCaptures(data.captures);
        setLastMove(data.lastMove);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(data.player1Time);
        setPlayer2Time(data.player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsWhiteTurn(true);
        setWinner(null);
        setCastlingRights({ wK: true, wQ: true, bK: true, bQ: true });
        setEnPassantTarget(null);
        setCaptures({ w: [], b: [] });
        setTurnIndex(0);
        setSelectedPos(null);
        setLastMove(null);
        setPlayer1Time(stateRef.current.initialTime);
        setPlayer2Time(stateRef.current.initialTime);
        setGameStarted(false);
        setReadyPlayers([]);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer } = payload.payload;
        setReadyPlayers((prev) =>
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer]
        );
      })
      .on("broadcast", { event: "game-start" }, () => {
        setGameStarted(true);
        setPlayer1Time(stateRef.current.initialTime);
        setPlayer2Time(stateRef.current.initialTime);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer =
            newPlayer === state.player1Name || newPlayer === newP2 || newPlayer === state.player3Name || newPlayer === state.player4Name;
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (!newP2) {
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
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason:
                      state.gameMode === "2v2"
                        ? "Phòng đã đủ 4 người chơi!"
                        : "Phòng đã đủ 2 người chơi!",
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
              player2Name: newP2,
              spectators: newSpecs,
              readyPlayers: [],
              player1Time: state.gameStarted
                ? state.player1Time
                : state.initialTime,
              player2Time: state.gameStarted
                ? state.player2Time
                : state.initialTime,
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
        setIsWhiteTurn(data.isWhiteTurn);
        if (data.player3Name !== undefined) setPlayer3Name(data.player3Name);
        if (data.player4Name !== undefined) setPlayer4Name(data.player4Name);
        if (data.gameMode !== undefined) setGameMode(data.gameMode);
        if (data.turnIndex !== undefined) setTurnIndex(data.turnIndex);
        setWinner(data.winner);
        setCastlingRights(data.castlingRights);
        setEnPassantTarget(data.enPassantTarget);
        if (data.captures) setCaptures(data.captures);
        setLastMove(data.lastMove);
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
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer
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
            const newReadyPlayers = state.readyPlayers.filter((p) => p !== reqPlayer);

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
        const newReadyPlayers = state.readyPlayers.filter((p) => p !== leavingPlayer);

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
      .on("broadcast", { event: "change-time" }, (payload) => {
        setInitialTime(payload.payload.initialTime);
        setPlayer1Time(payload.payload.initialTime);
        setPlayer2Time(payload.payload.initialTime);
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
  }, [roomId, playerName, hasInitialized, requestedRole, router]);

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
    const p3Ready = gameMode === "1v1" || (player3Name && readyPlayers.includes(player3Name));
    const p4Ready = gameMode === "1v1" || (player4Name && readyPlayers.includes(player4Name));

    if (
      p1Ready &&
      p2Ready &&
      p3Ready &&
      p4Ready &&
      (gameMode === "1v1" || (player3Name && player4Name))
    ) {
      if (playerName === hostName) {
        setGameStarted(true);
        setPlayer1Time(initialTime);
        setPlayer2Time(initialTime);
        channel.send({
          type: "broadcast",
          event: "game-start",
          payload: {},
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
    initialTime,
  ]);

  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isWhiteTurn) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("B"); // Black wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "B", player1Time: 0 },
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
            setWinner("W"); // White wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "W", player2Time: 0 },
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
  }, [gameStarted, winner, isWhiteTurn, channel, playerName, hostName]);

  const executeMove = useCallback(
    (
      newBoard: (string | null)[][],
      newEpTarget: [number, number] | null,
      newCastlingRights: CastlingRights,
      newCaptures: { w: string[]; b: string[] },
      fr: number,
      fc: number,
      r: number,
      c: number
    ) => {
      const animId = Date.now().toString() + Math.random().toString();
      setAnimatingMove({ id: animId, fr, fc, r, c });
      setTimeout(() => {
        setAnimatingMove((prev) => (prev?.id === animId ? null : prev));
      }, 300);

      const currentState: ChessHistory = {
        board: stateRef.current.board,
        isWhiteTurn: stateRef.current.isWhiteTurn,
        turnIndex: stateRef.current.turnIndex,
        winner: stateRef.current.winner,
        castlingRights: stateRef.current.castlingRights,
        enPassantTarget: stateRef.current.enPassantTarget,
        captures: stateRef.current.captures,
        lastMove: stateRef.current.lastMove,
        player1Time: stateRef.current.player1Time,
        player2Time: stateRef.current.player2Time,
      };
      const newHistory = [...stateRef.current.history, currentState];
      setHistory(newHistory);

      const nextTurnIndex =
        (stateRef.current.turnIndex + 1) %
        (stateRef.current.gameMode === "2v2" ? 4 : 2);
      const nextTurn = nextTurnIndex % 2 === 0;

      let opponentHasValidMove = false;
      for (let tr = 0; tr < 8 && !opponentHasValidMove; tr++) {
        for (let tc = 0; tc < 8 && !opponentHasValidMove; tc++) {
          const op = newBoard[tr][tc];
          if (op && (op === op.toUpperCase()) === nextTurn) {
            for (let t_r = 0; t_r < 8 && !opponentHasValidMove; t_r++) {
              for (let t_c = 0; t_c < 8 && !opponentHasValidMove; t_c++) {
                if (
                  isLegalMove(
                    newBoard,
                    tr,
                    tc,
                    t_r,
                    t_c,
                    newEpTarget,
                    nextTurn,
                    newCastlingRights
                  )
                ) {
                  opponentHasValidMove = true;
                }
              }
            }
          }
        }
      }

      let newWinner = null;
      if (!opponentHasValidMove) {
        const oppKingPos = findKing(newBoard, nextTurn);
        const inCheck =
          oppKingPos &&
          isAttacked(
            newBoard,
            oppKingPos[0],
            oppKingPos[1],
            !nextTurn,
            newEpTarget
          );
        newWinner = inCheck ? (isWhiteTurn ? "W" : "B") : "Draw";
      }

      setBoard(newBoard);
      setIsWhiteTurn(nextTurn);
      setTurnIndex(nextTurnIndex);
      setWinner(newWinner);
      setCastlingRights(newCastlingRights);
      setEnPassantTarget(newEpTarget);
      setCaptures(newCaptures);
      setSelectedPos(null);
      setLastMove({ from: [fr, fc], to: [r, c] });

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isWhiteTurn: nextTurn,
            turnIndex: nextTurnIndex,
            winner: newWinner,
            castlingRights: newCastlingRights,
            enPassantTarget: newEpTarget,
            captures: newCaptures,
            lastMove: { from: [fr, fc], to: [r, c] },
            history: newHistory,
            player1Time: player1Time,
            player2Time: player2Time,
          },
        });
      }
    },
    [isWhiteTurn, channel, player1Time, player2Time]
  );

  const handlePromotionSelect = useCallback(
    (promotedPiece: string) => {
      if (!promotionPending) return;
      const {
        r,
        c,
        fr,
        fc,
        board: pBoard,
        epTarget,
        castlingRights,
        captures: pCaptures,
      } = promotionPending;
      const newBoard = pBoard.map((row) => [...row]);
      newBoard[r][c] = promotedPiece;

      setPromotionPending(null);
      executeMove(newBoard, epTarget, castlingRights, pCaptures, fr, fc, r, c);
    },
    [promotionPending, executeMove]
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator || promotionPending || isInReview) return;

      const expectedPlayer =
        gameMode === "2v2"
          ? turnIndex === 0
            ? player1Name
            : turnIndex === 1
            ? player2Name
            : turnIndex === 2
            ? player3Name
            : player4Name
          : isWhiteTurn
          ? player1Name
          : player2Name;

      if (playerName !== expectedPlayer) return;

      const myColor = isPlayer1 || playerName === player3Name ? "W" : "B";

      const piece = board[r][c];
      const isWhitePiece = piece ? piece === piece.toUpperCase() : null;

      if (
        piece &&
        ((myColor === "W" && isWhitePiece) || (myColor === "B" && !isWhitePiece))
      ) {
        setSelectedPos([r, c]);
        return;
      }

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        if (
          isLegalMove(
            board,
            fr,
            fc,
            r,
            c,
            enPassantTarget,
            isWhiteTurn,
            castlingRights
          )
        ) {
          const newBoard = board.map((row) => [...row]);
          let capturedPiece = board[r][c];
          const p = board[fr][fc] as string;
          newBoard[r][c] = p;
          newBoard[fr][fc] = null;

          let newEpTarget: [number, number] | null = null;
          const newCastlingRights = { ...castlingRights };

          // En Passant
          if (p.toLowerCase() === "p" && Math.abs(c - fc) === 1 && !board[r][c]) {
            newBoard[fr][c] = null;
            capturedPiece = isWhiteTurn ? "p" : "P";
          }
          if (p.toLowerCase() === "p" && Math.abs(r - fr) === 2) {
            newEpTarget = [(r + fr) / 2, fc];
          }

          const newCaptures = { w: [...captures.w], b: [...captures.b] };
          if (capturedPiece) {
            if (isWhiteTurn) newCaptures.w.push(capturedPiece);
            else newCaptures.b.push(capturedPiece);
          }

          // Castling logic (Di chuyển xe)
          if (p.toLowerCase() === "k" && Math.abs(c - fc) === 2) {
            if (c === 6) {
              newBoard[r][5] = newBoard[r][7];
              newBoard[r][7] = null;
            } else if (c === 2) {
              newBoard[r][3] = newBoard[r][0];
              newBoard[r][0] = null;
            }
          }

          // Cập nhật Castling Rights
          if (p === "K") {
            newCastlingRights.wK = false;
            newCastlingRights.wQ = false;
          }
          if (p === "k") {
            newCastlingRights.bK = false;
            newCastlingRights.bQ = false;
          }
          if (p === "R" && fr === 7 && fc === 0) newCastlingRights.wQ = false;
          if (p === "R" && fr === 7 && fc === 7) newCastlingRights.wK = false;
          if (p === "r" && fr === 0 && fc === 0) newCastlingRights.bQ = false;
          if (p === "r" && fr === 0 && fc === 7) newCastlingRights.bK = false;

          if (board[r][c] === "R" && r === 7 && c === 0) newCastlingRights.wQ = false;
          if (board[r][c] === "R" && r === 7 && c === 7) newCastlingRights.wK = false;
          if (board[r][c] === "r" && r === 0 && c === 0) newCastlingRights.bQ = false;
          if (board[r][c] === "r" && r === 0 && c === 7) newCastlingRights.bK = false;

          // Phong cấp
          if ((p === "P" && r === 0) || (p === "p" && r === 7)) {
            setPromotionPending({
              r,
              c,
              fr,
              fc,
              board: newBoard,
              epTarget: newEpTarget,
              castlingRights: newCastlingRights,
              captures: newCaptures,
              color: isWhiteTurn ? "W" : "B",
            });
            return;
          }

          executeMove(newBoard, newEpTarget, newCastlingRights, newCaptures, fr, fc, r, c);
        } else {
          setSelectedPos(null);
        }
      }
    },
    [
      board,
      isWhiteTurn,
      winner,
      channel,
      player1Name,
      player2Name,
      player3Name,
      player4Name,
      gameMode,
      turnIndex,
      playerName,
      selectedPos,
      isSpectator,
      castlingRights,
      enPassantTarget,
      captures,
      gameStarted,
      promotionPending,
      executeMove,
      isInReview,
      isPlayer1
    ]
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsWhiteTurn(true);
    setWinner(null);
    setCastlingRights({ wK: true, wQ: true, bK: true, bQ: true });
    setEnPassantTarget(null);
    setCaptures({ w: [], b: [] });
    setSelectedPos(null);
    setLastMove(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setPromotionPending(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlayer1Time(initialTime);
    setPlayer2Time(initialTime);
    setTurnIndex(0);
    setReviewIndex(null);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if ((targetName === player1Name || targetName === player2Name || targetName === player3Name || targetName === player4Name) && gameStarted && !winner) return;

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
          payload: { ...stateRef.current, player1Name: null, readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName) },
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
          payload: { ...stateRef.current, player2Name: null, readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName) },
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
          payload: { ...stateRef.current, player3Name: null, readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName) },
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
          payload: { ...stateRef.current, player4Name: null, readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName) },
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
    if (!channel || gameStarted) return;
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
      const prevState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      setBoard(prevState.board);
      setIsWhiteTurn(prevState.isWhiteTurn);
      if (prevState.turnIndex !== undefined) setTurnIndex(prevState.turnIndex);
      setWinner(prevState.winner);
      setCastlingRights(prevState.castlingRights);
      setEnPassantTarget(prevState.enPassantTarget);
      setCaptures(prevState.captures);
      setLastMove(prevState.lastMove);
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
          isWhiteTurn: prevState.isWhiteTurn,
          turnIndex: prevState.turnIndex,
          winner: prevState.winner,
          castlingRights: prevState.castlingRights,
          enPassantTarget: prevState.enPassantTarget,
          captures: prevState.captures,
          lastMove: prevState.lastMove,
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
    const myColor =
      isPlayer1 || playerName === player3Name
        ? "W"
        : isPlayer2 || playerName === player4Name
        ? "B"
        : null;
    if (!myColor) return;

    const newWinner = myColor === "W" ? "B" : "W";
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

  const handleChangeGameMode = (mode: "1v1" | "2v2") => {
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

  const handleTimeChange = (newTimeSeconds: number) => {
    if (playerName !== hostName || gameStarted) return;
    setInitialTime(newTimeSeconds);
    setPlayer1Time(newTimeSeconds);
    setPlayer2Time(newTimeSeconds);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "change-time",
        payload: { initialTime: newTimeSeconds },
      });
    }
  };

  const value: ChessContextValue = {
    roomId,
    playerName,
    isSpectator,
    isPlayer1,
    isPlayer2,
    hostName,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    spectators,
    board,
    isWhiteTurn,
    winner,
    castlingRights,
    enPassantTarget,
    captures,
    lastMove,
    history,
    gameMode,
    turnIndex,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
    initialTime,
    selectedPos,
    animatingMove,
    promotionPending,
    reviewIndex,
    isInReview,
    displayState,
    handleCellClick,
    handlePromotionSelect,
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
    handleTimeChange,
    setReviewIndex,
  };

  return <ChessContext.Provider value={value}>{children}</ChessContext.Provider>;
}

export function useChess() {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
}
