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

export const BOARD_SIZE = 19;
export const INITIAL_TIME = 1800; // 30 phút mỗi người
export const KOMI = 6.5; // Luật Trung Quốc

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

export const serializeBoard = (b: (string | null)[][]) => {
  return b.map((row) => row.map((cell) => cell || ".").join("")).join("");
};

interface GoContextType {
  roomId: string;
  playerName: string;
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  spectators: string[];
  board: (string | null)[][];
  boardHistory: string[];
  isBlackNext: boolean;
  winner: string | null;
  lastMove: [number, number] | null;
  captures: { B: number; W: number };
  passCount: number;
  finalScore: any;
  history: any[];
  undoRequestedBy: string | null;
  player1Time: number;
  player2Time: number;
  gameStarted: boolean;
  readyPlayers: string[];
  isSpectator: boolean;
  handleCellClick: (row: number, col: number) => void;
  handlePass: () => void;
  handleResign: () => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
  handleStartClick: () => void;
}

const GoContext = createContext<GoContextType | undefined>(undefined);

export function GoProvider({
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

  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [boardHistory, setBoardHistory] = useState<string[]>([]);
  const [isBlackNext, setIsBlackNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [captures, setCaptures] = useState<{ B: number; W: number }>({ B: 0, W: 0 });
  const [passCount, setPassCount] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);

  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    boardHistory,
    isBlackNext,
    winner,
    lastMove,
    captures,
    passCount,
    finalScore,
    history,
    undoRequestedBy,
    player1Time,
    player2Time,
    gameStarted,
    readyPlayers,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      boardHistory,
      isBlackNext,
      winner,
      lastMove,
      captures,
      passCount,
      finalScore,
      history,
      undoRequestedBy,
      player1Time,
      player2Time,
      gameStarted,
      readyPlayers,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    boardHistory,
    isBlackNext,
    winner,
    lastMove,
    captures,
    passCount,
    finalScore,
    history,
    undoRequestedBy,
    player1Time,
    player2Time,
    gameStarted,
    readyPlayers,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      if (requestedRole === "player") setPlayer1Name(playerName);
      else setSpectators([playerName]);
    }

    const roomChannel = supabase.channel(`go-room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const data = payload.payload;
        if (data.board) setBoard(data.board);
        if (data.isBlackNext !== undefined) setIsBlackNext(data.isBlackNext);
        setWinner(data.winner || null);
        setLastMove(data.lastMove || null);
        if (data.captures) setCaptures(data.captures);
        if (data.passCount !== undefined) setPassCount(data.passCount);
        if (data.boardHistory) setBoardHistory(data.boardHistory);
        if (data.history) setHistory(data.history);
        setUndoRequestedBy(null);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.finalScore) setFinalScore(data.finalScore);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(createEmptyBoard());
        setIsBlackNext(true);
        setWinner(null);
        setLastMove(null);
        setCaptures({ B: 0, W: 0 });
        setPassCount(0);
        setBoardHistory([]);
        setFinalScore(null);
        setHistory([]);
        setUndoRequestedBy(null);
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
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
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
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
        if (data.hostName) setHostName(data.hostName);
        setPlayer1Name(data.player1Name || null);
        setPlayer2Name(data.player2Name || null);
        if (data.spectators) setSpectators(data.spectators);
        if (data.board) setBoard(data.board);
        if (data.isBlackNext !== undefined) setIsBlackNext(data.isBlackNext);
        setWinner(data.winner || null);
        setLastMove(data.lastMove || null);
        if (data.captures) setCaptures(data.captures);
        if (data.passCount !== undefined) setPassCount(data.passCount);
        if (data.boardHistory) setBoardHistory(data.boardHistory);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined) setUndoRequestedBy(data.undoRequestedBy);
        if (data.player1Time !== undefined) setPlayer1Time(data.player1Time);
        if (data.player2Time !== undefined) setPlayer2Time(data.player2Time);
        if (data.finalScore) setFinalScore(data.finalScore);
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
      setGameStarted(true);
      setPlayer1Time(INITIAL_TIME);
      setPlayer2Time(INITIAL_TIME);
      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: {},
      });
    }
  }, [readyPlayers, player1Name, player2Name, gameStarted, playerName, hostName, channel]);

  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isBlackNext) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("W");
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "W", player1Time: 0 },
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
            setWinner("B");
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
  }, [gameStarted, winner, isBlackNext, channel, playerName, hostName]);

  const getGroupAndLiberties = (currentBoard: (string | null)[][], startR: number, startC: number, color: string) => {
    const group: [number, number][] = [];
    let liberties = 0;
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    const queue = [[startR, startC]];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      group.push([r, c]);

      const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (!visited[nr][nc]) {
            if (currentBoard[nr][nc] === null) {
              liberties++;
              visited[nr][nc] = true;
            } else if (currentBoard[nr][nc] === color) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
    return { group, liberties };
  };

  const calculateScore = (finalBoard: (string | null)[][]) => {
    let blackTerritory = 0;
    let whiteTerritory = 0;
    let blackStones = 0;
    let whiteStones = 0;

    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (finalBoard[r][c] === "B") blackStones++;
        else if (finalBoard[r][c] === "W") whiteStones++;

        if (visited[r][c]) continue;

        if (finalBoard[r][c] !== null) {
          visited[r][c] = true;
        } else {
          const emptyGroup: [number, number][] = [];
          const queue: [number, number][] = [[r, c]];
          visited[r][c] = true;
          let reachesBlack = false;
          let reachesWhite = false;

          while (queue.length > 0) {
            const [cr, cc] = queue.shift()!;
            emptyGroup.push([cr, cc]);

            const neighbors = [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]];
            for (const [nr, nc] of neighbors) {
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (finalBoard[nr][nc] === "B") reachesBlack = true;
                else if (finalBoard[nr][nc] === "W") reachesWhite = true;
                else if (!visited[nr][nc]) {
                  visited[nr][nc] = true;
                  queue.push([nr, nc]);
                }
              }
            }
          }

          if (reachesBlack && !reachesWhite) blackTerritory += emptyGroup.length;
          else if (reachesWhite && !reachesBlack) whiteTerritory += emptyGroup.length;
        }
      }
    }

    const blackScore = blackTerritory + blackStones;
    const whiteScore = whiteTerritory + whiteStones + KOMI;

    return { blackScore, whiteScore, blackTerritory, whiteTerritory, blackStones, whiteStones };
  };

  const handleCellClick = useCallback((row: number, col: number) => {
    if (board[row][col] || winner || !gameStarted || isSpectator) return;

    const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    const currentTurnColor = isBlackNext ? "B" : "W";

    if (myColor !== currentTurnColor) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentTurnColor;

    const opponentColor = currentTurnColor === "B" ? "W" : "B";
    let capturedStones = 0;

    const neighbors = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]];
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (newBoard[nr][nc] === opponentColor) {
          const { group, liberties } = getGroupAndLiberties(newBoard, nr, nc, opponentColor);
          if (liberties === 0) {
            group.forEach(([gr, gc]) => {
              newBoard[gr][gc] = null;
              capturedStones++;
            });
          }
        }
      }
    }

    const { liberties } = getGroupAndLiberties(newBoard, row, col, currentTurnColor);
    if (liberties === 0) {
      toast.error("Luật cấm tự sát: Không thể đánh vào ô không còn khí!");
      return;
    }

    const serializedBoard = serializeBoard(newBoard);
    if (boardHistory.includes(serializedBoard)) {
      toast.error("Luật Superko: Nước đi này làm bàn cờ lặp lại cục diện cũ (Kiếp)!");
      return;
    }

    const currentState = {
      board: stateRef.current.board,
      isBlackNext: stateRef.current.isBlackNext,
      winner: stateRef.current.winner,
      lastMove: stateRef.current.lastMove,
      captures: stateRef.current.captures,
      passCount: stateRef.current.passCount,
      boardHistory: stateRef.current.boardHistory,
      player1Time: stateRef.current.player1Time,
      player2Time: stateRef.current.player2Time,
      finalScore: stateRef.current.finalScore,
    };
    const newUndoHistory = [...stateRef.current.history, currentState];
    setHistory(newUndoHistory);

    const newBoardHistory = [...boardHistory, serializedBoard];
    const newCaptures = { ...captures };
    if (currentTurnColor === "B") newCaptures.B += capturedStones;
    else newCaptures.W += capturedStones;

    const nextTurn = !isBlackNext;

    setBoard(newBoard);
    setIsBlackNext(nextTurn);
    setCaptures(newCaptures);
    setLastMove([row, col]);
    setPassCount(0);
    setBoardHistory(newBoardHistory);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: newBoard,
          isBlackNext: nextTurn,
          winner,
          captures: newCaptures,
          lastMove: [row, col],
          passCount: 0,
          boardHistory: newBoardHistory,
          history: newUndoHistory,
          player1Time,
          player2Time,
          finalScore,
        },
      });
    }
  }, [board, boardHistory, isBlackNext, winner, channel, isPlayer1, isPlayer2, isSpectator, gameStarted, captures, player1Time, player2Time, finalScore]);

  const handlePass = () => {
    if (winner || !gameStarted || isSpectator) return;
    const currentTurnColor = isBlackNext ? "B" : "W";
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    if (myColor !== currentTurnColor) return;

    const currentState = {
      board: stateRef.current.board,
      isBlackNext: stateRef.current.isBlackNext,
      winner: stateRef.current.winner,
      lastMove: stateRef.current.lastMove,
      captures: stateRef.current.captures,
      passCount: stateRef.current.passCount,
      boardHistory: stateRef.current.boardHistory,
      player1Time: stateRef.current.player1Time,
      player2Time: stateRef.current.player2Time,
      finalScore: stateRef.current.finalScore,
    };
    const newHistory = [...stateRef.current.history, currentState];
    setHistory(newHistory);

    const newPassCount = passCount + 1;
    let newWinner = winner;
    let score = finalScore;

    if (newPassCount >= 2) {
      const scoreResult = calculateScore(board);
      score = {
        black: scoreResult.blackScore,
        white: scoreResult.whiteScore,
        blackTerritory: scoreResult.blackTerritory,
        whiteTerritory: scoreResult.whiteTerritory,
        blackStones: scoreResult.blackStones,
        whiteStones: scoreResult.whiteStones,
      };
      if (scoreResult.blackScore > scoreResult.whiteScore) newWinner = "B";
      else if (scoreResult.whiteScore > scoreResult.blackScore) newWinner = "W";
      else newWinner = "Draw";
    }

    const nextTurn = !isBlackNext;
    setIsBlackNext(nextTurn);
    setPassCount(newPassCount);
    if (newWinner) setWinner(newWinner);
    if (score) setFinalScore(score);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board,
          isBlackNext: nextTurn,
          winner: newWinner,
          captures,
          lastMove,
          passCount: newPassCount,
          boardHistory,
          history: newHistory,
          player1Time,
          player2Time,
          finalScore: score,
        },
      });
    }
  };

  const handleResign = () => {
    if (winner || !gameStarted || isSpectator) return;
    const myColor = isPlayer1 ? "B" : isPlayer2 ? "W" : null;
    if (!myColor) return;

    const newWinner = myColor === "B" ? "W" : "B";
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
    setBoard(createEmptyBoard());
    setIsBlackNext(true);
    setWinner(null);
    setLastMove(null);
    setCaptures({ B: 0, W: 0 });
    setPassCount(0);
    setBoardHistory([]);
    setHistory([]);
    setUndoRequestedBy(null);
    setFinalScore(null);
    setPlayer1Time(INITIAL_TIME);
    setPlayer2Time(INITIAL_TIME);
    setGameStarted(false);
    setReadyPlayers([]);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if (targetName === player2Name && gameStarted) return;

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
    if (!channel || gameStarted) return;
    if (targetSlot === 1 && player1Name) return;
    if (targetSlot === 2 && player2Name) return;

    channel.send({
      type: "broadcast",
      event: "request-role-change",
      payload: { playerName, newRole: "player", targetSlot },
    });
  };

  const handleBecomeSpectator = () => {
    if (!channel || (gameStarted && !winner)) return;
    channel.send({
      type: "broadcast",
      event: "request-role-change",
      payload: { playerName, newRole: "spectator" },
    });
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
      setIsBlackNext(prevState.isBlackNext);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setCaptures(prevState.captures);
      setPassCount(prevState.passCount);
      setBoardHistory(prevState.boardHistory);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setFinalScore(prevState.finalScore);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          ...prevState,
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

  return (
    <GoContext.Provider
      value={{
        roomId,
        playerName,
        hostName,
        player1Name,
        player2Name,
        spectators,
        board,
        boardHistory,
        isBlackNext,
        winner,
        lastMove,
        captures,
        passCount,
        finalScore,
        history,
        undoRequestedBy,
        player1Time,
        player2Time,
        gameStarted,
        readyPlayers,
        isSpectator,
        handleCellClick,
        handlePass,
        handleResign,
        resetGame,
        handleKickPlayer,
        handleSlotClick,
        handleBecomeSpectator,
        handleRequestUndo,
        handleAcceptUndo,
        handleRejectUndo,
        handleStartClick,
      }}
    >
      {children}
    </GoContext.Provider>
  );
}

export function useGo() {
  const context = useContext(GoContext);
  if (context === undefined) {
    throw new Error("useGo must be used within a GoProvider");
  }
  return context;
}
