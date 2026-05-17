"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";
import { FaUser, FaTrophy } from "react-icons/fa";
import {
  GiSeatedMouse,
  GiCat,
  GiWolfHead,
  GiSittingDog,
  GiTigerHead,
  GiTiger,
  GiLion,
  GiElephant,
} from "react-icons/gi";
import { FaPaw } from "react-icons/fa6";
import toast from "react-hot-toast";

// Mảng 9 hàng x 7 cột của Cờ Thú
// Uppercase (Đỏ - Người chơi 1), Lowercase (Xanh - Người chơi 2)
// L: Sư tử, T: Cọp, D: Chó, C: Mèo, R: Chuột, P: Báo, W: Sói, E: Voi
const INITIAL_BOARD: (string | null)[][] = [
  ["l", null, null, null, null, null, "t"], // 0
  [null, "d", null, null, null, "c", null], // 1
  ["r", null, "p", null, "w", null, "e"], // 2
  [null, null, null, null, null, null, null], // 3
  [null, null, null, null, null, null, null], // 4
  [null, null, null, null, null, null, null], // 5
  ["E", null, "W", null, "P", null, "R"], // 6
  [null, "C", null, null, null, "D", null], // 7
  ["T", null, null, null, null, null, "L"], // 8
];

const piecesMap: Record<string, { bg: string; color: string; label: string }> =
  {
    R: { bg: "bg-red-100", color: "text-red-700", label: "Chuột" },
    C: { bg: "bg-red-100", color: "text-red-700", label: "Mèo" },
    W: { bg: "bg-red-100", color: "text-red-700", label: "Sói" },
    D: { bg: "bg-red-100", color: "text-red-700", label: "Chó" },
    P: { bg: "bg-red-100", color: "text-red-700", label: "Báo" },
    T: { bg: "bg-red-100", color: "text-red-700", label: "Cọp" },
    L: { bg: "bg-red-100", color: "text-red-700", label: "Sư tử" },
    E: { bg: "bg-red-100", color: "text-red-700", label: "Voi" },

    r: { bg: "bg-blue-100", color: "text-blue-700", label: "Chuột" },
    c: { bg: "bg-blue-100", color: "text-blue-700", label: "Mèo" },
    w: { bg: "bg-blue-100", color: "text-blue-700", label: "Sói" },
    d: { bg: "bg-blue-100", color: "text-blue-700", label: "Chó" },
    p: { bg: "bg-blue-100", color: "text-blue-700", label: "Báo" },
    t: { bg: "bg-blue-100", color: "text-blue-700", label: "Cọp" },
    l: { bg: "bg-blue-100", color: "text-blue-700", label: "Sư tử" },
    e: { bg: "bg-blue-100", color: "text-blue-700", label: "Voi" },
  };

const getPieceIcon = (piece: string) => {
  const p = piece.toLowerCase();
  switch (p) {
    case "r":
      return <GiSeatedMouse />;
    case "c":
      return <GiCat />;
    case "d":
      return <GiSittingDog />;
    case "w":
      return <GiWolfHead />;
    case "p":
      return <FaPaw />;
    case "t":
      return <GiTiger />;
    case "l":
      return <GiLion />;
    case "e":
      return <GiElephant />;
    default:
      return null;
  }
};

const rankMap: Record<string, number> = {
  r: 1,
  c: 2,
  d: 3,
  w: 4,
  p: 5,
  t: 6,
  l: 7,
  e: 8,
};

const getRank = (piece: string) => rankMap[piece.toLowerCase()];

const isWater = (r: number, c: number) =>
  r >= 3 && r <= 5 && (c === 1 || c === 2 || c === 4 || c === 5);

const isTrap = (r: number, c: number, isRed: boolean) => {
  if (isRed) {
    // Bẫy của phe Đỏ (Bảo vệ hang Đỏ tại 8,3)
    return (r === 8 && (c === 2 || c === 4)) || (r === 7 && c === 3);
  } else {
    // Bẫy của phe Xanh (Bảo vệ hang Xanh tại 0,3)
    return (r === 0 && (c === 2 || c === 4)) || (r === 1 && c === 3);
  }
};

