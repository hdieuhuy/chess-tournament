"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

const INITIAL_BOARD: (string | null)[][] = [
  ["r", "n", "b", "a", "k", "a", "b", "n", "r"],
  [null, null, null, null, null, null, null, null, null],
  [null, "c", null, null, null, null, null, "c", null],
  ["p", null, "p", null, "p", null, "p", null, "p"],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["P", null, "P", null, "P", null, "P", null, "P"],
  [null, "C", null, null, null, null, null, "C", null],
  [null, null, null, null, null, null, null, null, null],
  ["R", "N", "B", "A", "K", "A", "B", "N", "R"],
];

const piecesMap: Record<string, { text: string; color: string }> = {
  R: { text: "車", color: "text-red-600" },
  N: { text: "馬", color: "text-red-600" },
  B: { text: "相", color: "text-red-600" },
  A: { text: "仕", color: "text-red-600" },
  K: { text: "帥", color: "text-red-600" },
  C: { text: "炮", color: "text-red-600" },
  P: { text: "兵", color: "text-red-600" },
  r: { text: "車", color: "text-zinc-900" },
  n: { text: "馬", color: "text-zinc-900" },
  b: { text: "象", color: "text-zinc-900" },
  a: { text: "士", color: "text-zinc-900" },
  k: { text: "將", color: "text-zinc-900" },
  c: { text: "砲", color: "text-zinc-900" },
  p: { text: "卒", color: "text-zinc-900" },
};

const PIECE_VALUES: Record<string, number> = {
  R: 9,
  r: 9,
  C: 8,
  c: 8,
  N: 7,
  n: 7,
  B: 6,
  b: 6,
  A: 5,
  a: 5,
  P: 4,
  p: 4,
  K: 0,
  k: 0,
};

// Hàm tiện ích: tính tọa độ điểm giao trên bàn cờ cho SVG
const X = (c: number) => `${(c + 0.5) * (100 / 9)}%`;
const Y = (r: number) => `${(r + 0.5) * (100 / 10)}%`;

// Đếm số quân cản giữa 2 vị trí (trên cùng đường thẳng)
const getPiecesBetween = (
  board: (string | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
) => {
  let count = 0;
  if (r1 === r2) {
    const min = Math.min(c1, c2);
    const max = Math.max(c1, c2);
    for (let c = min + 1; c < max; c++) if (board[r1][c]) count++;
  } else if (c1 === c2) {
    const min = Math.min(r1, r2);
    const max = Math.max(r1, r2);
    for (let r = min + 1; r < max; r++) if (board[r][c1]) count++;
  }
  return count;
};

// Kiểm tra một nước đi có hợp lệ cơ bản (không tính an toàn tướng)
const canPieceMoveBasic = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  const isRed = piece === piece.toUpperCase();
  const target = board[tr][tc];
  if (target) {
    const targetIsRed = target === target.toUpperCase();
    if (isRed === targetIsRed) return false; // Không ăn quân mình
  }

  const pType = piece.toLowerCase();
  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (pType === "k") {
    if (adr + adc !== 1) return false;
    if (tc < 3 || tc > 5) return false;
    if (isRed && tr < 7) return false;
    if (!isRed && tr > 2) return false;
  } else if (pType === "a") {
    if (adr !== 1 || adc !== 1) return false;
    if (tc < 3 || tc > 5) return false;
    if (isRed && tr < 7) return false;
    if (!isRed && tr > 2) return false;
  } else if (pType === "b") {
    if (adr !== 2 || adc !== 2) return false;
    if (isRed && tr < 5) return false; // Không qua sông
    if (!isRed && tr > 4) return false;
    if (board[fr + dr / 2][fc + dc / 2]) return false; // Cản mắt tượng
  } else if (pType === "n") {
    if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
    if (adr === 2 && board[fr + dr / 2][fc]) return false; // Cản chân mã
    if (adc === 2 && board[fr][fc + dc / 2]) return false;
  } else if (pType === "r") {
    if (adr !== 0 && adc !== 0) return false;
    if (getPiecesBetween(board, fr, fc, tr, tc) > 0) return false;
  } else if (pType === "c") {
    if (adr !== 0 && adc !== 0) return false;
    const count = getPiecesBetween(board, fr, fc, tr, tc);
    if (target) {
      if (count !== 1) return false; // Ăn cần đúng 1 ngòi
    } else {
      if (count > 0) return false; // Đi không được vướng
    }
  } else if (pType === "p") {
    if (isRed) {
      if (dr > 0) return false; // Không đi lùi
      if (fr >= 5) {
        if (dr !== -1 || dc !== 0) return false; // Chưa qua sông
      } else {
        if (dr === -1 && dc === 0) return true;
        if (dr === 0 && adc === 1) return true; // Sang ngang
        return false;
      }
    } else {
      if (dr < 0) return false;
      if (fr <= 4) {
        if (dr !== 1 || dc !== 0) return false;
      } else {
        if (dr === 1 && dc === 0) return true;
        if (dr === 0 && adc === 1) return true;
        return false;
      }
    }
  }
  return true;
};

