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
import { Ship, Shot } from "../types";
import { BOARD_SIZE, getInitialShips } from "../constants";

export type GamePhase = "waiting" | "placing" | "playing" | "ended";

interface BattleshipContextType {
  roomId: string;
  playerName: string;
  hostName: string | null;
  player1Name: string | null;
  player2Name: string | null;
  spectators: string[];
  
  p1Ships: Ship[];
  p2Ships: Ship[];
  p1Shots: Shot[];
  p2Shots: Shot[];
  isPlayer1Turn: boolean;
  winner: string | null;
  
  readyPlayers: string[];
  placingPlayers: string[];
  
  myShips: Ship[]; // Trạng thái tàu của mình khi đang đặt
  gameStartTime: number | null;
  elapsedTime: number;
  history: any[];
  undoRequestedBy: string | null;
  isSpectator: boolean;
  gamePhase: GamePhase;
  activeAnimation: { r: number; c: number; result: "hit" | "miss"; stage: "falling" | "exploding" } | null;
  
  handleShipClick: (id: number) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, r: number, c: number) => void;
  handleRandomPlacement: () => void;
  handleClearBoard: () => void;
  setDraggedShipRef: (ref: { id: number; segment: number } | null) => void;
  draggedShipRef: React.MutableRefObject<{ id: number; segment: number } | null>;
  
  handleShoot: (r: number, c: number) => void;
  handleReady: () => void; // Bước 1: Sẵn sàng tham gia
  handleFinishPlacement: () => void; // Bước 2: Hoàn tất xếp tàu
  
  handleResign: () => void;
  resetGame: () => void;
  handleKickPlayer: (targetName: string) => void;
  handleSlotClick: (targetSlot: 1 | 2) => void;
  handleBecomeSpectator: () => void;
  handleRequestUndo: () => void;
  handleAcceptUndo: () => void;
  handleRejectUndo: () => void;
}

const BattleshipContext = createContext<BattleshipContextType | undefined>(undefined);

