"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";

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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false); // P1 = Red
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (!roomId || !playerName) return;
    const roomChannel = supabase.channel(`xiangqi-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          board,
          isRedTurn,
          winner,
          lastMove,
          gameStartTime: syncedStartTime,
        } = payload.payload;
        setBoard(board);
        setIsRedTurn(isRedTurn);
        setWinner(winner);
        setLastMove(lastMove);
        if (syncedStartTime) setGameStartTime(syncedStartTime);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(INITIAL_BOARD);
        setIsRedTurn(true);
        setWinner(null);
        setSelectedPos(null);
        setLastMove(null);
        setGameStartTime(null);
        setElapsedTime(0);
      })
      .on("broadcast", { event: "player-join" }, (payload) => {
        const { playerName: newPlayer } = payload.payload;
        setOpponentName(newPlayer);
        roomChannel.send({
          type: "broadcast",
          event: "player-sync",
          payload: { playerName },
        });
      })
      .on("broadcast", { event: "player-sync" }, (payload) => {
        const { playerName: existingPlayer } = payload.payload;
        setOpponentName(existingPlayer);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel.send({
            type: "broadcast",
            event: "player-join",
            payload: { playerName },
          });
        }
      });

    setChannel(roomChannel);
    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, playerName]);

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

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setPlayerName(inputName.trim());
    setShowNameModal(false);

    if (!roomId) {
      const newRoomId = Math.random().toString(36).substring(2, 10);
      setRoomId(newRoomId);
      setIsPlayer1(true); // Chủ phòng được ưu tiên cầm quân Đỏ
      router.replace(`${pathname}?room=${newRoomId}`);
    } else {
      setIsPlayer1(false);
    }
  };

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (winner || !opponentName) return;

      const myColor = isPlayer1 ? "r" : "b";
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
          const newBoard = board.map((row) => [...row]);
          newBoard[r][c] = newBoard[fr][fc];
          newBoard[fr][fc] = null;

          let newWinner = null;
          if (board[r][c] === "k") newWinner = "r";
          if (board[r][c] === "K") newWinner = "b";

          const nextTurn = !isRedTurn;
          const startTime = gameStartTime || Date.now();

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
          setSelectedPos(null);
          setLastMove({ from: [fr, fc], to: [r, c] });
          if (!gameStartTime) setGameStartTime(startTime);

          if (channel) {
            channel.send({
              type: "broadcast",
              event: "sync-move",
              payload: {
                board: newBoard,
                isRedTurn: nextTurn,
                winner: newWinner,
                lastMove: { from: [fr, fc], to: [r, c] },
                gameStartTime: startTime,
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
      opponentName,
      isPlayer1,
      gameStartTime,
      selectedPos,
    ],
  );

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setIsRedTurn(true);
    setWinner(null);
    setSelectedPos(null);
    setLastMove(null);
    setGameStartTime(null);
    setElapsedTime(0);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <Modal
        isOpen={showNameModal}
        title={roomParam ? "Tham gia phòng chơi" : "Tạo phòng chơi mới"}
      >
        <form onSubmit={handleJoinRoom} className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-500">
            Vui lòng nhập tên của bạn để bắt đầu trận cờ tướng.
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
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {roomParam ? "Vào chơi ngay" : "Tạo phòng & Lấy link"}
          </button>
        </form>
      </Modal>

      <div className="grid w-full max-w-full flex-1 grid-cols-1 place-items-center gap-8 px-2 md:px-8 xl:grid-cols-[300px_auto_300px]">
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
            Cờ Tướng (Xiangqi)
          </h1>

          {!showNameModal && (
            <>
              {opponentName ? (
                <p className="text-sm text-zinc-500">
                  <span className="font-semibold text-red-600">
                    {isPlayer1 ? playerName : opponentName} (Đỏ)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-800">
                    {!isPlayer1 ? playerName : opponentName} (Đen)
                  </span>
                </p>
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
                </div>
              )}

              {opponentName && (
                <div className="mt-6 flex flex-col items-center space-y-3 xl:items-start">
                  <div className="inline-block rounded-full border border-zinc-100 bg-white px-6 py-3 shadow-sm">
                    <p className="text-sm font-medium text-zinc-800">
                      {winner
                        ? `🎉 Chiến thắng: ${winner === "r" ? (isPlayer1 ? playerName : opponentName) : !isPlayer1 ? playerName : opponentName}!`
                        : `Lượt đi: ${isRedTurn ? (isPlayer1 ? "Bạn (Đỏ)" : opponentName + " (Đỏ)") : !isPlayer1 ? "Bạn (Đen)" : opponentName + " (Đen)"}`}
                    </p>
                  </div>
                  <div className="text-3xl font-mono font-medium tracking-wider text-zinc-800">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex space-x-4">
            <button
              onClick={resetGame}
              disabled={!opponentName}
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

        <div className="flex w-full flex-col items-center overflow-x-auto pb-8">
          {(isRedInCheck || isBlackInCheck) && !winner && (
            <h2 className="mb-4 animate-bounce text-2xl font-bold text-red-600 drop-shadow-md">
              ⚠️ CHIẾU TƯỚNG!
            </h2>
          )}
          <div
            className={`bg-[#E6C697] p-2 sm:p-6 rounded shadow-2xl border-4 border-[#8B5A2B] transition-opacity ${!opponentName || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="relative aspect-[9/10] w-[95vw] sm:w-[800px] lg:w-[1080px] xl:w-[1350px]">
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
                  className="text-3xl sm:text-5xl lg:text-6xl xl:text-[80px] font-[family-name:var(--font-playfair)] tracking-[0.5em]"
                >
                  楚河
                </text>
                <text
                  x="75%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#5C4033"
                  className="text-3xl sm:text-5xl lg:text-6xl xl:text-[80px] font-[family-name:var(--font-playfair)] tracking-[0.5em]"
                >
                  漢界
                </text>
              </svg>

              {/* Khung giao diện chứa các quân cờ */}
              <div className="relative z-10 grid grid-cols-9 grid-rows-10 w-full h-full">
                {board.map((row, r) =>
                  row.map((piece, c) => {
                    const isSelected =
                      selectedPos?.[0] === r && selectedPos?.[1] === c;
                    const isLastMove =
                      (lastMove?.from[0] === r && lastMove?.from[1] === c) ||
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
                            font-bold text-3xl sm:text-5xl lg:text-7xl xl:text-[80px] leading-none font-[family-name:var(--font-playfair)]
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
                  }),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden w-full xl:block"></div>
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