// Kiểm tra xem tướng có đang bị chiếu không
const isKingInCheck = (board: (string | null)[][], isRed: boolean) => {
  let kr = -1;
  let kc = -1;
  const kChar = isRed ? "K" : "k";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === kChar) {
        kr = r;
        kc = c;
        break;
      }
    }
    if (kr !== -1) break;
  }
  if (kr === -1) return false;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p) {
        const pIsRed = p === p.toUpperCase();
        if (pIsRed !== isRed) {
          if (canPieceMoveBasic(board, r, c, kr, kc)) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

// Kiểm tra đầy đủ một nước đi, bao gồm cả "lộ mặt tướng" và "bảo vệ tướng"
const isValidMove = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  currentTurn: "r" | "b",
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  const isRed = piece === piece.toUpperCase();
  if ((isRed && currentTurn === "b") || (!isRed && currentTurn === "r"))
    return false;

  if (!canPieceMoveBasic(board, fr, fc, tr, tc)) return false;

  // 1. Thử đi để kiểm tra xem tướng của mình có bị uy hiếp hay lộ mặt không
  const tempBoard = board.map((r) => [...r]);
  tempBoard[tr][tc] = piece;
  tempBoard[fr][fc] = null;

  let kPos: [number, number] | null = null;
  let KPos: [number, number] | null = null;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (tempBoard[r][c] === "k") kPos = [r, c];
      if (tempBoard[r][c] === "K") KPos = [r, c];
    }
  }

  // Kiểm tra "lộ mặt tướng"
  if (kPos && KPos && kPos[1] === KPos[1]) {
    if (getPiecesBetween(tempBoard, kPos[0], kPos[1], KPos[0], KPos[1]) === 0) {
      return false; // Lỗi 2 tướng nhìn thấy nhau
    }
  }

  // 2. Kiểm tra xem nước đi này có khiến tướng mình bị chiếu bí bởi đối thủ không
  const myKPos = isRed ? KPos : kPos;
  if (myKPos) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = tempBoard[r][c];
        if (p) {
          const pIsRed = p === p.toUpperCase();
          if (pIsRed !== isRed) {
            if (canPieceMoveBasic(tempBoard, r, c, myKPos[0], myKPos[1])) {
              return false; // Nước cờ tự sát (bị chiếu)
            }
          }
        }
      }
    }
  }

  return true;
};

const INITIAL_TIME = 600; // 10 phút tính bằng giây

function XiangqiGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [isRedTurn, setIsRedTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);
  const [captures, setCaptures] = useState<{ r: string[]; b: string[] }>({
    r: [],
    b: [],
  });
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [player1Time, setPlayer1Time] = useState<number>(INITIAL_TIME);
  const [player2Time, setPlayer2Time] = useState<number>(INITIAL_TIME);

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

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
        setPlayer1Name(savedName);
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

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isRedTurn,
    winner,
    lastMove,
    captures,
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
      isRedTurn,
      winner,
      lastMove,
      captures,
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
    isRedTurn,
    winner,
    lastMove,
    captures,
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`xiangqi-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          board,
          isRedTurn,
          winner,
          lastMove,
          captures,
          player1Time,
          player2Time,
          history: newHistory,
        } = payload.payload;
        setBoard(board);
        setIsRedTurn(isRedTurn);
        setWinner(winner);
        setLastMove(lastMove);
        if (captures) setCaptures(captures);
        if (newHistory) setHistory(newHistory);
        setUndoRequestedBy(null);
        setPlayer1Time(player1Time);
        setPlayer2Time(player2Time);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsRedTurn(true);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setCaptures({ r: [], b: [] });
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
          prev.includes(readyPlayer) ? prev : [...prev, readyPlayer],
        );
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        // Reset timers on game start for all clients
        setPlayer1Time(INITIAL_TIME);
        setPlayer2Time(INITIAL_TIME);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          let newP2 = state.player2Name;
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer =
            newPlayer === state.player1Name || newPlayer === newP2;
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
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason:
                      "Phòng đã đủ 2 người chơi, vui lòng tham gia với tư cách Người xem!",
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
              hostName: state.hostName,
              player1Name: state.player1Name,
              player2Name: newP2,
              spectators: newSpecs,
              board: state.board,
              isRedTurn: state.isRedTurn,
              winner: state.winner,
              lastMove: state.lastMove,
              captures: state.captures,
              history: state.history,
              undoRequestedBy: state.undoRequestedBy,
              gameStarted: state.gameStarted,
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
        setIsRedTurn(data.isRedTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
        if (data.captures) setCaptures(data.captures);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined)
          setUndoRequestedBy(data.undoRequestedBy);
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
        setReadyPlayers((prev) =>
          prev.map((p) => (p === oldName ? newName : p)),
        );
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
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player") {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            if (!state.player1Name) {
              setPlayer1Name(reqPlayer);
              setSpectators(newSpecs);
              stateRef.current.player1Name = reqPlayer;
              stateRef.current.spectators = newSpecs;
              roomChannel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current },
              });
            } else if (!state.player2Name) {
              setPlayer2Name(reqPlayer);
              setSpectators(newSpecs);
              stateRef.current.player2Name = reqPlayer;
              stateRef.current.spectators = newSpecs;
              roomChannel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current },
              });
            }
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
        const newReadyPlayers = state.readyPlayers.filter(
          (p) => p !== leavingPlayer,
        );

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
        const startTime = Date.now();
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
  }, [
    readyPlayers,
    player1Name,
    player2Name,
    gameStarted,
    playerName,
    hostName,
    channel,
  ]);

  // Timer logic
  useEffect(() => {
    if (!gameStarted || winner) return;

    const timer = setInterval(() => {
      if (isRedTurn) {
        setPlayer1Time((t) => {
          if (t <= 1) {
            setWinner("b"); // Black wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "b", player1Time: 0 },
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
            setWinner("r"); // Red wins on time
            if (channel && playerName === hostName) {
              channel.send({
                type: "broadcast",
                event: "sync-move",
                payload: { ...stateRef.current, winner: "r", player2Time: 0 },
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
  }, [gameStarted, winner, isRedTurn, channel, playerName, hostName]);

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

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const newName = inputName.trim();
    setPlayerName(newName);
    localStorage.setItem("playerName", newName);

    if (roomId) {
      localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
    }

    setShowNameModal(false);

    if (!hasInitialized) {
      setHasInitialized(true);
      if (!roomId) {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setHostName(newName);
        setPlayer1Name(newName);
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
      if (player1Name === playerName) setPlayer1Name(newName);
      if (player2Name === playerName) setPlayer2Name(newName);
      if (spectators.includes(playerName)) {
        setSpectators(spectators.map((s) => (s === playerName ? newName : s)));
      }
    }
  };

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator) return;

      const myColor = isPlayer1 ? "r" : isPlayer2 ? "b" : null;
      const currentTurn = isRedTurn ? "r" : "b";
      if (myColor !== currentTurn) return;

      const piece = board[r][c];
      const isRedPiece = piece ? piece === piece.toUpperCase() : null;

      // Bấm vào quân của mình để thay đổi lựa chọn
      if (
        piece &&
        ((myColor === "r" && isRedPiece) || (myColor === "b" && !isRedPiece))
      ) {
        setSelectedPos([r, c]);
        return;
      }

      if (selectedPos) {
        const [fr, fc] = selectedPos;
        if (isValidMove(board, fr, fc, r, c, currentTurn)) {
          const currentState = {
            board: stateRef.current.board,
            isRedTurn: stateRef.current.isRedTurn,
            winner: stateRef.current.winner,
            lastMove: stateRef.current.lastMove,
            captures: stateRef.current.captures,
            player1Time: stateRef.current.player1Time,
            player2Time: stateRef.current.player2Time,
          };
          const newHistory = [...stateRef.current.history, currentState];
          setHistory(newHistory);

          const newBoard = board.map((row) => [...row]);
          const capturedPiece = newBoard[r][c];
          newBoard[r][c] = newBoard[fr][fc];
          newBoard[fr][fc] = null;

          const newCaptures = { r: [...captures.r], b: [...captures.b] };
          if (capturedPiece) {
            if (isRedTurn) newCaptures.r.push(capturedPiece);
            else newCaptures.b.push(capturedPiece);
          }

          let newWinner = null;
          if (board[r][c] === "k") newWinner = "r";
          if (board[r][c] === "K") newWinner = "b";

          const nextTurn = !isRedTurn;

          // Scan kiểm tra đối thủ còn nước đi hợp lệ nào không (Chiếu bí / Bí nước)
          if (!newWinner) {
            let opponentHasValidMove = false;
            const oppColor = nextTurn ? "r" : "b";
            for (let tr = 0; tr < 10 && !opponentHasValidMove; tr++) {
              for (let tc = 0; tc < 9 && !opponentHasValidMove; tc++) {
                const p = newBoard[tr][tc];
                if (
                  p &&
                  ((oppColor === "r" && p === p.toUpperCase()) ||
                    (oppColor === "b" && p === p.toLowerCase()))
                ) {
                  for (let t_r = 0; t_r < 10 && !opponentHasValidMove; t_r++) {
                    for (let t_c = 0; t_c < 9 && !opponentHasValidMove; t_c++) {
                      if (isValidMove(newBoard, tr, tc, t_r, t_c, oppColor)) {
                        opponentHasValidMove = true;
                      }
                    }
                  }
                }
              }
            }
            if (!opponentHasValidMove) {
              newWinner = currentTurn; // Đối thủ bí nước hoặc chiếu hết, mình thắng
            }
          }

          setBoard(newBoard);
          setIsRedTurn(nextTurn);
          setWinner(newWinner);
          setCaptures(newCaptures);
          setSelectedPos(null);
          setLastMove({ from: [fr, fc], to: [r, c] });

          if (channel) {
            channel.send({
              type: "broadcast",
              event: "sync-move",
              payload: {
                board: newBoard,
                isRedTurn: nextTurn,
                winner: newWinner,
                captures: newCaptures,
                lastMove: { from: [fr, fc], to: [r, c] },
                history: newHistory,
                player1Time: player1Time,
                player2Time: player2Time,
              },
            });
          }
        } else {
          setSelectedPos(null);
        }
      }
    },
    [
      board,
      isRedTurn,
      winner,
      channel,
      player1Name,
      player2Name,
      playerName,
      selectedPos,
      isSpectator,
      gameStarted,
    ],
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsRedTurn(true);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setCaptures({ r: [], b: [] });
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
    if (targetName === player2Name && gameStarted) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    if (targetName === player2Name) {
      setPlayer2Name(null);
      setReadyPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) {
        resetGame();
      }
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player2Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter(
              (p) => p !== targetName,
            ),
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

  const handleBecomePlayer = () => {
    if (channel && isSpectator && !player2Name) {
      channel.send({
        type: "broadcast",
        event: "request-role-change",
        payload: { playerName, newRole: "player" },
      });
      setRequestedRole("player");
      if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "player");
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
      setIsRedTurn(prevState.isRedTurn);
      setWinner(prevState.winner);
      setLastMove(prevState.lastMove);
      setCaptures(prevState.captures);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isRedTurn: prevState.isRedTurn,
          winner: prevState.winner,
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
    const myColor = isPlayer1 ? "r" : isPlayer2 ? "b" : null;
    if (!myColor) return;

    const newWinner = myColor === "r" ? "b" : "r";
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isRedInCheck = isKingInCheck(board, true);
  const isBlackInCheck = isKingInCheck(board, false);

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      {undoRequestedBy && undoRequestedBy !== playerName && !isSpectator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4 border border-zinc-200">
            <p className="mb-6 text-lg font-medium text-zinc-800">
              <span className="font-bold text-purple-600">
                {undoRequestedBy}
              </span>{" "}
              muốn xin đi lại 1 nước.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleAcceptUndo}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                Đồng ý
              </button>
              <button
                onClick={handleRejectUndo}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {undoRequestedBy === playerName && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg font-medium animate-pulse">
          Đang chờ đối thủ phản hồi yêu cầu đi lại...
        </div>
      )}

      {/* Avatar Icon */}
      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
            title="Chỉnh sửa tên"
          >
            {playerName ? playerName.charAt(0).toUpperCase() : "👤"}
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
            {hasInitialized
              ? "Cập nhật tên hiển thị của bạn."
              : `Vui lòng nhập tên của bạn để ${roomParam ? "bắt đầu trận cờ tướng" : "tạo phòng"}.`}
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
            {hasInitialized
              ? "Cập nhật"
              : roomParam
                ? "Vào phòng"
                : "Tạo phòng & Lấy link"}
          </button>
        </form>
      </Modal>

      <div className="grid w-full max-w-full flex-1 grid-cols-1 place-items-center gap-8 px-2 md:px-8 xl:grid-cols-[300px_auto_300px]">
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
            Cờ Tướng (Xiangqi)
          </h1>

          {!showNameModal && (
            <>
              {player2Name ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 xl:justify-start justify-center">
                  <span>Trận đấu:</span>
                  <span className="font-semibold text-red-600">
                    {player1Name} (Đỏ)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-800">
                    {player2Name} (Đen)
                  </span>
                  {playerName === hostName && !gameStarted && (
                    <button
                      onClick={() => handleKickPlayer(player2Name)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
                    >
                      Kick
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex w-full flex-col items-center xl:items-start">
                  <p className="mb-3 text-sm text-zinc-500">
                    Đang chờ đối thủ tham gia...
                  </p>
                  <div className="flex w-full items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                    <span className="flex-1 select-all truncate text-left text-xs text-zinc-500">
                      {typeof window !== "undefined"
                        ? window.location.href
                        : ""}
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
                  {isSpectator && (
                    <button
                      onClick={handleBecomePlayer}
                      className="mt-4 w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      Tham gia làm người chơi
                    </button>
                  )}
                </div>
              )}

              {player2Name && (
                <div className="mt-6 w-full">
                  {gameStarted ? (
                    <div className="w-full space-y-4 text-left xl:text-left text-center">
                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${isRedTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"} ${isRedInCheck && !winner ? "border-red-500 bg-red-50 ring-1 ring-red-500" : ""}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-red-600">
                              {player1Name} (Đỏ)
                            </span>
                            {isRedInCheck && !winner && (
                              <span className="text-xs font-bold text-red-600 animate-bounce mt-1">
                                ⚠️ CHIẾU TƯỚNG!
                              </span>
                            )}
                          </div>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player1Time)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`rounded-lg border-2 p-3 transition-colors ${!isRedTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"} ${isBlackInCheck && !winner ? "border-red-500 bg-red-50 ring-1 ring-red-500" : ""}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-zinc-800">
                              {player2Name} (Đen)
                            </span>
                            {isBlackInCheck && !winner && (
                              <span className="text-xs font-bold text-red-600 animate-bounce mt-1">
                                ⚠️ CHIẾU TƯỚNG!
                              </span>
                            )}
                          </div>
                          <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                            {formatTime(player2Time)}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 text-center xl:text-left">
                        <p className="text-sm font-medium text-zinc-800">
                          {winner
                            ? `🎉 Chiến thắng: ${winner === "r" ? player1Name : player2Name}!`
                            : `Lượt đi: ${isRedTurn ? "Đỏ" : "Đen"}`}
                        </p>
                      </div>
                      {gameStarted && !winner && !isSpectator && (
                        <button
                          onClick={handleResign}
                          className="mt-2 w-full cursor-pointer rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                        >
                          Bỏ cuộc
                        </button>
                      )}
                    </div>
                  ) : (
                    !isSpectator && (
                      <div className="flex w-full flex-col items-center space-y-3 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
                        <h3 className="text-base font-semibold text-zinc-800">
                          Trận đấu sắp bắt đầu!
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {readyPlayers.length}/2 người chơi đã sẵn sàng.
                        </p>
                        <button
                          onClick={handleStartClick}
                          disabled={readyPlayers.includes(playerName || "")}
                          className="mt-2 w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                        >
                          {readyPlayers.includes(playerName || "")
                            ? "Đã sẵn sàng, chờ đối thủ..."
                            : "Sẵn sàng bắt đầu"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex w-full flex-wrap justify-center gap-4 xl:justify-start">
            {gameStarted && !winner && !isSpectator && history.length > 0 && (
              <button
                onClick={handleRequestUndo}
                disabled={!!undoRequestedBy}
                className="cursor-pointer rounded-full border border-purple-300 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xin đi lại
              </button>
            )}
            {playerName === hostName && (
              <button
                onClick={resetGame}
                disabled={!player2Name}
                className="cursor-pointer rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Chơi lại
              </button>
            )}
            <Link
              href="/"
              className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Đổi trò chơi
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col items-center pb-8">
          <div
            className={`bg-[#E6C697] p-2 sm:p-6 rounded shadow-2xl border-4 border-[#8B5A2B] transition-opacity ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="relative aspect-[9/10] w-[95vw] md:h-[85vh] md:w-auto">
              {/* Vẽ bàn cờ bằng SVG lưới sắc nét */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {Array.from({ length: 10 }).map((_, r) => (
                  <line
                    key={`h${r}`}
                    x1={X(0)}
                    y1={Y(r)}
                    x2={X(8)}
                    y2={Y(r)}
                    stroke="#5C4033"
                    strokeWidth="2"
                  />
                ))}
                {Array.from({ length: 9 }).map((_, c) => (
                  <g key={`v${c}`}>
                    <line
                      x1={X(c)}
                      y1={Y(0)}
                      x2={X(c)}
                      y2={Y(4)}
                      stroke="#5C4033"
                      strokeWidth="2"
                    />
                    <line
                      x1={X(c)}
                      y1={Y(5)}
                      x2={X(c)}
                      y2={Y(9)}
                      stroke="#5C4033"
                      strokeWidth="2"
                    />
                  </g>
                ))}
                <line
                  x1={X(0)}
                  y1={Y(4)}
                  x2={X(0)}
                  y2={Y(5)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                <line
                  x1={X(8)}
                  y1={Y(4)}
                  x2={X(8)}
                  y2={Y(5)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />

                <line
                  x1={X(3)}
                  y1={Y(0)}
                  x2={X(5)}
                  y2={Y(2)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                <line
                  x1={X(5)}
                  y1={Y(0)}
                  x2={X(3)}
                  y2={Y(2)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                <line
                  x1={X(3)}
                  y1={Y(7)}
                  x2={X(5)}
                  y2={Y(9)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                <line
                  x1={X(5)}
                  y1={Y(7)}
                  x2={X(3)}
                  y2={Y(9)}
                  stroke="#5C4033"
                  strokeWidth="2"
                />

                <text
                  x="25%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#5C4033"
                  className="text-xl sm:text-2xl md:text-3xl tracking-[0.5em]"
                >
                  楚河
                </text>
                <text
                  x="75%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#5C4033"
                  className="text-xl sm:text-2xl md:text-3xl tracking-[0.5em]"
                >
                  漢界
                </text>
              </svg>

              {/* Khung giao diện chứa các quân cờ */}
              <div className="relative z-10 grid grid-cols-9 grid-rows-10 w-full h-full">
                {(() => {
                  const shouldFlip = isPlayer2;
                  return (shouldFlip ? [...board].reverse() : board).map(
                    (row, mappedR) => {
                      const r = shouldFlip ? 9 - mappedR : mappedR;
                      return (shouldFlip ? [...row].reverse() : row).map(
                        (piece, mappedC) => {
                          const c = shouldFlip ? 8 - mappedC : mappedC;
                          const isSelected =
                            selectedPos?.[0] === r && selectedPos?.[1] === c;
                          const isLastMove =
                            (lastMove?.from[0] === r &&
                              lastMove?.from[1] === c) ||
                            (lastMove?.to[0] === r && lastMove?.to[1] === c);
                          const canMoveTo =
                            selectedPos &&
                            !piece &&
                            isValidMove(
                              board,
                              selectedPos[0],
                              selectedPos[1],
                              r,
                              c,
                              isRedTurn ? "r" : "b",
                            );
                          const canCapture =
                            selectedPos &&
                            piece &&
                            isValidMove(
                              board,
                              selectedPos[0],
                              selectedPos[1],
                              r,
                              c,
                              isRedTurn ? "r" : "b",
                            );

                          return (
                            <div
                              key={`${r}-${c}`}
                              className="relative w-full h-full flex items-center justify-center cursor-pointer"
                              onClick={() => handleCellClick(r, c)}
                            >
                              {piece && (
                                <div
                                  className={`
                            relative z-20 flex items-center justify-center 
                            w-[85%] h-[85%] rounded-full bg-[#FFE6B3] 
                            border-2 ${isLastMove ? "border-blue-400" : "border-[#8B5A2B]"} 
                            shadow-[1px_2px_4px_rgba(0,0,0,0.5)] 
                            font-bold text-2xl sm:text-3xl md:text-4xl leading-none
                            ${piecesMap[piece].color}
                            ${isSelected ? "ring-4 ring-blue-500 bg-blue-100" : ""}
                            ${canCapture ? "ring-4 ring-red-500/70" : ""}
                          `}
                                >
                                  {piecesMap[piece].text}
                                </div>
                              )}
                              {!piece && canMoveTo && (
                                <div className="w-3 h-3 bg-red-500/60 rounded-full z-20" />
                              )}
                            </div>
                          );
                        },
                      );
                    },
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người xem và Tù binh */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8 flex flex-col">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0 overflow-hidden flex flex-col max-h-[400px]">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-lg">👀</span> Người xem
              </h3>
              <span className="bg-zinc-200 text-zinc-700 py-1 px-2.5 rounded-full text-xs font-bold">
                {spectators.length}/10
              </span>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              {spectators.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-2 opacity-20">🪑</span>
                  <p className="text-sm text-zinc-400 font-medium">
                    Chưa có người xem
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {spectators.map((spec, idx) => (
                    <li
                      key={idx}
                      className="group flex items-center justify-between space-x-3 rounded-xl border border-transparent p-2 transition-all hover:bg-zinc-50 hover:border-zinc-100"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-700 shadow-inner">
                          {spec.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-sm font-medium text-zinc-800 truncate"
                          title={spec}
                        >
                          {spec}
                        </span>
                      </div>
                      {playerName === hostName && (
                        <button
                          onClick={() => handleKickPlayer(spec)}
                          className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 opacity-100 xl:opacity-0 transition-all hover:bg-red-100 xl:group-hover:opacity-100 focus:opacity-100"
                          title="Kích người xem"
                        >
                          Kick
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Khung Tù binh */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0 overflow-hidden flex flex-col mt-8">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-lg">⚔️</span> Tù binh
              </h3>
            </div>
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {/* Red side */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-800">
                    Đỏ (Đã ăn)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[32px] items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  {captures.r.length > 0 ? (
                    [...captures.r]
                      .sort(
                        (a, b) =>
                          (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0),
                      )
                      .map((p, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center w-6 h-6 rounded-full bg-[#FFE6B3] border border-[#8B5A2B] text-xs font-bold drop-shadow-sm ${piecesMap[p].color}`}
                        >
                          {piecesMap[p].text}
                        </div>
                      ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">
                      Chưa ăn quân nào
                    </span>
                  )}
                </div>
              </div>

              {/* Black side */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-800">
                    Đen (Đã ăn)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[32px] items-center bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  {captures.b.length > 0 ? (
                    [...captures.b]
                      .sort(
                        (a, b) =>
                          (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0),
                      )
                      .map((p, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center w-6 h-6 rounded-full bg-[#FFE6B3] border border-[#8B5A2B] text-xs font-bold drop-shadow-sm ${piecesMap[p].color}`}
                        >
                          {piecesMap[p].text}
                        </div>
                      ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">
                      Chưa ăn quân nào
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function XiangqiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ Tướng...
        </div>
      }
    >
      <XiangqiGame />
    </Suspense>
  );
}