const canCapture = (
  attacker: string,
  defender: string,
  rTarget: number,
  cTarget: number,
  isRedAttacker: boolean,
) => {
  // Nếu quân địch đang nằm trong bẫy CỦA MÌNH thì ăn được bất chấp cấp độ
  if (isTrap(rTarget, cTarget, isRedAttacker)) return true;

  const rankA = getRank(attacker);
  const rankD = getRank(defender);

  // Chuột ăn Voi
  if (rankA === 1 && rankD === 8) return true;
  // Voi không được ăn Chuột
  if (rankA === 8 && rankD === 1) return false;

  // Cấp lớn hơn hoặc bằng thì ăn được
  return rankA >= rankD;
};

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

  // Không được đi vào Hang của chính mình
  const isOwnDen = isRed ? tr === 8 && tc === 3 : tr === 0 && tc === 3;
  if (isOwnDen) return false;

  const target = board[tr][tc];
  if (target) {
    const targetIsRed = target === target.toUpperCase();
    if (isRed === targetIsRed) return false; // Không ăn quân mình

    // Chuột không thể bắt quân trên bờ khi đang dưới nước và ngược lại
    if (getRank(piece) === 1) {
      if (isWater(fr, fc) !== isWater(tr, tc)) return false;
    }

    if (!canCapture(piece, target, tr, tc, isRed)) return false;
  }

  const dr = tr - fr;
  const dc = tc - fc;

  if (Math.abs(dr) + Math.abs(dc) === 1) {
    // Đi 1 ô bình thường
    if (isWater(tr, tc) && getRank(piece) !== 1) return false; // Chỉ chuột mới được xuống nước
    return true;
  } else {
    // Nhảy qua sông
    const rank = getRank(piece);
    if (rank !== 6 && rank !== 7) return false; // Chỉ Sư tử và Cọp

    if (dc === 0) {
      if (Math.abs(dr) !== 4) return false; // Phải nhảy chính xác qua 3 ô nước
      const dir = Math.sign(dr);
      for (let i = 1; i <= 3; i++) {
        const checkR = fr + dir * i;
        if (!isWater(checkR, fc)) return false;
        if (board[checkR][fc] !== null) return false; // Bị chặn bởi chuột
      }
      return true;
    } else if (dr === 0) {
      if (Math.abs(dc) !== 3) return false; // Phải nhảy chính xác qua 2 ô nước
      const dir = Math.sign(dc);
      for (let i = 1; i <= 2; i++) {
        const checkC = fc + dir * i;
        if (!isWater(fr, checkC)) return false;
        if (board[fr][checkC] !== null) return false; // Bị chặn bởi chuột
      }
      return true;
    }
  }
  return false;
};

const INITIAL_TIME = 600; // 10 phút tính bằng giây

