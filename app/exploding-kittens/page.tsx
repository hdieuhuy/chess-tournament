"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/Modal";
import { FaUser } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { CARD_DEFINITIONS, CardInstance } from "./constants";
import { Card } from "./Card";
import { dealCards } from "./utils";

function ExplodingKittensGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Multiplayer States
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  // Game Logic States (To be expanded)
  const [playerHands, setPlayerHands] = useState<
    Record<string, CardInstance[]>
  >({});
  const [drawPile, setDrawPile] = useState<CardInstance[]>([]);
  const [discardPile, setDiscardPile] = useState<CardInstance[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const myHand = playerHands[playerName] || [];

  const stateRef = useRef({
    hostName,
    players,
    spectators,
    gameStarted,
    readyPlayers,
    currentTurnIndex,
    winner,
    playerHands,
    drawPile,
    discardPile,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      players,
      spectators,
      gameStarted,
      readyPlayers,
      currentTurnIndex,
      winner,
      playerHands,
      drawPile,
      discardPile,
    };
  }, [
    hostName,
    players,
    spectators,
    gameStarted,
    readyPlayers,
    currentTurnIndex,
    winner,
    playerHands,
    drawPile,
    discardPile,
  ]);

  // Realtime channel setup
  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`exploding-kittens-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        if (data.hostName !== undefined) setHostName(data.hostName);
        if (data.players !== undefined) setPlayers(data.players);
        if (data.spectators !== undefined) setSpectators(data.spectators);
        if (data.readyPlayers !== undefined) setReadyPlayers(data.readyPlayers);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.currentTurnIndex !== undefined)
          setCurrentTurnIndex(data.currentTurnIndex);
        if (data.winner !== undefined) setWinner(data.winner);
        if (data.playerHands !== undefined) setPlayerHands(data.playerHands);
        if (data.drawPile !== undefined) setDrawPile(data.drawPile);
        if (data.discardPile !== undefined) setDiscardPile(data.discardPile);
      })
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newPlayers = [...state.players];
          const newSpecs = [...state.spectators];
          const maxPlayers = 5; // Exploding Kittens usually 2-5 players

          const isAlreadyPlayer = newPlayers.includes(newPlayer);
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              if (newPlayers.length < maxPlayers) {
                newPlayers.push(newPlayer);
                setPlayers(newPlayers);
                stateRef.current.players = newPlayers;
              } else {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: `Phòng đã đủ ${maxPlayers} người chơi!`,
                  },
                });
                return;
              }
            } else {
              newSpecs.push(newPlayer);
              setSpectators(newSpecs);
              stateRef.current.spectators = newSpecs;
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: { ...stateRef.current },
          });
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
        setPlayers([savedName]);
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
  }, [pathname, roomParam, router]);

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
        setPlayers([newName]);
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
      setPlayers((prev) => prev.map((p) => (p === playerName ? newName : p)));
    }
  };

  const handleStartGame = () => {
    if (playerName !== hostName) return;
    if (players.length < 2) {
      toast.error("Cần ít nhất 2 người chơi để bắt đầu!");
      return;
    }

    const { playerHands: initialHands, drawPile: initialDrawPile } =
      dealCards(players);

    const newGameState = {
      ...stateRef.current,
      gameStarted: true,
      playerHands: initialHands,
      drawPile: initialDrawPile,
      discardPile: [],
      currentTurnIndex: 0, // Người host đi trước
      winner: null,
    };

    // Cập nhật trạng thái cho host
    setGameStarted(newGameState.gameStarted);
    setPlayerHands(newGameState.playerHands);
    setDrawPile(newGameState.drawPile);
    setDiscardPile(newGameState.discardPile);
    setCurrentTurnIndex(newGameState.currentTurnIndex);

    // Gửi trạng thái game mới cho tất cả người chơi
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: newGameState,
      });
    }
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
            Vui lòng nhập tên của bạn để bắt đầu.
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
            {hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      <div className="flex w-full max-w-[1200px] flex-1 flex-col items-center gap-8">
        {/* Game Area */}
        <div className="flex w-full flex-col items-center justify-between min-h-[60vh] rounded-3xl border-4 border-red-500 bg-orange-100 p-8 shadow-xl">
          {gameStarted ? (
            <>
              {/* Other players area */}
              <div className="w-full text-center">
                <p className="font-semibold text-zinc-600">Đối thủ</p>
              </div>

              {/* Game board center (draw/discard piles) */}
              <div className="flex items-center gap-4">
                <div>
                  <Card
                    card={CARD_DEFINITIONS["exploding-kitten"]} // Just a placeholder visual
                    isFaceDown={true}
                  />
                  <p className="mt-2 text-center text-sm font-semibold text-zinc-600">
                    Bài rút ({drawPile.length})
                  </p>
                </div>
              </div>

              {/* Current Player's Hand */}
              <div className="flex flex-col items-center">
                <h3 className="mb-4 text-center text-lg font-semibold text-zinc-700">
                  Bài của bạn ({myHand.length})
                </h3>
                <div className="flex justify-center gap-2">
                  {myHand.map((cardInstance) => (
                    <Card
                      key={cardInstance.id}
                      card={CARD_DEFINITIONS[cardInstance.type]}
                      variantIndex={cardInstance.variantIndex}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-2xl font-black uppercase tracking-widest text-red-500/50">
                Lobby Mèo Nổ
              </div>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex w-full flex-col items-center md:items-start">
            <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900">
              Mèo Nổ (Exploding Kittens)
            </h1>
            {!gameStarted && (
              <div className="mt-4 flex w-full flex-col items-center md:items-start">
                <p className="mb-3 text-sm text-zinc-500">
                  Đang chờ người chơi tham gia ({players.length}/5)...
                </p>
                {playerName === hostName && (
                  <button
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    className="w-full cursor-pointer rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:bg-zinc-400"
                  >
                    {players.length < 2
                      ? "Cần ít nhất 2 người"
                      : "Bắt đầu Game"}
                  </button>
                )}
              </div>
            )}
            <div className="mt-8 flex w-full justify-center md:justify-start">
              <Link
                href="/"
                className="cursor-pointer rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Đổi trò chơi
              </Link>
            </div>
          </div>

          {/* Players List */}
          <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
              <h3 className="text-base font-semibold text-zinc-900">
                Người chơi
              </h3>
              <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700">
                {players.length}/5
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {players.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2"
                >
                  <span className="text-sm font-medium text-zinc-800">
                    {p} {p === hostName && "👑"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExplodingKittensPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <ExplodingKittensGame />
    </Suspense>
  );
}
