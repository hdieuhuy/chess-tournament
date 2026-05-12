"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import confetti from "canvas-confetti";

const BOARD_SIZE = 10;
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

type Ship = {
  id: number;
  positions: [number, number][];
  size?: number;
  color?: string;
  orientation?: "H" | "V";
};
type Shot = { r: number; c: number; result: "hit" | "miss" };

const getInitialShips = (): Ship[] => [
  { id: 0, size: 5, positions: [], orientation: "H", color: "bg-blue-500" },
  { id: 1, size: 4, positions: [], orientation: "H", color: "bg-cyan-500" },
  { id: 2, size: 3, positions: [], orientation: "H", color: "bg-green-500" },
  { id: 3, size: 3, positions: [], orientation: "H", color: "bg-yellow-500" },
  { id: 4, size: 2, positions: [], orientation: "H", color: "bg-purple-500" },
];

function BattleshipGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [p1Ships, setP1Ships] = useState<Ship[]>([]);
  const [p2Ships, setP2Ships] = useState<Ship[]>([]);
  const [p1Shots, setP1Shots] = useState<Shot[]>([]);
  const [p2Shots, setP2Shots] = useState<Shot[]>([]);

  const [isPlayer1Turn, setIsPlayer1Turn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);

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
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

  // States sắp xếp thuyền
  const [myShips, setMyShips] = useState<Ship[]>(getInitialShips());
  const draggedShipRef = useRef<{ id: number; segment: number } | null>(null);
  const placedCount = myShips.filter((s) => s.positions.length > 0).length;

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
  }, []);

  const stateRef = useRef({
    hostName,
    player1Name,
    player2Name,
    spectators,
    p1Ships,
    p2Ships,
    p1Shots,
    p2Shots,
    isPlayer1Turn,
    winner,
    gameStartTime,
    gameStarted,
    readyPlayers,
  });

  useEffect(() => {
    stateRef.current = {
      hostName,
      player1Name,
      player2Name,
      spectators,
      p1Ships,
      p2Ships,
      p1Shots,
      p2Shots,
      isPlayer1Turn,
      winner,
      gameStartTime,
      gameStarted,
      readyPlayers,
    };
  }, [
    hostName,
    player1Name,
    player2Name,
    spectators,
    p1Ships,
    p2Ships,
    p1Shots,
    p2Shots,
    isPlayer1Turn,
    winner,
    gameStartTime,
    gameStarted,
    readyPlayers,
  ]);

  // Network Effect
  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`battleship-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const {
          p1Shots: s1,
          p2Shots: s2,
          isPlayer1Turn: pt,
          winner: w,
        } = payload.payload;
        setP1Shots(s1);
        setP2Shots(s2);
        setIsPlayer1Turn(pt);
        setWinner(w);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setP1Ships([]);
        setP2Ships([]);
        setP1Shots([]);
        setP2Shots([]);
        setIsPlayer1Turn(true);
        setWinner(null);
        setGameStarted(false);
        setReadyPlayers([]);
        setGameStartTime(null);
        setElapsedTime(0);
        setMyShips(getInitialShips());
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: readyPlayer, ships } = payload.payload;

        if (readyPlayer === stateRef.current.player1Name) {
          setP1Ships(ships);
        } else if (readyPlayer === stateRef.current.player2Name) {
          setP2Ships(ships);
        }

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
                    reason: "Phòng đã đủ 2 người chơi!",
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
              ...stateRef.current,
              player2Name: newP2,
              spectators: newSpecs,
              readyPlayers: state.readyPlayers,
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

        setP1Ships(data.p1Ships || []);
        setP2Ships(data.p2Ships || []);
        setP1Shots(data.p1Shots || []);
        setP2Shots(data.p2Shots || []);
        if (data.isPlayer1Turn !== undefined)
          setIsPlayer1Turn(data.isPlayer1Turn);

        setWinner(data.winner);
        if (data.gameStartTime) setGameStartTime(data.gameStartTime);
        if (data.gameStarted) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);

        if (playerName === data.player1Name && data.p1Ships?.length === 5) {
          setMyShips(data.p1Ships);
        }
        if (playerName === data.player2Name && data.p2Ships?.length === 5) {
          setMyShips(data.p2Ships);
        }
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

  // Effect thời gian
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

  // Pháo hoa chiến thắng
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
          payload: { oldName: playerName, newName },
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

  const handleShipClick = (id: number) => {
    if (gameStarted) return;
    setMyShips((prev) => {
      const ship = prev.find((s) => s.id === id);
      if (!ship || !ship.size) return prev;

      const newOrientation = ship.orientation === "H" ? "V" : "H";

      if (ship.positions.length === 0) {
        return prev.map((s) =>
          s.id === id ? { ...s, orientation: newOrientation } : s,
        );
      }

      const startR = ship.positions[0][0];
      const startC = ship.positions[0][1];

      if (newOrientation === "H" && startC + ship.size > BOARD_SIZE)
        return prev;
      if (newOrientation === "V" && startR + ship.size > BOARD_SIZE)
        return prev;

      const newPositions: [number, number][] = [];
      for (let i = 0; i < ship.size; i++) {
        newPositions.push(
          newOrientation === "H" ? [startR, startC + i] : [startR + i, startC],
        );
      }

      const overlap = prev.some((s) => {
        if (s.id === id) return false;
        return s.positions.some((pos) =>
          newPositions.some(
            (newPos) => newPos[0] === pos[0] && newPos[1] === pos[1],
          ),
        );
      });

      if (overlap) return prev;

      return prev.map((s) =>
        s.id === id
          ? { ...s, orientation: newOrientation, positions: newPositions }
          : s,
      );
    });
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    r: number,
    c: number,
  ) => {
    e.preventDefault();
    if (!draggedShipRef.current) return;
    const { id, segment } = draggedShipRef.current;
    draggedShipRef.current = null;

    const ship = myShips.find((s) => s.id === id);
    if (!ship || !ship.size || !ship.orientation) return;

    const startR = ship.orientation === "H" ? r : r - segment;
    const startC = ship.orientation === "H" ? c - segment : c;

    if (ship.orientation === "H" && startC + ship.size > BOARD_SIZE) return;
    if (ship.orientation === "V" && startR + ship.size > BOARD_SIZE) return;
    if (startR < 0 || startC < 0) return;

    const newPositions: [number, number][] = [];
    for (let i = 0; i < ship.size; i++) {
      newPositions.push(
        ship.orientation === "H" ? [startR, startC + i] : [startR + i, startC],
      );
    }

    const overlap = myShips.some((s) => {
      if (s.id === id) return false;
      return s.positions.some((pos) =>
        newPositions.some(
          (newPos) => newPos[0] === pos[0] && newPos[1] === pos[1],
        ),
      );
    });

    if (overlap) return;

    setMyShips((prev) =>
      prev.map((s) => (s.id === id ? { ...s, positions: newPositions } : s)),
    );
  };

  const handleRandomPlacement = () => {
    const newShips = [...myShips].map((s) => ({ ...s }));
    const tempBoard = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(false),
    );

    for (let i = 0; i < newShips.length; i++) {
      const ship = newShips[i];
      const size = ship.size!;
      let placed = false;
      while (!placed) {
        const isHorizontal = Math.random() < 0.5;
        const r = Math.floor(
          Math.random() * (isHorizontal ? BOARD_SIZE : BOARD_SIZE - size + 1),
        );
        const c = Math.floor(
          Math.random() * (isHorizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE),
        );

        let overlap = false;
        for (let j = 0; j < size; j++) {
          if (tempBoard[isHorizontal ? r : r + j][isHorizontal ? c + j : c]) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          const positions: [number, number][] = [];
          for (let j = 0; j < size; j++) {
            const rr = isHorizontal ? r : r + j;
            const cc = isHorizontal ? c + j : c;
            positions.push([rr, cc]);
            tempBoard[rr][cc] = true;
          }
          ship.positions = positions;
          ship.orientation = isHorizontal ? "H" : "V";
          placed = true;
        }
      }
    }

    setMyShips(newShips);
  };

  const handleResetPlacement = () => {
    setMyShips((prev) => prev.map((s) => ({ ...s, positions: [] })));
  };

  const handleStartClick = () => {
    if (!playerName || readyPlayers.includes(playerName)) return;
    if (!isSpectator && placedCount < 5) return;

    setReadyPlayers((prev) => [...prev, playerName]);
    if (isPlayer1) setP1Ships(myShips);
    if (isPlayer2) setP2Ships(myShips);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-ready",
        payload: { playerName, ships: myShips },
      });
    }
  };

  const handleShoot = (r: number, c: number) => {
    if (!gameStarted || winner || isSpectator) return;

    const isMyTurn =
      (isPlayer1 && isPlayer1Turn) || (isPlayer2 && !isPlayer1Turn);
    if (!isMyTurn) return;

    const myShots = isPlayer1 ? p1Shots : p2Shots;
    if (myShots.some((shot) => shot.r === r && shot.c === c)) return;

    const opponentShips = isPlayer1 ? p2Ships : p1Ships;
    let isHit = false;
    for (const ship of opponentShips) {
      if (ship.positions.some((pos) => pos[0] === r && pos[1] === c)) {
        isHit = true;
        break;
      }
    }

    const newShot: Shot = { r, c, result: isHit ? "hit" : "miss" };
    const newMyShots = [...myShots, newShot];

    let newP1Shots = p1Shots;
    let newP2Shots = p2Shots;
    if (isPlayer1) newP1Shots = newMyShots;
    else newP2Shots = newMyShots;

    // Tổng cộng 17 ô thuyền sẽ tương ứng với 17 cú bắn trúng
    const totalHits = newMyShots.filter((s) => s.result === "hit").length;
    let newWinner = winner;
    if (totalHits === 17) {
      newWinner = isPlayer1Turn ? player1Name : player2Name;
    }

    const nextTurn = isHit ? isPlayer1Turn : !isPlayer1Turn;

    setP1Shots(newP1Shots);
    setP2Shots(newP2Shots);
    setIsPlayer1Turn(nextTurn);
    if (newWinner) setWinner(newWinner);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "sync-move",
        payload: {
          p1Shots: newP1Shots,
          p2Shots: newP2Shots,
          isPlayer1Turn: nextTurn,
          winner: newWinner,
        },
      });
    }
  };

  const resetGame = () => {
    setP1Ships([]);
    setP2Ships([]);
    setP1Shots([]);
    setP2Shots([]);
    setIsPlayer1Turn(true);
    setWinner(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setGameStartTime(null);
    setElapsedTime(0);
    setMyShips(getInitialShips());

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

  const renderBoard = (
    title: string,
    ships: Ship[],
    shots: Shot[],
    onCellClick: (r: number, c: number) => void,
    hideShips: boolean,
    interactive: boolean,
    isMyBoardForPlacement: boolean = false,
  ) => {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-zinc-800 mb-4">{title}</h3>
        <div className="relative pl-6 pb-6">
          <div className="absolute top-0 bottom-6 left-0 flex w-6 flex-col text-sm font-bold text-zinc-500 select-none">
            {ROWS.map((n) => (
              <div key={n} className="flex flex-1 items-center justify-center">
                {n}
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-6 right-0 flex h-6 text-sm font-bold text-zinc-500 select-none">
            {COLS.map((l) => (
              <div key={l} className="flex flex-1 items-center justify-center">
                {l}
              </div>
            ))}
          </div>

          <div
            className={`relative grid grid-cols-10 grid-rows-10 w-[95vw] sm:w-[80vw] md:w-[42vh] md:max-w-[420px] aspect-square border-2 border-zinc-800 bg-[#E3F2FD] ${interactive ? "" : "pointer-events-none"}`}
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const r = Math.floor(i / BOARD_SIZE);
              const c = i % BOARD_SIZE;
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => onCellClick(r, c)}
                  onDragOver={(e) => {
                    if (isMyBoardForPlacement && !gameStarted) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => {
                    if (isMyBoardForPlacement && !gameStarted) {
                      handleDrop(e, r, c);
                    }
                  }}
                  className="border border-blue-200 relative flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors"
                />
              );
            })}

            {ships.map((ship) => {
              if (ship.positions.length === 0) return null;

              const isSunk =
                gameStarted &&
                ship.positions.every((p) =>
                  shots.some(
                    (s) => s.r === p[0] && s.c === p[1] && s.result === "hit",
                  ),
                );

              if (hideShips && !isSunk) return null;

              const startR = ship.positions[0][0];
              const startC = ship.positions[0][1];

              const size = ship.size || ship.positions.length;
              let isH = ship.orientation === "H";
              if (ship.positions.length > 1) {
                isH = ship.positions[0][0] === ship.positions[1][0];
              }

              const topPos = (startR * 100) / BOARD_SIZE;
              const leftPos = (startC * 100) / BOARD_SIZE;
              const widthPos = isH
                ? (size * 100) / BOARD_SIZE
                : 100 / BOARD_SIZE;
              const heightPos = isH
                ? 100 / BOARD_SIZE
                : (size * 100) / BOARD_SIZE;

              const shipClasses = [
                "absolute",
                isSunk ? "brightness-75" : "",
                ship.color || "bg-zinc-600",
                "rounded-sm",
                isMyBoardForPlacement && !gameStarted
                  ? "cursor-grab active:cursor-grabbing hover:brightness-110 shadow-md z-20"
                  : "pointer-events-none z-10",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={ship.id}
                  draggable={isMyBoardForPlacement && !gameStarted}
                  onDragStart={(e) => {
                    if (
                      isMyBoardForPlacement &&
                      !gameStarted &&
                      e.dataTransfer
                    ) {
                      e.dataTransfer.effectAllowed = "move";
                    }
                  }}
                  onClick={(e) => {
                    if (isMyBoardForPlacement && !gameStarted) {
                      e.stopPropagation();
                      handleShipClick(ship.id);
                    }
                  }}
                  className={shipClasses}
                  style={{
                    top: `${topPos}%`,
                    left: `${leftPos}%`,
                    width: `${widthPos}%`,
                    height: `${heightPos}%`,
                    padding: "2px",
                  }}
                >
                  <div
                    className={`flex ${isH ? "flex-row" : "flex-col"} w-full h-full`}
                  >
                    {Array.from({ length: size || 0 }).map((_, idx) => (
                      <div
                        key={`segment-${ship.id}-${idx}`}
                        className="flex-1 border border-white/20"
                        onMouseDown={() => {
                          if (isMyBoardForPlacement && !gameStarted) {
                            draggedShipRef.current = {
                              id: ship.id,
                              segment: idx,
                            };
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {shots.map((shot, idx) => {
              const topPos = (shot.r * 100) / BOARD_SIZE;
              const leftPos = (shot.c * 100) / BOARD_SIZE;
              const cellSpan = 100 / BOARD_SIZE;

              const isSunkCell = ships.some(
                (ship) =>
                  ship.positions.length > 0 &&
                  ship.positions.some(
                    (p) => p[0] === shot.r && p[1] === shot.c,
                  ) &&
                  ship.positions.every((p) =>
                    shots.some(
                      (s) => s.r === p[0] && s.c === p[1] && s.result === "hit",
                    ),
                  ),
              );

              return (
                <div
                  key={`shot-${idx}`}
                  className="absolute z-30 pointer-events-none flex items-center justify-center"
                  style={{
                    top: `${topPos}%`,
                    left: `${leftPos}%`,
                    width: `${cellSpan}%`,
                    height: `${cellSpan}%`,
                  }}
                >
                  {shot.result === "hit" ? (
                    <div
                      className={`flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 shadow-md ${!isSunkCell ? "animate-pulse" : ""}`}
                    >
                      {isSunkCell && (
                        <span className="text-white font-bold text-xs md:text-sm leading-none pointer-events-none select-none">
                          X
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-zinc-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12">
      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
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
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập tên..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
            autoFocus
          />
          {!hasInitialized && roomParam && (
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="player"
                  checked={requestedRole === "player"}
                  onChange={(e) =>
                    setRequestedRole(e.target.value as "player" | "spectator")
                  }
                />
                <span>Người chơi</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="spectator"
                  checked={requestedRole === "spectator"}
                  onChange={(e) =>
                    setRequestedRole(e.target.value as "player" | "spectator")
                  }
                />
                <span>Người xem</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      <div className="grid w-full max-w-[1600px] flex-1 grid-cols-1 place-items-center gap-8 xl:grid-cols-[1fr_auto_1fr]">
        {/* Cột trái: Thông tin hiển thị & Các nút chức năng */}
        <div className="mb-8 flex w-full max-w-md flex-col items-center text-center xl:mb-0 xl:items-start xl:justify-self-start xl:pl-8 xl:text-left">
          <h1 className="mb-2 text-3xl font-light tracking-tight text-zinc-900 font-[family-name:var(--font-playfair)]">
            Bắn Thuyền (Battleship)
          </h1>

          {!showNameModal && (
            <>
              {player2Name ? (
                <p className="text-sm text-zinc-500">
                  Trận đấu:{" "}
                  <span className="font-semibold text-blue-600">
                    {player1Name}
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-red-600">
                    {player2Name}
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

              {player2Name && (
                <div className="mt-6 flex w-full flex-col items-center space-y-3 xl:items-start">
                  {gameStarted ? (
                    <>
                      <div className="inline-block rounded-full border border-zinc-100 bg-white px-6 py-3 shadow-sm">
                        <p className="text-sm font-medium text-zinc-800">
                          {winner
                            ? `🎉 Chiến thắng: ${winner}!`
                            : `Lượt bắn: ${isPlayer1Turn ? player1Name : player2Name}`}
                        </p>
                      </div>

                      <div className="text-3xl font-mono font-medium tracking-wider text-zinc-800">
                        {formatTime(elapsedTime)}
                      </div>
                    </>
                  ) : (
                    !isSpectator && (
                      <div className="flex w-full flex-col items-center space-y-3 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm xl:items-start xl:text-left">
                        <div className="w-full flex flex-col items-center xl:items-start space-y-4">
                          <div
                            className="flex flex-col gap-4 w-full p-4 border-2 border-dashed border-zinc-300 rounded-lg bg-zinc-50/50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (!draggedShipRef.current) return;
                              const { id } = draggedShipRef.current;
                              draggedShipRef.current = null;
                              setMyShips((prev) =>
                                prev.map((s) =>
                                  s.id === id ? { ...s, positions: [] } : s,
                                ),
                              );
                            }}
                          >
                            <span className="text-sm font-medium text-zinc-700">
                              Kéo thả thuyền vào bảng. Nhấn vào thuyền để xoay
                              dọc/ngang.
                            </span>

                            <div className="flex flex-wrap gap-4 min-h-[60px] items-center">
                              {myShips
                                .filter((s) => s.positions.length === 0)
                                .map((ship) => (
                                  <div
                                    key={ship.id}
                                    draggable
                                    onDragStart={(e) => {
                                      if (e.dataTransfer) {
                                        e.dataTransfer.effectAllowed = "move";
                                      }
                                    }}
                                    onClick={() => handleShipClick(ship.id)}
                                    className={`flex ${ship.orientation === "H" ? "flex-row" : "flex-col"} cursor-grab active:cursor-grabbing hover:brightness-110 shadow-sm ${ship.color} rounded-sm p-[1px] transition-transform hover:-translate-y-1`}
                                  >
                                    {Array.from({ length: ship.size || 0 }).map(
                                      (_, idx) => (
                                        <div
                                          key={`unplaced-seg-${ship.id}-${idx}`}
                                          className="w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] border border-white/20"
                                          onMouseDown={() => {
                                            draggedShipRef.current = {
                                              id: ship.id,
                                              segment: idx,
                                            };
                                          }}
                                        />
                                      ),
                                    )}
                                  </div>
                                ))}
                              {placedCount === 5 && (
                                <p className="text-sm text-green-600 font-medium w-full text-center">
                                  Tất cả thuyền đã được đặt!
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex w-full gap-2 mt-2">
                            <button
                              onClick={handleResetPlacement}
                              disabled={placedCount === 0}
                              className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                            >
                              Xóa bàn
                            </button>
                            <button
                              onClick={handleRandomPlacement}
                              className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors"
                            >
                              Ngẫu nhiên
                            </button>
                          </div>

                          {placedCount === 5 && (
                            <button
                              onClick={handleStartClick}
                              disabled={readyPlayers.includes(playerName || "")}
                              className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                            >
                              {readyPlayers.includes(playerName || "")
                                ? "Chờ đối thủ..."
                                : "Sẵn sàng chiến đấu"}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex space-x-4">
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

        {/* Cột giữa: Bảng game */}
        <div className="flex flex-col items-center justify-center w-full pb-8">
          {!gameStarted && isSpectator && player2Name && (
            <div className="text-zinc-500 text-center w-full mb-8">
              Đang chờ người chơi xếp thuyền...
            </div>
          )}

          <div
            className={`flex flex-col md:flex-row gap-8 lg:gap-16 justify-center w-full transition-opacity ${!player2Name || showNameModal ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            {!gameStarted && !isSpectator ? (
              <>
                {/* Placement Board */}
                {renderBoard(
                  "Bảng của bạn",
                  myShips,
                  [],
                  () => {},
                  false,
                  true,
                  true,
                )}
                {/* Empty opponent board */}
                {renderBoard("Bảng đối thủ", [], [], () => {}, true, false)}
              </>
            ) : (
              <>
                {isPlayer1 &&
                  renderBoard(
                    "Bảng của bạn",
                    p1Ships,
                    p2Shots,
                    () => {},
                    false,
                    false,
                  )}
                {isPlayer1 &&
                  renderBoard(
                    "Bảng đối thủ",
                    p2Ships,
                    p1Shots,
                    (r, c) => handleShoot(r, c),
                    !winner,
                    true,
                  )}

                {isPlayer2 &&
                  renderBoard(
                    "Bảng của bạn",
                    p2Ships,
                    p1Shots,
                    () => {},
                    false,
                    false,
                  )}
                {isPlayer2 &&
                  renderBoard(
                    "Bảng đối thủ",
                    p1Ships,
                    p2Shots,
                    (r, c) => handleShoot(r, c),
                    !winner,
                    true,
                  )}

                {isSpectator &&
                  renderBoard(
                    `Bảng của ${player1Name}`,
                    p1Ships,
                    p2Shots,
                    () => {},
                    false,
                    false,
                  )}
                {isSpectator &&
                  renderBoard(
                    `Bảng của ${player2Name}`,
                    p2Ships,
                    p1Shots,
                    () => {},
                    false,
                    false,
                  )}
              </>
            )}
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
                  <li key={idx} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                      {spec.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">
                      {spec}
                    </span>
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

export default function BattleshipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải...
        </div>
      }
    >
      <BattleshipGame />
    </Suspense>
  );
}
