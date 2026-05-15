"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";

const INITIAL_BOARD: (string | null)[][] = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

// Sử dụng hình ảnh SVG tiêu chuẩn quốc tế từ Wikimedia Commons cho giao diện thân thiện, dễ nhận diện hơn
const PIECE_IMAGES: Record<string, string> = {
  K: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  Q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  R: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  B: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  N: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  P: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
};

// Kiểm tra quân cản đường chéo
const getPiecesBetweenDiag = (
  board: (string | null)[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
) => {
  let count = 0;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1 + dr;
  let c = c1 + dc;
  while (r !== r2 && c !== c2) {
    if (board[r][c]) count++;
    r += dr;
    c += dc;
  }
  return count;
};

// Kiểm tra nước đi hợp lệ cơ bản của một quân (chưa xét chiếu tướng hay nhập thành)
const canMoveBasic = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  epTarget: [number, number] | null,
  isWhiteTurn: boolean,
) => {
  const piece = board[fr][fc];
  if (!piece) return false;
  const isW = piece === piece.toUpperCase();
  if (isW !== isWhiteTurn) return false;
  const target = board[tr][tc];

  // Không thể ăn quân cùng màu
  if (target && (target === target.toUpperCase()) === isW) return false;

  const type = piece.toLowerCase();
  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (type === "p") {
    const dir = isW ? -1 : 1;
    const startRow = isW ? 6 : 1;
    // Tiến thẳng
    if (dc === 0) {
      if (dr === dir && !target) return true;
      if (dr === 2 * dir && fr === startRow && !target && !board[fr + dir][fc])
        return true;
    }
    // Ăn chéo (bao gồm cả ăn qua đường - en passant)
    else if (adc === 1 && dr === dir) {
      if (target) return true;
      if (epTarget && epTarget[0] === tr && epTarget[1] === tc) return true;
    }
    return false;
  }
  if (type === "n") {
    return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
  }
  if (type === "b") {
    if (adr !== adc) return false;
    return getPiecesBetweenDiag(board, fr, fc, tr, tc) === 0;
  }
  if (type === "r") {
    if (adr !== 0 && adc !== 0) return false;
    if (adr === 0) {
      const min = Math.min(fc, tc);
      const max = Math.max(fc, tc);
      for (let c = min + 1; c < max; c++) if (board[fr][c]) return false;
    } else {
      const min = Math.min(fr, tr);
      const max = Math.max(fr, tr);
      for (let r = min + 1; r < max; r++) if (board[r][fc]) return false;
    }
    return true;
  }
  if (type === "q") {
    if (adr === adc) return getPiecesBetweenDiag(board, fr, fc, tr, tc) === 0;
    if (adr === 0) {
      const min = Math.min(fc, tc);
      const max = Math.max(fc, tc);
      for (let c = min + 1; c < max; c++) if (board[fr][c]) return false;
      return true;
    }
    if (adc === 0) {
      const min = Math.min(fr, tr);
      const max = Math.max(fr, tr);
      for (let r = min + 1; r < max; r++) if (board[r][fc]) return false;
      return true;
    }
    return false;
  }
  if (type === "k") {
    if (adr <= 1 && adc <= 1) return true;
    return false;
  }
  return false;
};

// Kiểm tra xem một ô có bị tấn công bởi phe đối thủ không
const isAttacked = (
  board: (string | null)[][],
  r: number,
  c: number,
  byWhite: boolean,
  epTarget: [number, number] | null,
) => {
  for (let ir = 0; ir < 8; ir++) {
    for (let ic = 0; ic < 8; ic++) {
      const p = board[ir][ic];
      if (p) {
        const pIsW = p === p.toUpperCase();
        if (pIsW === byWhite) {
          if (p.toLowerCase() === "p") {
            const dir = pIsW ? -1 : 1;
            if (r - ir === dir && Math.abs(c - ic) === 1) return true;
          } else if (p.toLowerCase() === "k") {
            if (Math.abs(r - ir) <= 1 && Math.abs(c - ic) <= 1) return true;
          } else {
            if (canMoveBasic(board, ir, ic, r, c, epTarget, byWhite))
              return true;
          }
        }
      }
    }
  }
  return false;
};

// Tìm vị trí của vua
const findKing = (board: (string | null)[][], isW: boolean) => {
  const kChar = isW ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kChar) return [r, c];
    }
  }
  return null;
};

