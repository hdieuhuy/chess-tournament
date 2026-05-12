"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";

const BOARD_SIZE = 25;

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

function GomokuGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [isBlackNext, setIsBlackNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCells, setWinningCells] = useState<number[][]>([]);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);
      setShowNameModal(false);
      setHasInitialized(true);

      if (!roomParam) {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setIsPlayer1(true);
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        setIsPlayer1(false);
      }
    }
    setIsCheckingStorage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roomId || !playerName) return;

    const roomChannel = supabase.channel(`gomoku-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          board,
          isBlackNext,
          winner,
          winningCells,
          lastMove,
          gameStartTime: syncedStartTime,
        } = payload.payload;
        setBoard(board);
        setIsBlackNext(isBlackNext);
        setWinner(winner);
        setWinningCells(winningCells);
        setLastMove(lastMove);
        if (syncedStartTime) setGameStartTime(syncedStartTime);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        // Khi đối thủ bấm chơi lại
        setBoard(createEmptyBoard());
        setIsBlackNext(true);
        setWinner(null);
        setWinningCells([]);
        setLastMove(null);
        setGameStartTime(null);
        setElapsedTime(0);
      })
      .on("broadcast", { event: "swap-roles" }, () => {
        setIsPlayer1((prev) => !prev);
      })
      .on("broadcast", { event: "player-join" }, (payload) => {
        const { playerName: newPlayer } = payload.payload;
        setOpponentName(newPlayer);

        // Phản hồi lại tên của mình cho người vừa tham gia
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
          // Thông báo mình đã tham gia phòng
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

  // Effect để cập nhật đồng hồ
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
    setShowNameModal(false);

    if (!hasInitialized) {
      setHasInitialized(true);
      if (!roomId) {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        setRoomId(newRoomId);
        setIsPlayer1(true);
        router.replace(`${pathname}?room=${newRoomId}`);
      } else {
        setIsPlayer1(false);
      }
    } else {
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "player-sync",
          payload: { playerName: newName },
        });
      }
    }
  };

  const checkWinner = (
    currentBoard: (string | null)[][],
    row: number,
    col: number,
    player: string,
  ) => {
    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // Ngang
      [
        [1, 0],
        [-1, 0],
      ], // Dọc
      [
        [1, 1],
        [-1, -1],
      ], // Chéo chính
      [
        [1, -1],
        [-1, 1],
      ], // Chéo phụ
    ];

    for (const dir of directions) {
      let count = 1;
      const currentWinningCells = [[row, col]];
      let blocks = 0;

      for (const [dr, dc] of dir) {
        let r = row + dr;
        let c = col + dc;
        while (
          r >= 0 &&
          r < BOARD_SIZE &&
          c >= 0 &&
          c < BOARD_SIZE &&
          currentBoard[r][c] === player
        ) {
          count++;
          currentWinningCells.push([r, c]);
          r += dr;
          c += dc;
        }

        // Kiểm tra xem đầu này có bị chặn không (bởi biên bàn cờ hoặc cờ đối thủ)
        if (
          r < 0 ||
          r >= BOARD_SIZE ||
          c < 0 ||
          c >= BOARD_SIZE ||
          (currentBoard[r][c] !== null && currentBoard[r][c] !== player)
        ) {
          blocks++;
        }
      }

      if (count >= 5 && blocks < 2) {
        return currentWinningCells;
      }
    }
    return null;
  };

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (board[row][col] || winner || !opponentName) return;

      const myColor = isPlayer1 ? "B" : "W";
      const currentTurnColor = isBlackNext ? "B" : "W";

      if (myColor !== currentTurnColor) return;

      const currentPlayer = isBlackNext ? "B" : "W";
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = currentPlayer;

      const winCells = checkWinner(newBoard, row, col, currentPlayer);
      const nextTurn = !isBlackNext;
      const newWinner = winCells ? currentPlayer : null;
      const newWinningCells = winCells ? winCells : [];
      const startTime = gameStartTime || Date.now();

      setBoard(newBoard);
      setIsBlackNext(nextTurn);
      setWinner(newWinner);
      setWinningCells(newWinningCells);
      setLastMove([row, col]);
      if (!gameStartTime) setGameStartTime(startTime);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isBlackNext: nextTurn,
            winner: newWinner,
            winningCells: newWinningCells,
            lastMove: [row, col],
            gameStartTime: startTime,
          },
        });
      }
    },
    [
      board,
      isBlackNext,
      winner,
      channel,
      opponentName,
      isPlayer1,
      gameStartTime,
    ],
  );

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setIsBlackNext(true);
    setWinner(null);
    setWinningCells([]);
    setLastMove(null);
    setGameStartTime(null);
    setElapsedTime(0);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  // Logic hiển thị nút Đổi phe (Swap)
  const moveCount = board.flat().filter(Boolean).length;
  const myColor = isPlayer1 ? "B" : "W";
  const currentTurnColor = isBlackNext ? "B" : "W";
  const canSwap =
    moveCount === 3 && myColor === "W" && currentTurnColor === "W" && !winner;

  const handleSwap = () => {
    setIsPlayer1(!isPlayer1);
    if (channel) {
      channel.send({ type: "broadcast", event: "swap-roles" });
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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "tham gia cùng đối thủ" : "bắt đầu và mời bạn bè"}.`}
          </p>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {hasInitialized
              ? "Cập nhật"
              : roomParam
                ? "Vào chơi ngay"
                : "Tạo phòng & Lấy link"}
          </button>
        </form>
      </Modal>

      <div className="grid w-full max-w-[1600px] flex-1 grid-cols-1 place-items-center gap-8 xl:grid-cols-[1fr_auto_1fr]">
        {/* Cột trái: Thông tin hiển thị & Các nút chức năng */}
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
            Cờ Caro (Gomoku)
          </h1>

          {!showNameModal && (
            <>
              {opponentName ? (
                <p className="text-sm text-zinc-500">
                  Trận đấu:{" "}
                  <span className="font-semibold text-zinc-800">
                    {isPlayer1 ? playerName : opponentName} (X)
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-zinc-800">
                    {!isPlayer1 ? playerName : opponentName} (O)
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
                        ? `🎉 Người chiến thắng: ${winner === "B" ? (isPlayer1 ? playerName : opponentName) : !isPlayer1 ? playerName : opponentName}!`
                        : `Lượt đi: ${isBlackNext ? (isPlayer1 ? "Bạn (X)" : opponentName + " (X)") : !isPlayer1 ? "Bạn (O)" : opponentName + " (O)"}`}
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
            {canSwap && (
              <button
                onClick={handleSwap}
                className="cursor-pointer rounded-full border border-amber-300 bg-amber-50 px-6 py-2 text-sm font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-100"
              >
                Đổi phe (Swap)
              </button>
            )}
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

        {/* Cột giữa: Khu vực bàn cờ caro */}
        <div
          className={`bg-white p-2 sm:p-4 rounded-sm shadow-xl transition-opacity ${!opponentName || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          <div
            className="grid gap-0 border border-zinc-800"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWinningCell = winningCells.some(
                  ([r, c]) => r === rowIndex && c === colIndex,
                );
                const isLastMove =
                  lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center border border-zinc-800/40 cursor-pointer transition-colors ${
                      !cell && !winner ? "hover:bg-black/10" : ""
                    } ${isWinningCell ? "bg-red-400/50" : isLastMove ? "bg-yellow-200" : ""}`}
                  >
                    {cell && (
                      <span
                        className={`font-bold text-xl sm:text-2xl leading-none ${
                          cell === "B" ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {cell === "B" ? "X" : "O"}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Cột phải: Khung trống để đảm bảo lưới Flex/Grid được căn chỉnh đối xứng */}
        <div className="hidden w-full xl:block"></div>
      </div>
    </main>
  );
}

export default function GomokuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ...
        </div>
      }
    >
      <GomokuGame />
    </Suspense>
  );
}