function JungleGame() {
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
    history,
    undoRequestedBy,
    gameStarted,
    readyPlayers,
    player1Time,
    player2Time,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`jungle-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          board,
          isRedTurn,
          winner,
          lastMove,
          player1Time,
          player2Time,
          history: newHistory,
        } = payload.payload;
        setBoard(board);
        setIsRedTurn(isRedTurn);
        setWinner(winner);
        setLastMove(lastMove);
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
        setIsRedTurn(data.isRedTurn);
        setWinner(data.winner);
        setLastMove(data.lastMove);
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
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer,
            );

            let newP1 =
              state.player1Name === reqPlayer ? null : state.player1Name;
            let newP2 =
              state.player2Name === reqPlayer ? null : state.player2Name;

            if (!newP1) {
              newP1 = reqPlayer;
            } else if (!newP2) {
              newP2 = reqPlayer;
            }

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
          } else if (newRole === "spectator") {
            const newP1 =
              state.player1Name === reqPlayer ? null : state.player1Name;
            const newP2 =
              state.player2Name === reqPlayer ? null : state.player2Name;
            const newSpecs = [...state.spectators];
            if (!newSpecs.includes(reqPlayer)) {
              newSpecs.push(reqPlayer);
            }
            const newReadyPlayers = state.readyPlayers.filter(
              (p) => p !== reqPlayer,
            );

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
            setWinner("b");
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
            setWinner("r");
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
        if (Date.now() < end) requestAnimationFrame(frame);
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
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, requestedRole);
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
            player1Time: stateRef.current.player1Time,
            player2Time: stateRef.current.player2Time,
          };
          const newHistory = [...stateRef.current.history, currentState];
          setHistory(newHistory);

          const newBoard = board.map((row) => [...row]);
          newBoard[r][c] = newBoard[fr][fc];
          newBoard[fr][fc] = null;

          let newWinner = null;
          // Logic chiến thắng đơn giản: Vào Hang đối phương
          if (isRedTurn && r === 0 && c === 3) newWinner = "r";
          if (!isRedTurn && r === 8 && c === 3) newWinner = "b";

          const nextTurn = !isRedTurn;

          setBoard(newBoard);
          setIsRedTurn(nextTurn);
          setWinner(newWinner);
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
                lastMove: { from: [fr, fc], to: [r, c] },
                history: newHistory,
                player1Time,
                player2Time,
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
    setHistory([]);
    setUndoRequestedBy(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlayer1Time(INITIAL_TIME);
    setPlayer2Time(INITIAL_TIME);
    if (channel) channel.send({ type: "broadcast", event: "reset-game" });
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
    if (!channel || gameStarted) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newSpecs = state.spectators.filter((s) => s !== playerName);
      const newReadyPlayers = state.readyPlayers.filter(
        (p) => p !== playerName,
      );
      let newP1 = state.player1Name === playerName ? null : state.player1Name;
      let newP2 = state.player2Name === playerName ? null : state.player2Name;

      if (!newP1) newP1 = playerName;
      else if (!newP2) newP2 = playerName;

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
      if (isSpectator && (!player1Name || !player2Name)) {
        channel.send({
          type: "broadcast",
          event: "request-role-change",
          payload: { playerName, newRole: "player" },
        });
      }
    }
    setRequestedRole("player");
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "player");
  };

  const handleBecomeSpectator = () => {
    if (!channel || gameStarted) return;

    if (playerName === hostName) {
      const state = stateRef.current;
      const newP1 = state.player1Name === playerName ? null : state.player1Name;
      const newP2 = state.player2Name === playerName ? null : state.player2Name;
      const newSpecs = [...state.spectators];
      if (!newSpecs.includes(playerName)) {
        newSpecs.push(playerName);
      }
      const newReadyPlayers = state.readyPlayers.filter(
        (p) => p !== playerName,
      );

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

    setRequestedRole("spectator");
    if (roomId) localStorage.setItem(`joinedRoom_${roomId}`, "spectator");
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
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
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
    if (channel)
      channel.send({ type: "broadcast", event: "reject-undo", payload: {} });
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
        payload: { ...stateRef.current, winner: newWinner },
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

      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800"
            title="Chỉnh sửa tên"
          >
            {playerName ? playerName.charAt(0).toUpperCase() : <FaUser />}
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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "bắt đầu trận Cờ Thú" : "tạo phòng"}.`}
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
            Cờ Thú (Jungle)
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
                  <span className="font-semibold text-blue-600">
                    {player2Name} (Xanh)
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
                  {!isSpectator && !gameStarted && (
                    <button
                      onClick={handleBecomeSpectator}
                      className="mt-4 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Rời ghế, trở thành khán giả
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 w-full">
                {gameStarted ? (
                  <div className="w-full space-y-4 text-left xl:text-left text-center">
                    <div
                      className={`rounded-lg border-2 p-3 transition-colors ${isRedTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-red-600">
                            {player1Name} (Đỏ)
                          </span>
                        </div>
                        <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                          {formatTime(player1Time)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`rounded-lg border-2 p-3 transition-colors ${!isRedTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-blue-600">
                            {player2Name} (Xanh)
                          </span>
                        </div>
                        <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                          {formatTime(player2Time)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 text-center xl:text-left">
                      <p className="text-sm font-medium text-zinc-800 flex items-center justify-center xl:justify-start">
                        {winner ? (
                          <>
                            <FaTrophy className="inline mr-2 text-yellow-500 text-lg" />
                            Chiến thắng:{" "}
                            {winner === "r" ? player1Name : player2Name}!
                          </>
                        ) : (
                          `Lượt đi: ${isRedTurn ? "Đỏ" : "Xanh"}`
                        )}
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

        {/* Cột giữa: Bàn cờ Cờ Thú */}
        <div className="flex w-full flex-col items-center pb-8">
          <div
            className={`p-3 sm:p-4 rounded-xl shadow-2xl border-4 border-zinc-400 bg-white transition-opacity ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div
              className="grid w-[95vw] max-w-[600px] aspect-[7/9] gap-[2px] bg-zinc-300"
              style={{
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gridTemplateRows: "repeat(9, minmax(0, 1fr))",
              }}
            >
              {(() => {
                const shouldFlip = isPlayer2;
                return (shouldFlip ? [...board].reverse() : board).map(
                  (row, mappedR) => {
                    const r = shouldFlip ? 8 - mappedR : mappedR;
                    return (shouldFlip ? [...row].reverse() : row).map(
                      (piece, mappedC) => {
                        const c = shouldFlip ? 6 - mappedC : mappedC;
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

                        // Định dạng màu nền của từng loại ô cờ
                        let cellBg = "bg-white"; // Bãi cỏ
                        let label = "";
                        if (
                          r >= 3 &&
                          r <= 5 &&
                          (c === 1 || c === 2 || c === 4 || c === 5)
                        ) {
                          cellBg = "bg-cyan-200"; // Sông
                        } else if (
                          (r === 0 && c === 3) ||
                          (r === 8 && c === 3)
                        ) {
                          cellBg = "bg-rose-800"; // Hang
                          label = "Hang";
                        } else if (
                          (r === 0 && (c === 2 || c === 4)) ||
                          (r === 1 && c === 3) ||
                          (r === 8 && (c === 2 || c === 4)) ||
                          (r === 7 && c === 3)
                        ) {
                          cellBg =
                            "bg-amber-600 border-2 border-dashed border-amber-800"; // Bẫy
                          label = "Bẫy";
                        }

                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`relative flex flex-col items-center justify-center cursor-pointer overflow-hidden ${cellBg} ${!piece && !winner ? "hover:brightness-95" : ""}`}
                            onClick={() => handleCellClick(r, c)}
                          >
                            {isLastMove && !isSelected && (
                              <div className="absolute inset-0 bg-yellow-400/50 z-[5] pointer-events-none" />
                            )}

                            {label && !piece && (
                              <span className="absolute z-10 text-xs sm:text-sm font-bold text-white/70 select-none pointer-events-none">
                                {label}
                              </span>
                            )}

                            {piece && (
                              <div
                                className={`
                              relative z-20 flex flex-col items-center justify-center 
                              w-[85%] h-[85%] rounded-full 
                              border-2 ${isLastMove ? "border-yellow-500" : "border-zinc-700"} 
                              shadow-sm
                              ${piecesMap[piece].bg} ${piecesMap[piece].color}
                              ${isSelected ? "ring-4 ring-yellow-400 brightness-110" : ""}
                              ${canCapture ? "ring-4 ring-red-500/80" : ""}
                            `}
                              >
                                <span className="text-xl sm:text-2xl md:text-3xl leading-none flex items-center justify-center">
                                  {getPieceIcon(piece)}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold leading-none mt-0.5 select-none">
                                  {piecesMap[piece].label}
                                </span>
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

        {/* Cột phải: Thông tin người xem */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8">
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
        </div>
      </div>
    </main>
  );
}

export default function JunglePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn Cờ Thú...
        </div>
      }
    >
      <JungleGame />
    </Suspense>
  );
}