// Kiểm tra một nước đi có hợp lệ hoàn toàn (bao gồm an toàn tướng và nhập thành)
const isLegalMove = (
  board: (string | null)[][],
  fr: number,
  fc: number,
  tr: number,
  tc: number,
  epTarget: [number, number] | null,
  isWhiteTurn: boolean,
  castlingRights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean },
) => {
  const piece = board[fr][fc];
  if (!piece) return false;

  // Luật Nhập thành (Castling)
  if (piece.toLowerCase() === "k" && Math.abs(tc - fc) === 2 && tr === fr) {
    if (isWhiteTurn) {
      if (fr !== 7 || fc !== 4) return false;
      if (tc === 6) {
        // Kingside
        if (!castlingRights.wK) return false;
        if (board[7][5] || board[7][6]) return false;
        if (isAttacked(board, 7, 4, false, epTarget)) return false;
        if (isAttacked(board, 7, 5, false, epTarget)) return false;
        if (isAttacked(board, 7, 6, false, epTarget)) return false;
        return true;
      } else if (tc === 2) {
        // Queenside
        if (!castlingRights.wQ) return false;
        if (board[7][1] || board[7][2] || board[7][3]) return false;
        if (isAttacked(board, 7, 4, false, epTarget)) return false;
        if (isAttacked(board, 7, 3, false, epTarget)) return false;
        if (isAttacked(board, 7, 2, false, epTarget)) return false;
        return true;
      }
    } else {
      if (fr !== 0 || fc !== 4) return false;
      if (tc === 6) {
        // Kingside
        if (!castlingRights.bK) return false;
        if (board[0][5] || board[0][6]) return false;
        if (isAttacked(board, 0, 4, true, epTarget)) return false;
        if (isAttacked(board, 0, 5, true, epTarget)) return false;
        if (isAttacked(board, 0, 6, true, epTarget)) return false;
        return true;
      } else if (tc === 2) {
        // Queenside
        if (!castlingRights.bQ) return false;
        if (board[0][1] || board[0][2] || board[0][3]) return false;
        if (isAttacked(board, 0, 4, true, epTarget)) return false;
        if (isAttacked(board, 0, 3, true, epTarget)) return false;
        if (isAttacked(board, 0, 2, true, epTarget)) return false;
        return true;
      }
    }
    return false;
  }

  if (!canMoveBasic(board, fr, fc, tr, tc, epTarget, isWhiteTurn)) return false;

  // Giả lập nước đi
  const tempBoard = board.map((row) => [...row]);
  tempBoard[tr][tc] = piece;
  tempBoard[fr][fc] = null;

  // Xóa Tốt bị ăn khi dùng luật Bắt Tốt Qua Đường (En Passant)
  if (
    piece.toLowerCase() === "p" &&
    Math.abs(tc - fc) === 1 &&
    !board[tr][tc]
  ) {
    tempBoard[fr][tc] = null;
  }

  // Tìm vua và đảm bảo tướng không bị chiếu sau khi đi
  const kPos = findKing(tempBoard, isWhiteTurn);
  if (kPos && isAttacked(tempBoard, kPos[0], kPos[1], !isWhiteTurn, epTarget)) {
    return false;
  }

  return true;
};

const INITIAL_TIME = 600; // 10 phút tính bằng giây

function ChessGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [isWhiteTurn, setIsWhiteTurn] = useState<boolean>(true);
  const [castlingRights, setCastlingRights] = useState({
    wK: true,
    wQ: true,
    bK: true,
    bQ: true,
  });
  const [enPassantTarget, setEnPassantTarget] = useState<
    [number, number] | null
  >(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    r: number;
    c: number;
    fr: number;
    fc: number;
    board: (string | null)[][];
    epTarget: [number, number] | null;
    castlingRights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
    color: "W" | "B";
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
    isWhiteTurn,
    winner,
    castlingRights,
    enPassantTarget,
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
      isWhiteTurn,
      winner,
      castlingRights,
      enPassantTarget,
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
    isWhiteTurn,
    winner,
    castlingRights,
    enPassantTarget,
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
    const roomChannel = supabase.channel(`chess-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { history: newHistory, ...data } = payload.payload;
        setBoard(data.board);
        setIsWhiteTurn(data.isWhiteTurn);
        setWinner(data.winner);
        setCastlingRights(data.castlingRights);
        setEnPassantTarget(data.enPassantTarget);
        setLastMove(data.lastMove);
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
        setSelectedPos(null);
        setLastMove(null);
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
        // Reset timers for all clients
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
              if (!newP2) {
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
              if (newSpecs.length < 5) {
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
              isWhiteTurn: state.isWhiteTurn,
              winner: state.winner,
              castlingRights: state.castlingRights,
              enPassantTarget: state.enPassantTarget,
              lastMove: state.lastMove,
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
        setIsWhiteTurn(data.isWhiteTurn);
        setWinner(data.winner);
        setCastlingRights(data.castlingRights);
        setEnPassantTarget(data.enPassantTarget);
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
          alert(payload.payload.reason || "Không thể tham gia phòng!");
          setHasInitialized(false);
          setShowNameModal(true);
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          alert("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "request-role-change" }, (payload) => {
        const { playerName: reqPlayer, newRole } = payload.payload;
        const state = stateRef.current;
        if (state.hostName === playerName) {
          if (newRole === "player" && !state.player2Name) {
            const newSpecs = state.spectators.filter((s) => s !== reqPlayer);
            setPlayer2Name(reqPlayer);
            setSpectators(newSpecs);
            roomChannel.send({
              type: "broadcast",
              event: "room-sync",
              payload: {
                ...stateRef.current,
                player2Name: reqPlayer,
                spectators: newSpecs,
              },
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
          alert("Đối thủ đã từ chối yêu cầu đi lại.");
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

  useEffect(() => {
    if (winner && winner !== "Draw") {
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

  const executeMove = useCallback(
    (
      newBoard: (string | null)[][],
      newEpTarget: [number, number] | null,
      newCastlingRights: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean },
      fr: number,
      fc: number,
      r: number,
      c: number,
    ) => {
      const currentState = {
        board: stateRef.current.board,
        isWhiteTurn: stateRef.current.isWhiteTurn,
        winner: stateRef.current.winner,
        castlingRights: stateRef.current.castlingRights,
        enPassantTarget: stateRef.current.enPassantTarget,
        lastMove: stateRef.current.lastMove,
        player1Time: stateRef.current.player1Time,
        player2Time: stateRef.current.player2Time,
      };
      const newHistory = [...stateRef.current.history, currentState];
      setHistory(newHistory);

      const nextTurn = !isWhiteTurn;

      // Kiểm tra xem đối thủ có bị chiếu bí hoặc bí nước (hòa) không
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
                    newCastlingRights,
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
            newEpTarget,
          );
        newWinner = inCheck ? (isWhiteTurn ? "W" : "B") : "Draw";
      }

      setBoard(newBoard);
      setIsWhiteTurn(nextTurn);
      setWinner(newWinner);
      setCastlingRights(newCastlingRights);
      setEnPassantTarget(newEpTarget);
      setSelectedPos(null);
      setLastMove({ from: [fr, fc], to: [r, c] });

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isWhiteTurn: nextTurn,
            winner: newWinner,
            castlingRights: newCastlingRights,
            enPassantTarget: newEpTarget,
            lastMove: { from: [fr, fc], to: [r, c] },
            history: newHistory,
            player1Time: player1Time,
            player2Time: player2Time,
          },
        });
      }
    },
    [isWhiteTurn, channel, player1Time, player2Time],
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
      } = promotionPending;
      const newBoard = pBoard.map((row) => [...row]);
      newBoard[r][c] = promotedPiece;

      setPromotionPending(null);
      executeMove(newBoard, epTarget, castlingRights, fr, fc, r, c);
    },
    [promotionPending, executeMove],
  );

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !gameStarted || isSpectator || promotionPending) return;

      const myColor = isPlayer1 ? "W" : isPlayer2 ? "B" : null;
      const currentTurn = isWhiteTurn ? "W" : "B";
      if (myColor !== currentTurn) return;

      const piece = board[r][c];
      const isWhitePiece = piece ? piece === piece.toUpperCase() : null;

      if (
        piece &&
        ((myColor === "W" && isWhitePiece) ||
          (myColor === "B" && !isWhitePiece))
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
            castlingRights,
          )
        ) {
          const newBoard = board.map((row) => [...row]);
          const p = board[fr][fc] as string;
          newBoard[r][c] = p;
          newBoard[fr][fc] = null;

          let newEpTarget: [number, number] | null = null;
          const newCastlingRights = { ...castlingRights };

          // En Passant
          if (
            p.toLowerCase() === "p" &&
            Math.abs(c - fc) === 1 &&
            !board[r][c]
          ) {
            newBoard[fr][c] = null;
          }
          if (p.toLowerCase() === "p" && Math.abs(r - fr) === 2) {
            newEpTarget = [(r + fr) / 2, fc];
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

          if (board[r][c] === "R" && r === 7 && c === 0)
            newCastlingRights.wQ = false;
          if (board[r][c] === "R" && r === 7 && c === 7)
            newCastlingRights.wK = false;
          if (board[r][c] === "r" && r === 0 && c === 0)
            newCastlingRights.bQ = false;
          if (board[r][c] === "r" && r === 0 && c === 7)
            newCastlingRights.bK = false;

          // Thay vì tự động phong cấp thành Hậu, mở popup chọn
          if ((p === "P" && r === 0) || (p === "p" && r === 7)) {
            setPromotionPending({
              r,
              c,
              fr,
              fc,
              board: newBoard,
              epTarget: newEpTarget,
              castlingRights: newCastlingRights,
              color: isWhiteTurn ? "W" : "B",
            });
            return;
          }

          executeMove(newBoard, newEpTarget, newCastlingRights, fr, fc, r, c);
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
      playerName,
      selectedPos,
      isSpectator,
      castlingRights,
      enPassantTarget,
      gameStarted,
      promotionPending,
      executeMove,
    ],
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsWhiteTurn(true);
    setWinner(null);
    setCastlingRights({ wK: true, wQ: true, bK: true, bQ: true });
    setEnPassantTarget(null);
    setSelectedPos(null);
    setLastMove(null);
    setHistory([]);
    setUndoRequestedBy(null);
    setPromotionPending(null);
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
      setIsWhiteTurn(prevState.isWhiteTurn);
      setWinner(prevState.winner);
      setCastlingRights(prevState.castlingRights);
      setEnPassantTarget(prevState.enPassantTarget);
      setLastMove(prevState.lastMove);
      setPlayer1Time(prevState.player1Time);
      setPlayer2Time(prevState.player2Time);
      setHistory(newHistory);
      setUndoRequestedBy(null);

      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          board: prevState.board,
          isWhiteTurn: prevState.isWhiteTurn,
          winner: prevState.winner,
          castlingRights: prevState.castlingRights,
          enPassantTarget: prevState.enPassantTarget,
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
    const myColor = isPlayer1 ? "W" : isPlayer2 ? "B" : null;
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const wKPos = findKing(board, true);
  const bKPos = findKing(board, false);
  const isWhiteInCheck = wKPos
    ? isAttacked(board, wKPos[0], wKPos[1], false, enPassantTarget)
    : false;
  const isBlackInCheck = bKPos
    ? isAttacked(board, bKPos[0], bKPos[1], true, enPassantTarget)
    : false;

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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "bắt đầu trận cờ vua" : "tạo phòng"}.`}
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
            Cờ Vua (Chess)
          </h1>

          {!showNameModal && (
            <>
              {player2Name ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 xl:justify-start justify-center">
                  <span>Trận đấu:</span>
                  <span className="font-semibold text-zinc-800">
                    {player1Name} (Trắng)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-800">
                    {player2Name} (Đen)
                  </span>
                  {playerName === hostName && (
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
                        className={`rounded-lg border-2 p-3 transition-colors ${isWhiteTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"} ${isWhiteInCheck && !winner ? "border-red-500 bg-red-50 ring-1 ring-red-500" : ""}`}
                      >
                        <div className="flex justify-between items-baseline">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-zinc-800">
                              {player1Name} (Trắng)
                            </span>
                            {isWhiteInCheck && !winner && (
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
                        className={`rounded-lg border-2 p-3 transition-colors ${!isWhiteTurn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"} ${isBlackInCheck && !winner ? "border-red-500 bg-red-50 ring-1 ring-red-500" : ""}`}
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
                          {winner === "Draw"
                            ? "🤝 Hòa cờ!"
                            : winner
                              ? `🎉 Chiến thắng: ${winner === "W" ? player1Name : player2Name}!`
                              : `Lượt đi: ${isWhiteTurn ? "Trắng" : "Đen"}`}
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

          <div className="mt-10 flex space-x-4">
            {gameStarted && !winner && !isSpectator && history.length > 0 && (
              <button
                onClick={handleRequestUndo}
                disabled={!!undoRequestedBy}
                className="cursor-pointer rounded-full border border-purple-300 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xin đi lại
              </button>
            )}
            <button
              onClick={resetGame}
              disabled={!player2Name || isSpectator}
              className="cursor-pointer rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Chơi lại
            </button>
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
            className={`transition-opacity ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="relative pl-5 pb-5 sm:pl-6 sm:pb-6">
              {/* Tọa độ hàng dọc (1-8) */}
              <div className="absolute top-0 bottom-5 sm:bottom-6 left-0 flex w-5 sm:w-6 flex-col text-xs sm:text-sm font-bold text-zinc-500 select-none">
                {(isPlayer2
                  ? [1, 2, 3, 4, 5, 6, 7, 8]
                  : [8, 7, 6, 5, 4, 3, 2, 1]
                ).map((n) => (
                  <div
                    key={n}
                    className="flex flex-1 items-center justify-center"
                  >
                    {n}
                  </div>
                ))}
              </div>

              {/* Tọa độ hàng ngang (A-H) */}
              <div className="absolute bottom-0 left-5 sm:left-6 right-0 flex h-5 sm:h-6 text-xs sm:text-sm font-bold text-zinc-500 select-none">
                {(isPlayer2
                  ? ["H", "G", "F", "E", "D", "C", "B", "A"]
                  : ["A", "B", "C", "D", "E", "F", "G", "H"]
                ).map((l) => (
                  <div
                    key={l}
                    className="flex flex-1 items-center justify-center"
                  >
                    {l}
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-8 grid-rows-8 w-[88vw] md:w-[70vh] md:max-w-[720px] aspect-square border-4 border-[#8B5A2B] shadow-2xl">
                {/* Promotion Modal Overlay */}
                {promotionPending && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl flex gap-4">
                      {["q", "r", "b", "n"].map((type) => {
                        const piece =
                          promotionPending.color === "W"
                            ? type.toUpperCase()
                            : type;
                        return (
                          <button
                            key={type}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromotionSelect(piece);
                            }}
                            className="w-14 h-14 sm:w-20 sm:h-20 hover:bg-blue-50 hover:scale-105 transition-all rounded-lg flex items-center justify-center border-2 border-transparent hover:border-blue-200 shadow-sm bg-zinc-50"
                          >
                            <img
                              src={PIECE_IMAGES[piece]}
                              alt={piece}
                              className="w-10 h-10 sm:w-16 sm:h-16"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(() => {
                  const shouldFlip = isPlayer2;
                  return (shouldFlip ? [...board].reverse() : board).map(
                    (row, mappedR) => {
                      const r = shouldFlip ? 7 - mappedR : mappedR;
                      return (shouldFlip ? [...row].reverse() : row).map(
                        (piece, mappedC) => {
                          const c = shouldFlip ? 7 - mappedC : mappedC;

                          const isLight = (r + c) % 2 === 0;
                          const bgClass = isLight
                            ? "bg-[#F0D9B5]"
                            : "bg-[#B58863]";

                          const isSelected =
                            selectedPos?.[0] === r && selectedPos?.[1] === c;
                          const isLastMove =
                            (lastMove?.from[0] === r &&
                              lastMove?.from[1] === c) ||
                            (lastMove?.to[0] === r && lastMove?.to[1] === c);
                          const isValidTarget =
                            selectedPos &&
                            !piece &&
                            isLegalMove(
                              board,
                              selectedPos[0],
                              selectedPos[1],
                              r,
                              c,
                              enPassantTarget,
                              isWhiteTurn,
                              castlingRights,
                            );
                          const canCapture =
                            selectedPos &&
                            piece &&
                            isLegalMove(
                              board,
                              selectedPos[0],
                              selectedPos[1],
                              r,
                              c,
                              enPassantTarget,
                              isWhiteTurn,
                              castlingRights,
                            );

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`relative w-full h-full flex items-center justify-center cursor-pointer ${bgClass}`}
                              onClick={() => handleCellClick(r, c)}
                            >
                              {/* Highlight moves */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-blue-400/50 z-10" />
                              )}
                              {isLastMove && !isSelected && (
                                <div className="absolute inset-0 bg-yellow-400/40 z-10" />
                              )}
                              {isValidTarget && (
                                <div className="w-[30%] h-[30%] bg-black/20 rounded-full z-20" />
                              )}
                              {canCapture && (
                                <div className="absolute inset-0 border-[6px] border-black/20 rounded-full z-20 scale-90" />
                              )}

                              {/* Piece */}
                              {piece && (
                                <img
                                  src={PIECE_IMAGES[piece]}
                                  alt={piece}
                                  draggable={false}
                                  className="relative z-30 w-[80%] h-[80%] select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                                />
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

        {/* Cột phải: Thông tin người xem */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0">
            <h3 className="text-lg font-medium text-zinc-900 mb-4 border-b border-zinc-100 pb-3">
              Người xem ({spectators.length}/5)
            </h3>
            {spectators.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Chưa có người xem</p>
            ) : (
              <ul className="space-y-3">
                {spectators.map((spec, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between space-x-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                        {spec.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-800">
                        {spec}
                      </span>
                    </div>
                    {playerName === hostName && (
                      <button
                        onClick={() => handleKickPlayer(spec)}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
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
    </main>
  );
}

export default function ChessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ Vua...
        </div>
      }
    >
      <ChessGame />
    </Suspense>
  );
}
