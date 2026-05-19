"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHandPaper,
  FaHandRock,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaHandshake,
  FaTrophy,
  FaStar,
} from "react-icons/fa";
import toast from "react-hot-toast";

type Cell = { stones: number; quan: number };

// Mảng 12 phần tử đại diện cho bàn cờ Ô Ăn Quan
// 0 -> 4: 5 ô Dân của Người chơi 1
// 5: Ô Quan bên phải (Quan 1)
// 6 -> 10: 5 ô Dân của Người chơi 2
// 11: Ô Quan bên trái (Quan 2)
const INITIAL_BOARD: Cell[] = [
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 0, quan: 1 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 5, quan: 0 },
  { stones: 0, quan: 1 },
];

const createInitialBoard = () => INITIAL_BOARD.map((c) => ({ ...c }));
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CellContent = ({
  cell,
  isQuan,
  isDropping,
  isCaptured,
}: {
  cell: Cell;
  isQuan?: boolean;
  isDropping?: boolean;
  isCaptured?: boolean;
}) => {
  const MAX_PEBBLES = isQuan ? 30 : 15;
  const pebblesCount = Math.min(cell.stones, MAX_PEBBLES);
  const pebbles = Array.from({ length: pebblesCount });

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center pointer-events-none transition-all duration-300 ${isQuan ? "justify-start pt-2 sm:pt-4" : "justify-center"}`}
    >
      <AnimatePresence>
        {isDropping && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-0 bg-white/80 rounded-full"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDropping && (
          <motion.div
            initial={{ y: -20, opacity: 0, x: "-50%", rotate: 10 }}
            animate={{ y: 0, opacity: 1, x: "-50%", rotate: 0 }}
            exit={{ y: -10, opacity: 0, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className={`absolute left-1/2 z-50 text-4xl sm:text-5xl drop-shadow-md ${isQuan ? "top-0 sm:top-2" : "-top-2 sm:-top-4"}`}
          >
            <FaHandPaper className="text-amber-600 rotate-[160deg]" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCaptured && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <span className="text-yellow-400 font-black text-4xl sm:text-6xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
              <FaStar />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCaptured && (
          <motion.div
            initial={{ scale: 2, y: -40, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="absolute inset-0 z-50 flex items-center justify-center text-5xl sm:text-7xl drop-shadow-xl text-amber-700"
          >
            <FaHandRock />
          </motion.div>
        )}
      </AnimatePresence>

      {isQuan && (
        <motion.span
          key={`quan-number-${cell.stones + cell.quan * 10}`}
          initial={{ scale: 1.5, color: "#d97706" }}
          animate={{ scale: 1, color: "#451a03" }}
          className="relative z-10 font-bold text-sm sm:text-base text-amber-950 bg-white/70 px-2 py-0.5 rounded-md shadow-sm mb-2 border border-amber-900/20"
        >
          {cell.stones + cell.quan * 10}
        </motion.span>
      )}

      {cell.quan > 0 && (
        <div className="relative z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-zinc-800 border-4 border-zinc-600 mb-1 shadow-md" />
      )}
      {cell.stones > 0 ? (
        <>
          <div
            className={`relative z-10 flex flex-wrap justify-center content-center gap-[2px] sm:gap-1 ${isQuan ? "w-[70%]" : "w-[85%]"} mb-1`}
          >
            {pebbles.map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-stone-500 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.5)] border border-stone-700"
              />
            ))}
            {cell.stones > MAX_PEBBLES && (
              <span className="text-[10px] sm:text-xs font-bold text-stone-600 flex items-center">
                +
              </span>
            )}
          </div>
          <span className="font-bold text-lg sm:text-xl text-amber-950 bg-white/40 px-2 rounded-md shadow-sm">
            {cell.stones}
          </span>
        </>
      ) : (
        <span className="text-zinc-400 font-medium bg-white/30 px-2 rounded-md">
          -
        </span>
      )}
    </div>
  );
};

function OAnQuanGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [board, setBoard] = useState<Cell[]>(createInitialBoard());
  const [isP1Turn, setIsP1Turn] = useState<boolean>(true);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [captureIndices, setCaptureIndices] = useState<number[]>([]);
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
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

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

  const executeMoveAndAnimate = useCallback(
    async (startIndex: number, direction: "cw" | "ccw") => {
      setIsAnimating(true);
      setDropIndex(null);
      setCaptureIndices([]);
      const state = stateRef.current;
      const newBoard = state.board.map((c) => ({ ...c }));
      let currentIdx = startIndex;
      let stonesInHand = newBoard[currentIdx].stones;
      newBoard[currentIdx].stones = 0;

      let currentP1Score = state.p1Score;
      let currentP2Score = state.p2Score;
      const currentP1Turn = state.isP1Turn;
      let currentWinner = state.winner;

      setBoard([...newBoard]);
      await delay(300);

      const step = direction === "ccw" ? 1 : -1;
      const nextIndex = (i: number) => (i + step + 12) % 12;

      let isDistributing = true;

      while (isDistributing) {
        while (stonesInHand > 0) {
          currentIdx = nextIndex(currentIdx);
          newBoard[currentIdx].stones++;
          stonesInHand--;
          setBoard([...newBoard]);
          setDropIndex(currentIdx);
          await delay(300);
        }
        setDropIndex(null);

        const checkIdx = nextIndex(currentIdx);

        if (checkIdx === 5 || checkIdx === 11) {
          isDistributing = false;
        } else if (newBoard[checkIdx].stones > 0) {
          stonesInHand = newBoard[checkIdx].stones;
          newBoard[checkIdx].stones = 0;
          currentIdx = checkIdx;
          setBoard([...newBoard]);
          setDropIndex(currentIdx);
          await delay(300);
          setDropIndex(null);
        } else {
          isDistributing = false;

          let captureCheckIdx = checkIdx;
          let targetIdx = nextIndex(captureCheckIdx);

          while (
            newBoard[captureCheckIdx].stones === 0 &&
            (newBoard[targetIdx].stones > 0 || newBoard[targetIdx].quan > 0)
          ) {
            setCaptureIndices((prev) => [...prev, targetIdx]);
            await delay(300);

            const capturedStones = newBoard[targetIdx].stones;
            const capturedQuan = newBoard[targetIdx].quan;

            newBoard[targetIdx].stones = 0;
            newBoard[targetIdx].quan = 0;

            const points = capturedStones + capturedQuan * 10;
            if (currentP1Turn) currentP1Score += points;
            else currentP2Score += points;

            setP1Score(currentP1Score);
            setP2Score(currentP2Score);
            setBoard([...newBoard]);
            setCaptureIndices([]);
            await delay(400);

            captureCheckIdx = nextIndex(targetIdx);
            targetIdx = nextIndex(captureCheckIdx);
          }
        }
      }

      const nextTurnIsP1 = !currentP1Turn;

      if (
        newBoard[5].quan === 0 &&
        newBoard[5].stones === 0 &&
        newBoard[11].quan === 0 &&
        newBoard[11].stones === 0
      ) {
        for (let i = 0; i < 5; i++) {
          currentP1Score += newBoard[i].stones;
          newBoard[i].stones = 0;
        }
        for (let i = 6; i < 11; i++) {
          currentP2Score += newBoard[i].stones;
          newBoard[i].stones = 0;
        }
        currentWinner =
          currentP1Score > currentP2Score
            ? "P1"
            : currentP1Score < currentP2Score
              ? "P2"
              : "Draw";
        setBoard([...newBoard]);
        setP1Score(currentP1Score);
        setP2Score(currentP2Score);
      } else {
        if (nextTurnIsP1) {
          const p1Stones = newBoard
            .slice(0, 5)
            .reduce((sum, c) => sum + c.stones, 0);
          if (p1Stones === 0) {
            currentP1Score -= 5;
            for (let i = 0; i < 5; i++) newBoard[i].stones = 1;
            setBoard([...newBoard]);
            setP1Score(currentP1Score);
            await delay(400);
          }
        } else {
          const p2Stones = newBoard
            .slice(6, 11)
            .reduce((sum, c) => sum + c.stones, 0);
          if (p2Stones === 0) {
            currentP2Score -= 5;
            for (let i = 6; i < 11; i++) newBoard[i].stones = 1;
            setBoard([...newBoard]);
            setP2Score(currentP2Score);
            await delay(400);
          }
        }
      }

      setBoard(newBoard);
      setP1Score(currentP1Score);
      setP2Score(currentP2Score);
      setIsP1Turn(nextTurnIsP1);
      setWinner(currentWinner);
      setSelectedCell(null);
      setIsAnimating(false);

      if (channel && playerName === stateRef.current.hostName) {
        channel.send({
          type: "broadcast",
          event: "sync-move",
          payload: {
            board: newBoard,
            isP1Turn: nextTurnIsP1,
            p1Score: currentP1Score,
            p2Score: currentP2Score,
            winner: currentWinner,
            gameStartTime: stateRef.current.gameStartTime,
          },
        });
      }
    },
    [channel, playerName],
  );

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isP1Turn,
    p1Score,
    p2Score,
    winner,
    gameStarted,
    readyPlayers,
    gameStartTime,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      board,
      isP1Turn,
      p1Score,
      p2Score,
      winner,
      gameStarted,
      readyPlayers,
      gameStartTime,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    board,
    isP1Turn,
    p1Score,
    p2Score,
    winner,
    gameStarted,
    readyPlayers,
    gameStartTime,
  ]);

  const executeMoveAndAnimateRef = useRef(executeMoveAndAnimate);
  useEffect(() => {
    executeMoveAndAnimateRef.current = executeMoveAndAnimate;
  }, [executeMoveAndAnimate]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;
    const roomChannel = supabase.channel(`oanquan-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const data = payload.payload;
        setBoard(data.board);
        setIsP1Turn(data.isP1Turn);
        setP1Score(data.p1Score);
        setP2Score(data.p2Score);
        setWinner(data.winner);
        setSelectedCell(null);
        if (data.gameStartTime) setGameStartTime(data.gameStartTime);
      })
      .on("broadcast", { event: "play-animation" }, (payload) => {
        const { startIndex, direction } = payload.payload;
        if (executeMoveAndAnimateRef.current) {
          executeMoveAndAnimateRef.current(startIndex, direction);
        }
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setBoard(createInitialBoard());
        setIsP1Turn(true);
        setP1Score(0);
        setP2Score(0);
        setWinner(null);
        setSelectedCell(null);
        setGameStarted(false);
        setReadyPlayers([]);
        setGameStartTime(null);
        setElapsedTime(0);
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
              isP1Turn: state.isP1Turn,
              p1Score: state.p1Score,
              p2Score: state.p2Score,
              winner: state.winner,
              gameStarted: state.gameStarted,
              readyPlayers: [],
              gameStartTime: state.gameStartTime,
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
        setIsP1Turn(data.isP1Turn);
        setP1Score(data.p1Score);
        setP2Score(data.p2Score);
        setWinner(data.winner);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.gameStartTime !== undefined)
          setGameStartTime(data.gameStartTime);
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
        const { playerName: reqPlayer, newRole, targetSlot } = payload.payload;
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

  const handleCellClick = useCallback(
    (idx: number) => {
      if (winner || !gameStarted || isSpectator || isAnimating) return;
      if (idx === 5 || idx === 11) return; // Không được bốc Quân để đi

      const isP1 = isPlayer1;
      const currentTurnP1 = isP1Turn;
      if (isP1 !== currentTurnP1) return;

      // Kiểm tra vùng đất hợp lệ
      if (isP1Turn && (idx < 0 || idx > 4)) return;
      if (!isP1Turn && (idx < 6 || idx > 10)) return;

      if (board[idx].stones === 0) return;

      if (selectedCell === idx) setSelectedCell(null);
      else setSelectedCell(idx);
    },
    [
      board,
      winner,
      gameStarted,
      isSpectator,
      isPlayer1,
      isP1Turn,
      selectedCell,
      isAnimating,
    ],
  );

  const handleMove = useCallback(
    (startIndex: number, direction: "cw" | "ccw") => {
      if (winner || !gameStarted || isSpectator || isAnimating) return;

      setSelectedCell(null);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "play-animation",
          payload: { startIndex, direction },
        });
      }

      executeMoveAndAnimate(startIndex, direction);
    },
    [
      winner,
      gameStarted,
      isSpectator,
      isAnimating,
      channel,
      executeMoveAndAnimate,
    ],
  );

  const resetGame = () => {
    setBoard(createInitialBoard());
    setIsP1Turn(true);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setSelectedCell(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setGameStartTime(null);
    setElapsedTime(0);
    if (channel) {
      channel.send({ type: "broadcast", event: "reset-game" });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel) return;
    if (
      (targetName === player1Name || targetName === player2Name) &&
      gameStarted
    )
      return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    if (targetName === player1Name) {
      setPlayer1Name(null);
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
            player1Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter(
              (p) => p !== targetName,
            ),
          },
        });
      }, 50);
    } else if (targetName === player2Name) {
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
    const myColor = isPlayer1 ? "P1" : isPlayer2 ? "P2" : null;
    if (!myColor) return;

    const newWinner = myColor === "P1" ? "P2" : "P1";
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

  const renderMoveButtons = (idx: number) => {
    // Xác định xem ô này có đang nằm ở hàng dưới cùng trong góc nhìn hiện tại không
    const isBottomInView = isPlayer2
      ? idx >= 6 && idx <= 10
      : idx >= 0 && idx <= 4;
    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-2 sm:px-4 pointer-events-auto transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMove(idx, isBottomInView ? "cw" : "ccw");
          }}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-lg shadow hover:bg-zinc-200 text-zinc-700"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMove(idx, isBottomInView ? "ccw" : "cw");
          }}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-lg shadow hover:bg-zinc-200 text-zinc-700"
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };

  const getCellClass = (idx: number) => {
    const isP1Cell = idx >= 0 && idx <= 4;
    const isP2Cell = idx >= 6 && idx <= 10;
    const isHoverable = (isP1Cell && isP1Turn) || (isP2Cell && !isP1Turn);

    return `relative flex items-center justify-center flex-1 border-r-4 last:border-r-0 border-zinc-900 bg-[#F0D9B5] transition-colors ${
      selectedCell === idx
        ? "bg-amber-200"
        : isHoverable
          ? "hover:bg-amber-100 cursor-pointer"
          : ""
    }`;
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
              : `Vui lòng nhập tên của bạn để ${roomParam ? "bắt đầu trận Ô Ăn Quan" : "tạo phòng"}.`}
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

      <div className="grid w-full max-w-[1600px] flex-1 grid-cols-1 place-items-center gap-8 xl:grid-cols-[1fr_auto_1fr]">
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
            Ô Ăn Quan
          </h1>

          {!showNameModal && (
            <>
              {player1Name || player2Name ? (
                <div className="flex flex-col items-center gap-2 text-sm text-zinc-500 xl:items-start justify-center mb-4">
                  <span className="font-semibold text-zinc-700">Trận đấu:</span>
                  <div className="flex flex-col gap-1 items-center xl:items-start">
                    <span className="font-semibold text-zinc-800">
                      {player1Name || "..."}
                    </span>
                    <span className="font-bold text-zinc-400">VS</span>
                    <span className="font-semibold text-zinc-800">
                      {player2Name || "..."}
                    </span>
                  </div>
                  {playerName === hostName && !gameStarted && (
                    <button
                      onClick={() => {
                        if (player1Name && player1Name !== hostName)
                          handleKickPlayer(player1Name);
                        if (player2Name && player2Name !== hostName)
                          handleKickPlayer(player2Name);
                      }}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
                    >
                      Kick All (Trừ Host)
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex w-full flex-col items-center xl:items-start">
                  <p className="mb-3 text-sm text-zinc-500">
                    Đang chờ người chơi tham gia...
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
                  {isSpectator && !gameStarted && (
                    <div className="mt-4 w-full rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 text-center">
                      Vui lòng chọn ghế Người chơi ở khung bên phải để tham gia.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 w-full">
                {gameStarted ? (
                  <div className="w-full space-y-4 text-left xl:text-left text-center">
                    <div
                      className={`rounded-lg border-2 p-3 transition-colors ${isP1Turn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-zinc-800">
                            {player1Name} (Người chơi 1)
                          </span>
                          <span className="text-sm font-bold text-amber-600 mt-1">
                            Điểm: {p1Score}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`rounded-lg border-2 p-3 transition-colors ${!isP1Turn && !winner ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"}`}
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-zinc-800">
                            {player2Name} (Người chơi 2)
                          </span>
                          <span className="text-sm font-bold text-amber-600 mt-1">
                            Điểm: {p2Score}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center xl:text-left">
                      <div className="text-sm font-medium text-zinc-800 flex items-center">
                        {winner === "Draw" ? (
                          <>
                            <FaHandshake className="inline mr-2 text-zinc-500 text-lg" />
                            Hòa cờ!
                          </>
                        ) : winner ? (
                          <>
                            <FaTrophy className="inline mr-2 text-yellow-500 text-lg" />
                            Chiến thắng:{" "}
                            {winner === "P1" ? player1Name : player2Name}!
                          </>
                        ) : (
                          `Lượt đi: ${isP1Turn ? player1Name : player2Name}`
                        )}
                      </div>
                      <span className="text-2xl font-mono font-medium tracking-wider text-zinc-800">
                        {formatTime(elapsedTime)}
                      </span>
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

          <div className="mt-10 flex flex-wrap gap-4 justify-center xl:justify-start w-full">
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

        {/* Cột giữa: Khu vực bàn cờ */}
        <div className="flex w-full flex-col items-center pb-8">
          <div
            className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] shadow-xl transition-opacity bg-[#E6C697] border-4 border-[#8B5A2B] ${!gameStarted || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="flex flex-col items-center">
              <div className="flex flex-row w-[90vw] max-w-[800px] h-[150px] sm:h-[220px] rounded-[3rem] sm:rounded-[5rem] overflow-hidden border-4 border-zinc-900 shadow-inner bg-[#E6C697]">
                {/* Quan Trái */}
                <div
                  onClick={() => handleCellClick(isPlayer2 ? 5 : 11)}
                  className="relative flex items-center justify-center flex-[1.5] border-r-4 border-zinc-900 bg-[#F0D9B5] cursor-not-allowed"
                >
                  <CellContent
                    cell={board[isPlayer2 ? 5 : 11]}
                    isQuan={true}
                    isDropping={dropIndex === (isPlayer2 ? 5 : 11)}
                    isCaptured={captureIndices.includes(isPlayer2 ? 5 : 11)}
                  />
                </div>

                {/* Trung tâm */}
                <div className="flex flex-col flex-[4]">
                  {/* Hàng Trên */}
                  <div className="flex flex-1 border-b-4 border-zinc-900">
                    {(isPlayer2 ? [4, 3, 2, 1, 0] : [10, 9, 8, 7, 6]).map(
                      (idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCellClick(idx)}
                          className={getCellClass(idx)}
                        >
                          <CellContent
                            cell={board[idx]}
                            isDropping={dropIndex === idx}
                            isCaptured={captureIndices.includes(idx)}
                          />
                          {selectedCell === idx && renderMoveButtons(idx)}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Hàng Dưới */}
                  <div className="flex flex-1">
                    {(isPlayer2 ? [6, 7, 8, 9, 10] : [0, 1, 2, 3, 4]).map(
                      (idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCellClick(idx)}
                          className={getCellClass(idx)}
                        >
                          <CellContent
                            cell={board[idx]}
                            isDropping={dropIndex === idx}
                            isCaptured={captureIndices.includes(idx)}
                          />
                          {selectedCell === idx && renderMoveButtons(idx)}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Quan Phải */}
                <div
                  onClick={() => handleCellClick(isPlayer2 ? 11 : 5)}
                  className="relative flex items-center justify-center flex-[1.5] border-l-4 border-zinc-900 bg-[#F0D9B5] cursor-not-allowed"
                >
                  <CellContent
                    cell={board[isPlayer2 ? 11 : 5]}
                    isQuan={true}
                    isDropping={dropIndex === (isPlayer2 ? 11 : 5)}
                    isCaptured={captureIndices.includes(isPlayer2 ? 11 : 5)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin người xem */}
        <div className="w-full mt-8 xl:mt-0 xl:w-auto xl:justify-self-end xl:pl-8 flex flex-col">
          {/* Khung người chơi */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm min-w-[250px] w-full max-w-md mx-auto xl:mx-0 overflow-hidden flex flex-col mb-8">
            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-lg">🎮</span> Người chơi
              </h3>
              <span className="bg-zinc-200 text-zinc-700 py-1 px-2.5 rounded-full text-xs font-bold">
                {[player1Name, player2Name].filter(Boolean).length}/2
              </span>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-zinc-900">
                  Người chơi 1 (Đi trước)
                </h4>
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-2 rounded-lg">
                  {player1Name ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
                        {player1Name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-800 truncate">
                        {player1Name} {playerName === player1Name && "(Bạn)"}{" "}
                        {hostName === player1Name && "👑"}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSlotClick(1)}
                      className="text-sm text-zinc-500 hover:text-zinc-900 font-medium py-1 px-2 border border-dashed border-zinc-300 rounded hover:border-zinc-500 w-full text-left transition-colors"
                    >
                      + Tham gia (Người chơi 1)
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <h4 className="text-sm font-bold text-zinc-500">
                  Người chơi 2 (Đi sau)
                </h4>
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-2 rounded-lg">
                  {player2Name ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 border border-zinc-300">
                        {player2Name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-800 truncate">
                        {player2Name} {playerName === player2Name && "(Bạn)"}{" "}
                        {hostName === player2Name && "👑"}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSlotClick(2)}
                      className="text-sm text-zinc-500 hover:text-zinc-700 font-medium py-1 px-2 border border-dashed border-zinc-300 rounded hover:border-zinc-400 w-full text-left transition-colors"
                    >
                      + Tham gia (Người chơi 2)
                    </button>
                  )}
                </div>
              </div>

              {!isSpectator && (!gameStarted || winner) && (
                <button
                  onClick={handleBecomeSpectator}
                  className="mt-2 text-sm text-zinc-500 hover:text-zinc-700 underline text-center w-full"
                >
                  Rời ghế, trở thành khán giả
                </button>
              )}
            </div>
          </div>

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

export default function OAnQuanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải bàn cờ Ô Ăn Quan...
        </div>
      }
    >
      <OAnQuanGame />
    </Suspense>
  );
}