export function BattleshipProvider({
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

  const [hostName, setHostName] = useState<string | null>(null);
  const [player1Name, setPlayer1Name] = useState<string | null>(null);
  const [player2Name, setPlayer2Name] = useState<string | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [p1Ships, setP1Ships] = useState<Ship[]>([]);
  const [p2Ships, setP2Ships] = useState<Ship[]>([]);
  const [p1Shots, setP1Shots] = useState<Shot[]>([]);
  const [p2Shots, setP2Shots] = useState<Shot[]>([]);

  const [isPlayer1Turn, setIsPlayer1Turn] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [undoRequestedBy, setUndoRequestedBy] = useState<string | null>(null);
  const [activeAnimation, setActiveAnimation] = useState<{ r: number; c: number; result: "hit" | "miss"; stage: "falling" | "exploding" } | null>(null);

  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [placingPlayers, setPlacingPlayers] = useState<string[]>([]);
  
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  
  const [myShips, setMyShips] = useState<Ship[]>(getInitialShips());
  const draggedShipRef = useRef<{ id: number; segment: number } | null>(null);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const isPlayer1 = playerName === player1Name;
  const isPlayer2 = playerName === player2Name;
  const isSpectator = spectators.includes(playerName);

  let gamePhase: GamePhase = "waiting";
  if (winner) {
    gamePhase = "ended";
  } else if (gameStarted) {
    gamePhase = "playing";
  } else if (player1Name && player2Name && readyPlayers.includes(player1Name) && readyPlayers.includes(player2Name)) {
    gamePhase = "placing";
  }

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
    readyPlayers,
    placingPlayers,
    gameStartTime,
    gameStarted,
    history,
    undoRequestedBy,
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
      readyPlayers,
      placingPlayers,
      gameStartTime,
      gameStarted,
      history,
      undoRequestedBy,
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
    readyPlayers,
    placingPlayers,
    gameStartTime,
    gameStarted,
    history,
    undoRequestedBy,
  ]);


  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    if (isCreator && !hostName) {
      setHostName(playerName);
      if (requestedRole === "player") setPlayer1Name(playerName);
      else setSpectators([playerName]);
    }

    const roomChannel = supabase.channel(`battleship-room-${roomId}`, {
      config: { broadcast: { self: true } },
    });

    roomChannel
      .on("broadcast", { event: "sync-move" }, (payload) => {
        const { p1Shots: s1, p2Shots: s2, isPlayer1Turn: pt, winner: w, history: h } = payload.payload;
        setP1Shots(s1);
        setP2Shots(s2);
        setIsPlayer1Turn(pt);
        setWinner(w);
        if (h) setHistory(h);
        setUndoRequestedBy(null);
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
        setPlacingPlayers([]);
        setGameStartTime(null);
        setElapsedTime(0);
        setMyShips(getInitialShips());
        setHistory([]);
        setUndoRequestedBy(null);
      })
      .on("broadcast", { event: "player-ready" }, (payload) => {
        const { playerName: rp } = payload.payload;
        setReadyPlayers((prev) => (prev.includes(rp) ? prev : [...prev, rp]));
      })
      .on("broadcast", { event: "player-placing" }, (payload) => {
        const { playerName: pp, ships } = payload.payload;
        if (pp === stateRef.current.player1Name) {
          setP1Ships(ships);
        } else if (pp === stateRef.current.player2Name) {
          setP2Ships(ships);
        }
        setPlacingPlayers((prev) => (prev.includes(pp) ? prev : [...prev, pp]));
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        setGameStarted(true);
        setGameStartTime(payload.payload.gameStartTime);
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
        setHostName(data.hostName);
        setPlayer1Name(data.player1Name);
        setPlayer2Name(data.player2Name);
        setSpectators(data.spectators || []);

        setP1Ships(data.p1Ships || []);
        setP2Ships(data.p2Ships || []);
        setP1Shots(data.p1Shots || []);
        setP2Shots(data.p2Shots || []);
        if (data.isPlayer1Turn !== undefined) setIsPlayer1Turn(data.isPlayer1Turn);

        setWinner(data.winner || null);
        if (data.gameStartTime !== undefined) setGameStartTime(data.gameStartTime);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.readyPlayers) setReadyPlayers(data.readyPlayers);
        if (data.placingPlayers) setPlacingPlayers(data.placingPlayers);
        if (data.history) setHistory(data.history);
        if (data.undoRequestedBy !== undefined) setUndoRequestedBy(data.undoRequestedBy);

        if (playerName === data.player1Name && data.p1Ships?.length === 5) setMyShips(data.p1Ships);
        if (playerName === data.player2Name && data.p2Ships?.length === 5) setMyShips(data.p2Ships);
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
            const newPlacingPlayers = state.placingPlayers.filter((p) => p !== reqPlayer);

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
              setPlacingPlayers(newPlacingPlayers);

              stateRef.current.player1Name = newP1;
              stateRef.current.player2Name = newP2;
              stateRef.current.spectators = newSpecs;
              stateRef.current.readyPlayers = newReadyPlayers;
              stateRef.current.placingPlayers = newPlacingPlayers;

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
            const newPlacingPlayers = state.placingPlayers.filter((p) => p !== reqPlayer);

            setPlayer1Name(newP1);
            setPlayer2Name(newP2);
            setSpectators(newSpecs);
            setReadyPlayers(newReadyPlayers);
            setPlacingPlayers(newPlacingPlayers);

            stateRef.current.player1Name = newP1;
            stateRef.current.player2Name = newP2;
            stateRef.current.spectators = newSpecs;
            stateRef.current.readyPlayers = newReadyPlayers;
            stateRef.current.placingPlayers = newPlacingPlayers;

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
        const newPlacingPlayers = state.placingPlayers.filter((p) => p !== leavingPlayer);

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newP1 || newP2 || newSpecs[0] || null;
        }

        setPlayer1Name(newP1);
        setPlayer2Name(newP2);
        setSpectators(newSpecs);
        setReadyPlayers(newReadyPlayers);
        setPlacingPlayers(newPlacingPlayers);
        setHostName(newHostName);

        stateRef.current.player1Name = newP1;
        stateRef.current.player2Name = newP2;
        stateRef.current.spectators = newSpecs;
        stateRef.current.readyPlayers = newReadyPlayers;
        stateRef.current.placingPlayers = newPlacingPlayers;
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

    const p1Ready = placingPlayers.includes(player1Name);
    const p2Ready = placingPlayers.includes(player2Name);

    if (p1Ready && p2Ready && playerName === hostName) {
      const startTime = Date.now();
      setGameStarted(true);
      setGameStartTime(startTime);
      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: { gameStartTime: startTime },
      });
    }
  }, [placingPlayers, player1Name, player2Name, gameStarted, playerName, hostName, channel]);

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

  const handleShipClick = useCallback((id: number) => {
    if (gamePhase !== "placing") return;
    setMyShips((prev) => {
      const ship = prev.find((s) => s.id === id);
      if (!ship || !ship.size) return prev;
      const newOrientation = ship.orientation === "H" ? "V" : "H";

      if (ship.positions.length === 0) {
        return prev.map((s) => (s.id === id ? { ...s, orientation: newOrientation } : s));
      }

      const startR = ship.positions[0][0];
      const startC = ship.positions[0][1];

      if (newOrientation === "H" && startC + ship.size > BOARD_SIZE) return prev;
      if (newOrientation === "V" && startR + ship.size > BOARD_SIZE) return prev;

      const newPositions: [number, number][] = [];
      for (let i = 0; i < ship.size; i++) {
        newPositions.push(newOrientation === "H" ? [startR, startC + i] : [startR + i, startC]);
      }

      const overlap = prev.some((s) => {
        if (s.id === id) return false;
        return s.positions.some((pos) => newPositions.some((newPos) => newPos[0] === pos[0] && newPos[1] === pos[1]));
      });

      if (overlap) return prev;

      return prev.map((s) => (s.id === id ? { ...s, orientation: newOrientation, positions: newPositions } : s));
    });
  }, [gamePhase]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, r: number, c: number) => {
    e.preventDefault();
    if (gamePhase !== "placing") return;
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
      newPositions.push(ship.orientation === "H" ? [startR, startC + i] : [startR + i, startC]);
    }

    const overlap = myShips.some((s) => {
      if (s.id === id) return false;
      return s.positions.some((pos) => newPositions.some((newPos) => newPos[0] === pos[0] && newPos[1] === pos[1]));
    });

    if (overlap) return;

    setMyShips((prev) => prev.map((s) => (s.id === id ? { ...s, positions: newPositions } : s)));
  }, [gamePhase, myShips]);

  const handleRandomPlacement = useCallback(() => {
    if (gamePhase !== "placing") return;
    const newShips = [...myShips].map((s) => ({ ...s }));
    const tempBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    for (let i = 0; i < newShips.length; i++) {
      const ship = newShips[i];
      const size = ship.size!;
      let placed = false;
      while (!placed) {
        const isHorizontal = Math.random() < 0.5;
        const r = Math.floor(Math.random() * (isHorizontal ? BOARD_SIZE : BOARD_SIZE - size + 1));
        const c = Math.floor(Math.random() * (isHorizontal ? BOARD_SIZE - size + 1 : BOARD_SIZE));

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
  }, [gamePhase, myShips]);

  const hasRandomizedInitialRef = useRef(false);

  useEffect(() => {
    if (gamePhase === "placing" && !hasRandomizedInitialRef.current) {
      hasRandomizedInitialRef.current = true;
      handleRandomPlacement();
    } else if (gamePhase !== "placing") {
      hasRandomizedInitialRef.current = false;
    }
  }, [gamePhase, handleRandomPlacement]);

  const handleClearBoard = useCallback(() => {
    if (gamePhase !== "placing") return;
    setMyShips((prev) => prev.map((s) => ({ ...s, positions: [] })));
  }, [gamePhase]);

  const handleReady = () => {
    if (gamePhase !== "waiting") return;
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

  const handleFinishPlacement = () => {
    if (gamePhase !== "placing") return;
    const placedCount = myShips.filter((s) => s.positions.length > 0).length;
    if (placedCount < 5) {
      toast.error("Vui lòng đặt tất cả 5 tàu lên bàn!");
      return;
    }
    if (placingPlayers.includes(playerName)) return;

    if (isPlayer1) setP1Ships(myShips);
    else if (isPlayer2) setP2Ships(myShips);

    setPlacingPlayers((prev) => [...prev, playerName]);
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-placing",
        payload: { playerName, ships: myShips },
      });
    }
  };

  const checkWinner = (s1: Shot[], s2: Shot[]) => {
    let newWinner = null;
    const p1Sunk = p2Ships.every((ship) =>
      ship.positions.every((p) => s1.some((s) => s.r === p[0] && s.c === p[1] && s.result === "hit"))
    );
    if (p1Sunk) newWinner = "P1";

    const p2Sunk = p1Ships.every((ship) =>
      ship.positions.every((p) => s2.some((s) => s.r === p[0] && s.c === p[1] && s.result === "hit"))
    );
    if (p2Sunk) newWinner = newWinner === "P1" ? "Draw" : "P2";

    return newWinner;
  };

  const handleShoot = useCallback((r: number, c: number) => {
    if (gamePhase !== "playing" || winner || isSpectator) return;
    if (isPlayer1 && !isPlayer1Turn) return;
    if (isPlayer2 && isPlayer1Turn) return;

    const myShots = isPlayer1 ? p1Shots : p2Shots;
    const enemyShips = isPlayer1 ? p2Ships : p1Ships;

    if (myShots.some((s) => s.r === r && s.c === c)) return;

    let hit = false;
    for (const ship of enemyShips) {
      if (ship.positions.some((p) => p[0] === r && p[1] === c)) {
        hit = true;
        break;
      }
    }

    setActiveAnimation({ r, c, result: hit ? "hit" : "miss", stage: "falling" });

    setTimeout(() => {
      setActiveAnimation({ r, c, result: hit ? "hit" : "miss", stage: "exploding" });
      setTimeout(() => {
        setActiveAnimation(null);

        const newShot: Shot = { r, c, result: hit ? "hit" : "miss" };
        const newMyShots = [...myShots, newShot];
        const newS1 = isPlayer1 ? newMyShots : p1Shots;
        const newS2 = isPlayer2 ? newMyShots : p2Shots;

        const currentState = {
          p1Shots,
          p2Shots,
          isPlayer1Turn,
          winner,
        };
        const newHistory = [...history, currentState];
        setHistory(newHistory);

        const newWinner = checkWinner(newS1, newS2);
        const newTurn = hit ? isPlayer1Turn : !isPlayer1Turn;

        if (isPlayer1) setP1Shots(newMyShots);
        else setP2Shots(newMyShots);

        setIsPlayer1Turn(newTurn);
        if (newWinner) setWinner(newWinner);

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "sync-move",
            payload: {
              p1Shots: newS1,
              p2Shots: newS2,
              isPlayer1Turn: newTurn,
              winner: newWinner,
              history: newHistory,
            },
          });
        }
      }, 500);
    }, 350);
  }, [gamePhase, winner, isSpectator, isPlayer1, isPlayer2, isPlayer1Turn, p1Shots, p2Shots, p1Ships, p2Ships, history, channel]);

  const handleResign = () => {
    if (gamePhase !== "playing" || winner || isSpectator) return;
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

  const resetGame = () => {
    setP1Ships([]);
    setP2Ships([]);
    setP1Shots([]);
    setP2Shots([]);
    setIsPlayer1Turn(true);
    setWinner(null);
    setGameStarted(false);
    setReadyPlayers([]);
    setPlacingPlayers([]);
    setGameStartTime(null);
    setElapsedTime(0);
    setMyShips(getInitialShips());
    setHistory([]);
    setUndoRequestedBy(null);

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
      setPlacingPlayers((prev) => prev.filter((p) => p !== targetName));
      if (gameStarted) resetGame();
      setTimeout(() => {
        channel.send({
          type: "broadcast",
          event: "room-sync",
          payload: {
            ...stateRef.current,
            player2Name: null,
            readyPlayers: stateRef.current.readyPlayers.filter((p) => p !== targetName),
            placingPlayers: stateRef.current.placingPlayers.filter((p) => p !== targetName),
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

      setP1Shots(prevState.p1Shots);
      setP2Shots(prevState.p2Shots);
      setIsPlayer1Turn(prevState.isPlayer1Turn);
      setWinner(prevState.winner);
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

  const setDraggedShipRef = useCallback((ref: { id: number; segment: number } | null) => {
    draggedShipRef.current = ref;
  }, []);

  return (
    <BattleshipContext.Provider
      value={{
        roomId,
        playerName,
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
        readyPlayers,
        placingPlayers,
        myShips,
        gameStartTime,
        elapsedTime,
        history,
        undoRequestedBy,
        isSpectator,
        gamePhase,
        activeAnimation,
        handleShipClick,
        handleDrop,
        handleRandomPlacement,
        handleClearBoard,
        setDraggedShipRef,
        draggedShipRef,
        handleShoot,
        handleReady,
        handleFinishPlacement,
        handleResign,
        resetGame,
        handleKickPlayer,
        handleSlotClick,
        handleBecomeSpectator,
        handleRequestUndo,
        handleAcceptUndo,
        handleRejectUndo,
      }}
    >
      {children}
    </BattleshipContext.Provider>
  );
}

export function useBattleship() {
  const context = useContext(BattleshipContext);
  if (context === undefined) {
    throw new Error("useBattleship must be used within a BattleshipProvider");
  }
  return context;
}
