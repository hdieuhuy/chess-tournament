/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import { FaCrown, FaGhost, FaMoon, FaSun, FaEye, FaUser } from "react-icons/fa";
import {
  GiWolfHead,
  GiFarmer,
  GiShield,
  GiWitchFlight,
  GiMusket,
} from "react-icons/gi";

type RoleConfig = {
  id: string;
  name: string;
  count: number;
};

type ActionLog = {
  id: string;
  dayCount: number;
  roleId: string;
  playerName: string;
  content: string;
};

type ChatMessage = {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
};

const RoleIcon = ({ id, className }: { id?: string; className?: string }) => {
  switch (id) {
    case "werewolf":
      return <GiWolfHead className={className} />;
    case "villager":
      return <GiFarmer className={className} />;
    case "seer":
      return <FaEye className={className} />;
    case "bodyguard":
      return <GiShield className={className} />;
    case "witch":
      return <GiWitchFlight className={className} />;
    case "hunter":
      return <GiMusket className={className} />;
    default:
      return null;
  }
};

const getRoleColor = (id?: string) => {
  switch (id) {
    case "werewolf":
      return "text-red-600";
    case "villager":
      return "text-emerald-600";
    case "seer":
      return "text-purple-600";
    case "bodyguard":
      return "text-blue-600";
    case "witch":
      return "text-fuchsia-600";
    case "hunter":
      return "text-orange-600";
    default:
      return "text-zinc-500";
  }
};

const defaultRoles: RoleConfig[] = [
  { id: "werewolf", name: "Sói", count: 1 },
  { id: "villager", name: "Dân Làng", count: 3 },
  { id: "seer", name: "Tiên Tri", count: 1 },
  { id: "bodyguard", name: "Bảo Vệ", count: 1 },
  { id: "witch", name: "Phù Thủy", count: 0 },
  { id: "hunter", name: "Thợ Săn", count: 0 },
];

const getNextNightPhase = (
  currentPhase: string | null,
  currentAlive: string[],
  roles: Record<string, RoleConfig>,
) => {
  const nightPhaseOrder = ["bodyguard", "werewolf", "seer", "witch", "hunter"];
  const startIndex = currentPhase
    ? nightPhaseOrder.indexOf(currentPhase) + 1
    : 0;
  for (let i = startIndex; i < nightPhaseOrder.length; i++) {
    const role = nightPhaseOrder[i];
    const hasAlive = currentAlive.some((p) => roles[p]?.id === role);
    if (hasAlive) return role;
  }
  return null;
};

function WerewolfGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  const [hostName, setHostName] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [roleConfig, setRoleConfig] = useState<RoleConfig[]>(defaultRoles);
  const [playerRoles, setPlayerRoles] = useState<Record<string, RoleConfig>>(
    {},
  );

  const [nightPhase, setNightPhase] = useState<string | null>(null);
  const [nightTimeLeft, setNightTimeLeft] = useState<number>(0);
  const [confirmedPlayers, setConfirmedPlayers] = useState<string[]>([]);

  const [phase, setPhase] = useState<"lobby" | "role_reveal" | "night" | "day">(
    "lobby",
  );
  const [dayCount, setDayCount] = useState<number>(0);
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);
  const [lastProtected, setLastProtected] = useState<string | null>(null);

  const [witchPotions, setWitchPotions] = useState<{
    heal: number;
    poison: number;
  }>({ heal: 1, poison: 1 });
  const [wolfVotes, setWolfVotes] = useState<Record<string, string>>({});
  const [wolfVictim, setWolfVictim] = useState<string | null>(null);
  const [hunterTarget, setHunterTarget] = useState<string | null>(null);
  const [witchAction, setWitchAction] = useState<{
    heal: boolean;
    poison: string | null;
  }>({ heal: false, poison: null });

  const [deadThisNight, setDeadThisNight] = useState<string[]>([]);

  const [nightSelection, setNightSelection] = useState<string | null>(null);
  const [actionConfirmed, setActionConfirmed] = useState<boolean>(false);
  const [seerResult, setSeerResult] = useState<{
    name: string;
    isWolf: boolean;
  } | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<"night" | "day">("night");

  const [wolfChat, setWolfChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");

  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">(
    "player",
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef({
    hostName,
    players,
    spectators,
    gameStarted,
    roleConfig,
    playerRoles,
    phase,
    dayCount,
    alivePlayers,
    lastProtected,
    witchPotions,
    wolfVotes,
    wolfVictim,
    hunterTarget,
    witchAction,
    deadThisNight,
    nightPhase,
    nightTimeLeft,
    confirmedPlayers,
    actionLogs,
    wolfChat,
  });
  useEffect(() => {
    stateRef.current = {
      hostName,
      players,
      spectators,
      gameStarted,
      roleConfig,
      playerRoles,
      phase,
      dayCount,
      alivePlayers,
      lastProtected,
      witchPotions,
      wolfVotes,
      wolfVictim,
      hunterTarget,
      witchAction,
      deadThisNight,
      nightPhase,
      nightTimeLeft,
      confirmedPlayers,
      actionLogs,
      wolfChat,
    };
  }, [
    hostName,
    players,
    spectators,
    gameStarted,
    roleConfig,
    playerRoles,
    phase,
    dayCount,
    alivePlayers,
    lastProtected,
    witchPotions,
    wolfVotes,
    wolfVictim,
    hunterTarget,
    witchAction,
    deadThisNight,
    nightPhase,
    nightTimeLeft,
    confirmedPlayers,
    actionLogs,
    wolfChat,
  ]);

  useEffect(() => {
    if (!roomId || !playerName || !hasInitialized) return;

    const roomChannel = supabase.channel(`werewolf-room-${roomId}`);

    roomChannel
      .on("broadcast", { event: "request-join" }, (payload) => {
        const { playerName: newPlayer, requestedRole: role } = payload.payload;
        const state = stateRef.current;

        if (state.hostName === playerName) {
          const newPlayers = [...state.players];
          const newSpecs = [...state.spectators];

          const isAlreadyPlayer = newPlayers.includes(newPlayer);
          const isAlreadySpec = newSpecs.includes(newPlayer);

          if (!isAlreadyPlayer && !isAlreadySpec) {
            if (role === "player") {
              newPlayers.push(newPlayer);
              setPlayers(newPlayers);
              stateRef.current.players = newPlayers;
            } else {
              newSpecs.push(newPlayer);
              setSpectators(newSpecs);
              stateRef.current.spectators = newSpecs;
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: {
              hostName: state.hostName,
              players: newPlayers,
              spectators: newSpecs,
              gameStarted: state.gameStarted,
              roleConfig: state.roleConfig,
              playerRoles: state.playerRoles,
              phase: state.phase,
              dayCount: state.dayCount,
              alivePlayers: state.alivePlayers,
              lastProtected: state.lastProtected,
              witchPotions: state.witchPotions,
              wolfVotes: state.wolfVotes,
              wolfVictim: state.wolfVictim,
              hunterTarget: state.hunterTarget,
              witchAction: state.witchAction,
              deadThisNight: state.deadThisNight,
              nightPhase: state.nightPhase,
              nightTimeLeft: state.nightTimeLeft,
              confirmedPlayers: state.confirmedPlayers,
              actionLogs: state.actionLogs,
              wolfChat: state.wolfChat,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        setHostName(data.hostName);
        setPlayers(data.players || []);
        setSpectators(data.spectators || []);
        if (data.gameStarted !== undefined) setGameStarted(data.gameStarted);
        if (data.roleConfig) setRoleConfig(data.roleConfig);
        if (data.playerRoles) setPlayerRoles(data.playerRoles);
        if (data.phase) setPhase(data.phase);
        if (data.dayCount !== undefined) setDayCount(data.dayCount);
        if (data.alivePlayers) setAlivePlayers(data.alivePlayers);
        if (data.lastProtected !== undefined)
          setLastProtected(data.lastProtected);
        if (data.witchPotions) setWitchPotions(data.witchPotions);
        if (data.wolfVotes) setWolfVotes(data.wolfVotes);
        if (data.wolfVictim !== undefined) setWolfVictim(data.wolfVictim);
        if (data.hunterTarget !== undefined) setHunterTarget(data.hunterTarget);
        if (data.witchAction) setWitchAction(data.witchAction);
        if (data.deadThisNight) setDeadThisNight(data.deadThisNight);
        if (data.nightPhase !== undefined) setNightPhase(data.nightPhase);
        if (data.nightTimeLeft !== undefined)
          setNightTimeLeft(data.nightTimeLeft);
        if (data.confirmedPlayers) setConfirmedPlayers(data.confirmedPlayers);
        if (data.actionLogs) setActionLogs(data.actionLogs);
        if (data.wolfChat) setWolfChat(data.wolfChat);
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        const data = payload.payload;
        setGameStarted(true);
        if (data.playerRoles) setPlayerRoles(data.playerRoles);
        if (data.phase) setPhase(data.phase);
        if (data.dayCount !== undefined) setDayCount(data.dayCount);
        if (data.alivePlayers) setAlivePlayers(data.alivePlayers);
        if (data.lastProtected !== undefined)
          setLastProtected(data.lastProtected);
        if (data.witchPotions) setWitchPotions(data.witchPotions);
        if (data.wolfVotes) setWolfVotes(data.wolfVotes);
        if (data.wolfVictim !== undefined) setWolfVictim(data.wolfVictim);
        if (data.hunterTarget !== undefined) setHunterTarget(data.hunterTarget);
        if (data.witchAction) setWitchAction(data.witchAction);
        if (data.deadThisNight) setDeadThisNight(data.deadThisNight);
        setNightSelection(null);
        setActionConfirmed(false);
        setSeerResult(null);
        setNightPhase(null);
        setNightTimeLeft(0);
        setConfirmedPlayers([]);
        setActionLogs([]);
        setWolfChat([]);
      })
      .on("broadcast", { event: "reset-game" }, () => {
        setGameStarted(false);
        setPlayerRoles({});
        setPhase("lobby");
        setDayCount(0);
        setAlivePlayers([]);
        setLastProtected(null);
        setNightSelection(null);
        setActionConfirmed(false);
        setSeerResult(null);
        setWitchPotions({ heal: 1, poison: 1 });
        setWolfVotes({});
        setWolfVictim(null);
        setHunterTarget(null);
        setWitchAction({ heal: false, poison: null });
        setDeadThisNight([]);
        setNightPhase(null);
        setNightTimeLeft(0);
        setConfirmedPlayers([]);
        setActionLogs([]);
        setWolfChat([]);
      })
      .on("broadcast", { event: "add-log" }, (payload) => {
        setActionLogs((prev) => [...prev, payload.payload.log]);
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        setHostName((prev) => (prev === oldName ? newName : prev));
        setPlayers((prev) => prev.map((p) => (p === oldName ? newName : p)));
        setSpectators((prev) => prev.map((s) => (s === oldName ? newName : s)));
      })
      .on("broadcast", { event: "update-roles" }, (payload) => {
        setRoleConfig(payload.payload.roleConfig);
      })
      .on("broadcast", { event: "phase-change" }, (payload) => {
        const data = payload.payload;
        if (data.phase) setPhase(data.phase);
        if (data.dayCount !== undefined) setDayCount(data.dayCount);
        if (data.alivePlayers) setAlivePlayers(data.alivePlayers);
        if (data.witchPotions) setWitchPotions(data.witchPotions);
        if (data.deadThisNight) setDeadThisNight(data.deadThisNight);
        if (data.nightPhase !== undefined) setNightPhase(data.nightPhase);
        if (data.nightTimeLeft !== undefined)
          setNightTimeLeft(data.nightTimeLeft);
        if (data.confirmedPlayers) setConfirmedPlayers(data.confirmedPlayers);
        if (data.actionLogs) setActionLogs(data.actionLogs);

        setNightSelection(null);
        setActionConfirmed(false);
        setSeerResult(null);
        setWolfVotes({});
        setWolfVictim(null);
        setWitchAction({ heal: false, poison: null });
      })
      .on("broadcast", { event: "night-phase-change" }, (payload) => {
        setNightPhase(payload.payload.nightPhase);
        setNightTimeLeft(payload.payload.nightTimeLeft);
        setConfirmedPlayers(payload.payload.confirmedPlayers);
        setNightSelection(null);
        setActionConfirmed(false);
        setSeerResult(null);
      })
      .on("broadcast", { event: "sync-time" }, (payload) => {
        setNightTimeLeft(payload.payload.nightTimeLeft);
      })
      .on("broadcast", { event: "player-confirm" }, (payload) => {
        setConfirmedPlayers((prev) => [
          ...new Set([...prev, payload.payload.playerName]),
        ]);
      })
      .on("broadcast", { event: "wolf-vote" }, (payload) => {
        const { playerName: wName, target } = payload.payload;
        setWolfVotes((prev) => ({ ...prev, [wName]: target }));
      })
      .on("broadcast", { event: "witch-action" }, (payload) => {
        setWitchAction(payload.payload.action);
      })
      .on("broadcast", { event: "night-action" }, (payload) => {
        const { role, target } = payload.payload;
        if (role === "bodyguard") setLastProtected(target);
        if (role === "hunter") setHunterTarget(target);
      })
      .on("broadcast", { event: "wolf-chat" }, (payload) => {
        setWolfChat((prev) => [payload.payload.message, ...prev]);
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
          payload: { oldName: playerName, newName },
        });
      }
      if (hostName === playerName) setHostName(newName);
      setPlayers((prev) => prev.map((p) => (p === playerName ? newName : p)));
      setSpectators((prev) =>
        prev.map((s) => (s === playerName ? newName : s)),
      );
    }
  };

  const executeNightResolution = useCallback(() => {
    const state = stateRef.current;
    const deaths = new Set<string>();

    if (state.wolfVictim && state.wolfVictim !== "none") {
      const protectedByGuard = state.lastProtected === state.wolfVictim;
      const savedByWitch = state.witchAction.heal;
      if (!protectedByGuard && !savedByWitch) {
        deaths.add(state.wolfVictim);
      }
    }

    if (state.witchAction.poison) {
      deaths.add(state.witchAction.poison);
    }

    const deadArray = Array.from(deaths);
    for (const dead of deadArray) {
      if (state.playerRoles[dead]?.id === "hunter" && state.hunterTarget) {
        deaths.add(state.hunterTarget);
      }
    }

    const newAlive = state.alivePlayers.filter((p) => !deaths.has(p));

    const newPotions = { ...state.witchPotions };
    if (state.witchAction.heal) newPotions.heal -= 1;
    if (state.witchAction.poison) newPotions.poison -= 1;

    setAlivePlayers(newAlive);
    setWitchPotions(newPotions);
    setDeadThisNight(Array.from(deaths));

    const finalDeadArray = Array.from(deaths);
    const sysLog: ActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      dayCount: state.dayCount,
      roleId: "system",
      playerName: "system",
      content:
        finalDeadArray.length > 0
          ? `Báo cáo buổi sáng: Đêm qua những người sau đã chết: ${finalDeadArray.join(", ")}`
          : "Báo cáo buổi sáng: Đêm qua là một đêm bình yên, không có ai chết!",
    };
    const newLogs = [...state.actionLogs, sysLog];
    setActionLogs(newLogs);

    setPhase("day");
    setNightPhase(null);
    setNightTimeLeft(0);
    setConfirmedPlayers([]);

    setNightSelection(null);
    setActionConfirmed(false);
    setSeerResult(null);
    setWolfVotes({});
    setWolfVictim(null);
    setWitchAction({ heal: false, poison: null });

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "phase-change",
        payload: {
          phase: "day",
          dayCount: state.dayCount,
          alivePlayers: newAlive,
          witchPotions: newPotions,
          deadThisNight: Array.from(deaths),
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: newLogs,
        },
      });
    }
  }, [channel]);

  const advanceNightPhase = useCallback(() => {
    const state = stateRef.current;
    const nextNightPhase = getNextNightPhase(
      state.nightPhase,
      state.alivePlayers,
      state.playerRoles,
    );

    if (nextNightPhase) {
      const timeLimit =
        nextNightPhase === "hunter" && state.dayCount > 1 ? 15 : 120;
      setNightPhase(nextNightPhase);
      setNightTimeLeft(timeLimit);
      setConfirmedPlayers([]);
      setNightSelection(null);
      setActionConfirmed(false);
      setSeerResult(null);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "night-phase-change",
          payload: {
            nightPhase: nextNightPhase,
            nightTimeLeft: timeLimit,
            confirmedPlayers: [],
          },
        });
      }
    } else {
      executeNightResolution();
    }
  }, [channel, executeNightResolution]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (phase === "night" && hostName === playerName && gameStarted) {
      if (nightTimeLeft > 0) {
        timerRef.current = setTimeout(() => {
          setNightTimeLeft((prev) => prev - 1);
          if (channel && (nightTimeLeft - 1) % 5 === 0) {
            channel.send({
              type: "broadcast",
              event: "sync-time",
              payload: { nightTimeLeft: nightTimeLeft - 1 },
            });
          }
        }, 1000);
      } else if (nightTimeLeft === 0) {
        advanceNightPhase();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    phase,
    nightTimeLeft,
    hostName,
    playerName,
    gameStarted,
    channel,
    advanceNightPhase,
  ]);

  useEffect(() => {
    if (
      phase === "night" &&
      hostName === playerName &&
      gameStarted &&
      nightPhase
    ) {
      const activePlayersOfRole = alivePlayers.filter(
        (p) => playerRoles[p]?.id === nightPhase,
      );
      if (
        activePlayersOfRole.length > 0 &&
        activePlayersOfRole.every((p) => confirmedPlayers.includes(p))
      ) {
        advanceNightPhase();
      }
    }
  }, [
    confirmedPlayers,
    phase,
    nightPhase,
    alivePlayers,
    playerRoles,
    hostName,
    playerName,
    gameStarted,
    advanceNightPhase,
  ]);

  // Host Logic to track Wolf votes and set Wolf Victim
  useEffect(() => {
    if (
      phase === "night" &&
      hostName === playerName &&
      gameStarted &&
      nightPhase === "werewolf"
    ) {
      const aliveWolves = alivePlayers.filter(
        (p) => playerRoles[p]?.id === "werewolf",
      );
      if (aliveWolves.length === 0) {
        if (wolfVictim !== "none") {
          setWolfVictim("none");
          if (channel) {
            channel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current, wolfVictim: "none" },
            });
          }
        }
      } else {
        const allVoted = aliveWolves.every((w) => wolfVotes[w]);
        if (allVoted && aliveWolves.length > 0) {
          const firstVote = wolfVotes[aliveWolves[0]];
          const sameTarget = aliveWolves.every(
            (w) => wolfVotes[w] === firstVote,
          );
          if (sameTarget && wolfVictim !== firstVote) {
            setWolfVictim(firstVote);
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current, wolfVictim: firstVote },
              });
            }
          } else if (!sameTarget && wolfVictim !== null) {
            setWolfVictim(null);
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current, wolfVictim: null },
              });
            }
          }
        }
      }
    }
  }, [
    wolfVotes,
    alivePlayers,
    phase,
    gameStarted,
    hostName,
    playerName,
    playerRoles,
    wolfVictim,
    channel,
  ]);

  const handleStartGame = () => {
    if (channel && hostName === playerName) {
      const totalRoles = roleConfig.reduce((acc, r) => acc + r.count, 0);
      if (totalRoles !== players.length) {
        alert(
          `Số lượng vai trò (${totalRoles}) đang khác với số người chơi (${players.length} - đã tính cả chủ phòng). Vui lòng cấu hình lại cho bằng nhau!`,
        );
        return;
      }

      const rolePool: RoleConfig[] = [];
      roleConfig.forEach((role) => {
        for (let i = 0; i < role.count; i++) {
          rolePool.push(role);
        }
      });

      // Xáo trộn mảng vai trò (Fisher-Yates shuffle)
      for (let i = rolePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
      }

      const newPlayerRoles: Record<string, RoleConfig> = {};
      players.forEach((player, idx) => {
        newPlayerRoles[player] = rolePool[idx];
      });

      setPlayerRoles(newPlayerRoles);
      setGameStarted(true);
      setPhase("role_reveal");
      setDayCount(0);
      setAlivePlayers(players);
      setLastProtected(null);
      setNightSelection(null);
      setActionConfirmed(false);
      setSeerResult(null);
      setWitchPotions({ heal: 1, poison: 1 });
      setWolfVotes({});
      setWolfVictim(null);
      setHunterTarget(null);
      setWitchAction({ heal: false, poison: null });
      setDeadThisNight([]);
      setNightPhase(null);
      setNightTimeLeft(0);
      setConfirmedPlayers([]);
      setActionLogs([]);
      setWolfChat([]);

      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: {
          playerRoles: newPlayerRoles,
          phase: "role_reveal",
          dayCount: 0,
          alivePlayers: players,
          lastProtected: null,
          witchPotions: { heal: 1, poison: 1 },
          wolfVotes: {},
          wolfVictim: null,
          hunterTarget: null,
          witchAction: { heal: false, poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: [],
          wolfChat: [],
        },
      });
    }
  };

  const handleResetGame = () => {
    if (channel && hostName === playerName) {
      setGameStarted(false);
      setPlayerRoles({});
      setPhase("lobby");
      setDayCount(0);
      setAlivePlayers([]);
      setLastProtected(null);
      setNightSelection(null);
      setActionConfirmed(false);
      setSeerResult(null);
      setWitchPotions({ heal: 1, poison: 1 });
      setWolfVotes({});
      setWolfVictim(null);
      setHunterTarget(null);
      setWitchAction({ heal: false, poison: null });
      setDeadThisNight([]);
      setNightPhase(null);
      setNightTimeLeft(0);
      setConfirmedPlayers([]);
      setActionLogs([]);
      setWolfChat([]);

      channel.send({
        type: "broadcast",
        event: "reset-game",
        payload: {},
      });
    }
  };

  const handleNextPhase = () => {
    if (channel && hostName === playerName) {
      if (phase === "role_reveal" || phase === "day") {
        const nextDay = phase === "role_reveal" ? 1 : dayCount + 1;
        const firstNightPhase = getNextNightPhase(
          null,
          alivePlayers,
          playerRoles,
        );

        if (firstNightPhase) {
          const timeLimit =
            firstNightPhase === "hunter" && nextDay > 1 ? 15 : 120;
          setPhase("night");
          setDayCount(nextDay);
          setNightPhase(firstNightPhase);
          setNightTimeLeft(timeLimit);
          setConfirmedPlayers([]);
          setNightSelection(null);
          setActionConfirmed(false);
          setSeerResult(null);
          setWolfVotes({});
          setWolfVictim(null);
          setWitchAction({ heal: false, poison: null });

          channel.send({
            type: "broadcast",
            event: "phase-change",
            payload: {
              phase: "night",
              dayCount: nextDay,
              nightPhase: firstNightPhase,
              nightTimeLeft: timeLimit,
              confirmedPlayers: [],
            },
          });
        } else {
          executeNightResolution();
        }
      }
    }
  };

  const confirmNightAction = (overrideTarget?: any) => {
    let target = nightSelection;
    if (overrideTarget === null || typeof overrideTarget === "string") {
      target = overrideTarget;
    }

    if (!target && playerRoles[playerName]?.id !== "hunter") return;

    setActionConfirmed(true);
    setConfirmedPlayers((prev) => [...new Set([...prev, playerName])]);

    const myRole = playerRoles[playerName];
    if (!myRole) return;

    if (myRole?.id === "seer" && target) {
      const isWolf = playerRoles[target]?.id === "werewolf";
      setSeerResult({ name: target, isWolf });
    }
    if (myRole?.id === "bodyguard") {
      setLastProtected(target as string | null);
    }
    if (myRole?.id === "hunter") {
      setHunterTarget(target as string | null);
    }

    if (channel) {
      let content = "";
      if (myRole?.id === "seer") {
        const isWolf = playerRoles[target as string]?.id === "werewolf";
        content = `Bạn đã soi ${target} ${isWolf ? "LÀ SÓI" : "KHÔNG PHẢI là sói"}`;
      } else if (myRole?.id === "bodyguard") {
        content = `Bạn đã bảo vệ ${target}`;
      } else if (myRole?.id === "hunter") {
        content = `Bạn đã ghim mục tiêu ${target || "Không có ai"}`;
      }

      if (content) {
        const newLog: ActionLog = {
          id: Math.random().toString(36).substring(2, 9),
          dayCount,
          roleId: myRole.id,
          playerName,
          content,
        };
        setActionLogs((prev) => [...prev, newLog]);
        channel.send({
          type: "broadcast",
          event: "add-log",
          payload: { log: newLog },
        });
      }

      channel.send({
        type: "broadcast",
        event: "night-action",
        payload: { role: myRole?.id, target: target, playerName },
      });
      channel.send({
        type: "broadcast",
        event: "player-confirm",
        payload: { playerName },
      });
    }
  };

  const confirmWitchAction = () => {
    setActionConfirmed(true);
    setConfirmedPlayers((prev) => [...new Set([...prev, playerName])]);

    let content = "";
    if (witchAction.heal)
      content += `Bạn đã dùng bình cứu lên ${wolfVictim === "none" ? "Không ai" : wolfVictim}. `;
    if (witchAction.poison)
      content += `Bạn đã ném bình độc vào ${witchAction.poison}.`;
    if (!witchAction.heal && !witchAction.poison)
      content += "Bạn đã không dùng bình nào.";

    const newLog: ActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      dayCount,
      roleId: "witch",
      playerName,
      content: content.trim(),
    };
    setActionLogs((prev) => [...prev, newLog]);

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "add-log",
        payload: { log: newLog },
      });
      channel.send({
        type: "broadcast",
        event: "witch-action",
        payload: { action: witchAction, playerName },
      });
      channel.send({
        type: "broadcast",
        event: "player-confirm",
        payload: { playerName },
      });
    }
  };

  const updateRoleCount = (id: string, delta: number) => {
    if (hostName !== playerName) return;

    setRoleConfig((prev) => {
      const newConfig = prev.map((role) => {
        if (role.id === id) {
          return { ...role, count: Math.max(0, role.count + delta) };
        }
        return role;
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "update-roles",
          payload: { roleConfig: newConfig },
        });
      }
      return newConfig;
    });
  };

  // Filter and group logs for UI rendering
  const visibleLogs = actionLogs.filter((log) => {
    if (log.roleId === "system") return true;
    if (log.playerName === playerName) return true;
    if (log.roleId === "werewolf" && playerRoles[playerName]?.id === "werewolf")
      return true;
    return false;
  });

  const logsByNight: { [key: number]: ActionLog[] } = {};
  visibleLogs.forEach((log) => {
    if (!logsByNight[log.dayCount]) logsByNight[log.dayCount] = [];
    logsByNight[log.dayCount].push(log);
  });

  useEffect(() => {
    if (phase === "night") setActiveLogTab("night");
    if (phase === "day" || phase === "role_reveal") setActiveLogTab("day");
  }, [phase]);

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
        Đang tải...
      </div>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center px-4 py-12 md:justify-center transition-colors duration-1000 ${
        phase === "night" && gameStarted ? "bg-slate-900" : "bg-zinc-50"
      }`}
    >
      {hasInitialized && (
        <div className="fixed left-4 top-4 z-50">
          <button
            onClick={() => setShowNameModal(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
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
              <label className="flex items-center space-x-2 text-sm text-zinc-700">
                <input
                  type="radio"
                  value="player"
                  checked={requestedRole === "player"}
                  onChange={(e) =>
                    setRequestedRole(e.target.value as "player" | "spectator")
                  }
                  className="accent-zinc-900"
                />
                <span>Người chơi</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-zinc-700">
                <input
                  type="radio"
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
          )}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {hasInitialized ? "Cập nhật" : "Vào phòng"}
          </button>
        </form>
      </Modal>

      {/* Main Layout Grid */}
      <div
        className={`grid w-full flex-1 grid-cols-1 gap-8 md:grid-cols-2 ${gameStarted ? "max-w-7xl lg:grid-cols-[320px_1fr_350px]" : "max-w-5xl lg:grid-cols-[400px_1fr]"}`}
      >
        {/* Left Column: Title & Actions */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1
            className={`mb-2 text-4xl font-light tracking-tight transition-colors duration-1000 ${
              phase === "night" && gameStarted
                ? "text-zinc-100"
                : "text-zinc-900"
            }`}
          >
            Ma Sói <span className="font-semibold">(Werewolf)</span>
          </h1>
          <p
            className={`mb-6 text-sm leading-relaxed transition-colors duration-1000 ${
              phase === "night" && gameStarted
                ? "text-slate-400"
                : "text-zinc-500"
            }`}
          >
            Trò chơi ẩn vai trò, suy luận và lừa gạt. Hãy để bắt đầu cuộc chiến
            giữa Dân Làng và Ma Sói.
          </p>

          {!showNameModal && (
            <div className="flex w-full flex-col space-y-6">
              {/* Copy Link */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-700">
                  Mời bạn bè tham gia:
                </label>
                <div className="flex w-full items-center space-x-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                  <span className="flex-1 select-all truncate text-left text-xs text-zinc-500">
                    {typeof window !== "undefined" ? window.location.href : ""}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="cursor-pointer whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    {linkCopied ? "Đã copy!" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:items-start">
                {phase === "night" && gameStarted ? (
                  <>
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-indigo-900">
                      <FaMoon className="mr-2 text-indigo-700" /> Đêm {dayCount}
                    </h3>
                    <div className="flex flex-col items-center justify-center w-full py-4 bg-indigo-50 rounded-lg border border-indigo-100 mb-4">
                      <span className="text-4xl font-mono text-indigo-900 mb-2">
                        {Math.floor(nightTimeLeft / 60)}:
                        {(nightTimeLeft % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-indigo-800 uppercase tracking-wider">
                        Lượt của:{" "}
                        {defaultRoles.find((r) => r.id === nightPhase)?.name ||
                          "..."}
                      </span>
                    </div>
                    {hostName === playerName && (
                      <button
                        onClick={handleResetGame}
                        className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
                      >
                        Kết thúc / Chơi lại
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">
                      {gameStarted
                        ? `Trạng thái: ${phase === "role_reveal" ? "Phát vai trò" : `Ngày ${dayCount}`}`
                        : "Trạng thái phòng"}
                    </h3>
                    <p className="mb-4 text-sm text-zinc-500">
                      {gameStarted
                        ? `${alivePlayers.length} người còn sống.`
                        : `${players.length} người chơi đã sẵn sàng trong sảnh.`}
                    </p>

                    {hostName === playerName ? (
                      !gameStarted ? (
                        <button
                          onClick={handleStartGame}
                          className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Bắt đầu Game
                        </button>
                      ) : (
                        <div className="flex w-full flex-col space-y-3">
                          {phase === "role_reveal" || phase === "day" ? (
                            <button
                              onClick={handleNextPhase}
                              className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                              Chuyển sang Đêm{" "}
                              {phase === "day" ? dayCount + 1 : 1}
                            </button>
                          ) : null}
                          <button
                            onClick={handleResetGame}
                            className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
                          >
                            Kết thúc / Chơi lại
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="w-full rounded-lg bg-zinc-100 p-3 text-center text-sm font-medium text-zinc-600">
                        {gameStarted
                          ? "Trò chơi đang diễn ra..."
                          : "Đang chờ chủ phòng bắt đầu..."}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Role Configuration */}
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:items-start">
                <div className="mb-4 flex w-full items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-800">
                    Cấu hình Vai trò
                  </h3>
                  <span className="text-xs font-medium text-zinc-500">
                    Tổng: {roleConfig.reduce((acc, r) => acc + r.count, 0)}/
                    {players.length}
                  </span>
                </div>

                <div className="flex w-full flex-col space-y-3">
                  {roleConfig.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RoleIcon
                          id={role.id}
                          className={`text-xl ${getRoleColor(role.id)}`}
                        />
                        <span className="text-sm font-medium text-zinc-700">
                          {role.name}
                        </span>
                      </div>

                      {hostName === playerName && !gameStarted ? (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateRoleCount(role.id, -1)}
                            disabled={role.count === 0}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-sm font-bold text-zinc-800">
                            {role.count}
                          </span>
                          <button
                            onClick={() => updateRoleCount(role.id, 1)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="px-2 text-sm font-bold text-zinc-800">
                          x{role.count}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {roleConfig.reduce((acc, r) => acc + r.count, 0) !==
                  players.length && (
                  <p className="mt-3 w-full text-center text-xs text-red-500">
                    * Tổng số vai trò chưa khớp với số người chơi
                  </p>
                )}
              </div>

              <div className="border-t border-zinc-200 pt-4">
                <Link
                  href="/"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  ← Đổi trò chơi khác
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Players Grid */}
        <div className="flex w-full flex-col space-y-6">
          {/* Players */}
          <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-medium text-zinc-900">
                Người chơi ({players.length})
              </h3>
              {gameStarted && (
                <span className="animate-pulse rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  ĐANG CHƠI
                </span>
              )}
            </div>

            {players.length === 0 ? (
              <p className="py-8 text-center text-sm italic text-zinc-500">
                Chưa có người chơi nào.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {players.map((p, idx) => {
                  const role = playerRoles[p];
                  const myRole = playerRoles[playerName];

                  const isMe = p === playerName;
                  const isBothWolves =
                    myRole?.id === "werewolf" && role?.id === "werewolf";
                  const canSeeRole = isMe || isBothWolves;

                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border bg-zinc-50 p-4 shadow-sm transition-shadow hover:shadow-md ${!alivePlayers.includes(p) && gameStarted ? "opacity-50 grayscale border-zinc-200" : "border-zinc-100"}`}
                    >
                      {p === hostName && (
                        <div
                          className="absolute right-2 top-2 text-lg text-amber-500"
                          title="Chủ phòng"
                        >
                          <FaCrown />
                        </div>
                      )}
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-700 shadow-inner">
                        {p.charAt(0).toUpperCase()}
                      </div>
                      <span className="w-full truncate text-center text-sm font-medium text-zinc-800">
                        {p}
                      </span>
                      {gameStarted && role && canSeeRole && (
                        <span
                          className={`mt-1 flex items-center justify-center space-x-1 text-xs font-bold ${getRoleColor(role.id)}`}
                        >
                          <RoleIcon id={role.id} className="text-sm" />
                          <span>{role.name}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spectators */}
          {spectators.length > 0 && (
            <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-zinc-100 pb-3 text-base font-medium text-zinc-900">
                Người xem ({spectators.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {spectators.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700">
                      {spec.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-zinc-800">
                      {spec}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Game Actions / Night Actions */}
        {!showNameModal && gameStarted && (
          <div className="flex w-full flex-col space-y-6">
            {!alivePlayers.includes(playerName) && (
              <div className="flex w-full flex-col items-center rounded-xl border border-zinc-200 bg-zinc-100 p-6 shadow-sm md:items-start">
                <h3 className="mb-2 flex items-center text-sm font-bold text-zinc-600">
                  <FaGhost className="mr-2 text-zinc-500" />
                  Trạng thái: Đã chết
                </h3>

                <p className="text-sm text-zinc-500">
                  Bạn không còn khả năng tham gia vào các hoạt động của làng
                  nữa. Hãy giữ im lặng để không ảnh hưởng đến người chơi khác.
                </p>
              </div>
            )}

            {/* Night Action Area */}
            {phase === "night" && alivePlayers.includes(playerName) && (
              <div className="flex flex-col items-center rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm md:items-start">
                <h3 className="mb-4 flex items-center text-sm font-bold text-indigo-900">
                  Chức năng: {playerRoles[playerName]?.name}
                  <RoleIcon
                    id={playerRoles[playerName]?.id}
                    className="ml-2 text-lg"
                  />
                </h3>

                {playerRoles[playerName]?.id === "villager" ? (
                  <p className="w-full py-4 text-center text-sm text-indigo-800">
                    Nhân vật của bạn không có chức năng trong đêm. Hãy nhắm mắt
                    lại!
                  </p>
                ) : nightPhase !== playerRoles[playerName]?.id ? (
                  <p className="w-full animate-pulse py-4 text-center text-sm font-medium text-indigo-800">
                    Hãy nhắm mắt lại. Đang chờ các vai trò khác hành động...
                  </p>
                ) : (
                  <>
                    {/* BODYGUARD */}
                    {playerRoles[playerName]?.id === "bodyguard" && (
                      <div className="flex w-full flex-col space-y-4">
                        {actionConfirmed ? (
                          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center">
                            <p className="text-sm font-medium text-green-700">
                              <GiShield className="mr-1 inline text-green-700" />
                              Bạn đã chọn bảo vệ:
                              <span className="ml-1 font-bold">
                                {nightSelection}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-indigo-800">
                              Chọn 1 người để bảo vệ đêm nay (không được bảo vệ
                              người cũ của đêm qua):
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                              {alivePlayers.map((p) => (
                                <button
                                  key={p}
                                  disabled={p === lastProtected}
                                  onClick={() => setNightSelection(p)}
                                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                    nightSelection === p
                                      ? "border-indigo-600 bg-indigo-600 text-white"
                                      : "border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100"
                                  }`}
                                >
                                  {p} {p === lastProtected && "(Đã bảo vệ)"}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={confirmNightAction}
                              disabled={!nightSelection}
                              className="w-full rounded-lg bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                            >
                              Xác nhận
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* WEREWOLF */}
                    {playerRoles[playerName]?.id === "werewolf" && (
                      <div className="flex w-full flex-col space-y-4">
                        {actionConfirmed ? (
                          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center">
                            <p className="text-sm font-medium text-red-700">
                              <GiWolfHead className="mr-1 inline text-red-700" />
                              Bạn đã chốt vote cắn:
                              <span className="ml-1 font-bold">
                                {wolfVotes[playerName]}
                              </span>
                            </p>

                            <p className="mt-1 text-xs text-indigo-600">
                              Đợi các Sói khác và Phù thủy...
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-indigo-800">
                              Chọn 1 người để cắn. Sói cần phải thống nhất vote
                              cùng 1 người.
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                              {alivePlayers.map((p) => {
                                const wolvesVotingForP = alivePlayers.filter(
                                  (w) =>
                                    playerRoles[w]?.id === "werewolf" &&
                                    wolfVotes[w] === p,
                                );

                                return (
                                  <button
                                    key={p}
                                    onClick={() => {
                                      setNightSelection(p);

                                      const newVotes = {
                                        ...wolfVotes,
                                        [playerName]: p,
                                      };

                                      setWolfVotes(newVotes);

                                      if (channel) {
                                        channel.send({
                                          type: "broadcast",
                                          event: "wolf-vote",
                                          payload: {
                                            playerName,
                                            target: p,
                                          },
                                        });
                                      }
                                    }}
                                    className={`relative rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                      wolfVotes[playerName] === p
                                        ? "border-red-600 bg-red-600 text-white"
                                        : "border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100"
                                    }`}
                                  >
                                    {p}

                                    {wolvesVotingForP.length > 0 && (
                                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
                                        {wolvesVotingForP.length}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => {
                                setActionConfirmed(true);
                                setConfirmedPlayers((prev) => [
                                  ...new Set([...prev, playerName]),
                                ]);

                                const newLog: ActionLog = {
                                  id: Math.random()
                                    .toString(36)
                                    .substring(2, 9),
                                  dayCount,
                                  roleId: "werewolf",
                                  playerName,
                                  content: `Bạn đã vote cắn ${wolfVotes[playerName]}`,
                                };

                                setActionLogs((prev) => [...prev, newLog]);

                                if (channel) {
                                  channel.send({
                                    type: "broadcast",
                                    event: "add-log",
                                    payload: { log: newLog },
                                  });

                                  channel.send({
                                    type: "broadcast",
                                    event: "player-confirm",
                                    payload: { playerName },
                                  });
                                }
                              }}
                              disabled={
                                !wolfVotes[playerName] ||
                                alivePlayers
                                  .filter(
                                    (w) => playerRoles[w]?.id === "werewolf",
                                  )
                                  .some(
                                    (w) =>
                                      wolfVotes[w] !== wolfVotes[playerName],
                                  )
                              }
                              className="w-full rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                            >
                              {alivePlayers
                                .filter(
                                  (w) => playerRoles[w]?.id === "werewolf",
                                )
                                .some(
                                  (w) => wolfVotes[w] !== wolfVotes[playerName],
                                )
                                ? "Chờ đồng bọn thống nhất"
                                : "Xác nhận vote"}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* SEER */}
                    {playerRoles[playerName]?.id === "seer" && (
                      <div className="flex w-full flex-col space-y-4">
                        {actionConfirmed ? (
                          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center">
                            <p className="text-sm font-medium text-indigo-700">
                              <FaEye className="mr-1 inline text-indigo-700" />
                              Bạn đã soi:
                              <span className="ml-1 font-bold">
                                {seerResult?.name}
                              </span>
                            </p>
                            <p className="mt-2 text-base font-bold text-indigo-900">
                              Kết quả:{" "}
                              {seerResult?.isWolf
                                ? "LÀ SÓI 🐺"
                                : "KHÔNG PHẢI SÓI 👨‍🌾"}
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-indigo-800">
                              Chọn 1 người để soi xem họ có phải là Sói hay
                              không:
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                              {players
                                .filter((p) => p !== playerName)
                                .map((p) => (
                                  <button
                                    key={p}
                                    onClick={() => setNightSelection(p)}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                      nightSelection === p
                                        ? "border-indigo-600 bg-indigo-600 text-white"
                                        : "border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                            </div>

                            <button
                              onClick={confirmNightAction}
                              disabled={!nightSelection}
                              className="w-full rounded-lg bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                            >
                              Xác nhận soi
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* WITCH */}
                    {playerRoles[playerName]?.id === "witch" && (
                      <div className="flex w-full flex-col space-y-4">
                        {actionConfirmed ? (
                          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center">
                            <p className="text-sm font-medium text-purple-700">
                              <GiWitchFlight className="mr-1 inline text-purple-700" />
                              Bạn đã hoàn tất hành động đêm nay!
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg bg-indigo-100 p-3 text-center">
                              <p className="text-sm font-medium text-indigo-900">
                                Đêm nay, Sói đã cắn:{" "}
                                <span className="font-bold text-red-600">
                                  {wolfVictim === "none" || !wolfVictim
                                    ? "Không ai"
                                    : wolfVictim}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-col space-y-3">
                              {/* BÌNH MÁU */}
                              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-bold text-green-800">
                                    🧪 Bình Máu (còn {witchPotions.heal})
                                  </span>
                                  <button
                                    onClick={() =>
                                      setWitchAction((prev) => ({
                                        ...prev,
                                        heal: !prev.heal,
                                      }))
                                    }
                                    disabled={
                                      witchPotions.heal <= 0 ||
                                      !wolfVictim ||
                                      wolfVictim === "none"
                                    }
                                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      witchAction.heal
                                        ? "border border-green-600 bg-green-600 text-white"
                                        : "border border-green-300 bg-white text-green-700 hover:bg-green-100"
                                    }`}
                                  >
                                    {witchAction.heal
                                      ? "Đang sử dụng"
                                      : "Sử dụng"}
                                  </button>
                                </div>
                                <p className="text-xs text-green-700">
                                  Dùng để cứu người bị Sói cắn.
                                </p>
                              </div>

                              {/* BÌNH ĐỘC */}
                              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-bold text-purple-800">
                                    ☠️ Bình Độc (còn {witchPotions.poison})
                                  </span>
                                  {witchAction.poison && (
                                    <button
                                      onClick={() =>
                                        setWitchAction((prev) => ({
                                          ...prev,
                                          poison: null,
                                        }))
                                      }
                                      className="cursor-pointer rounded-md border border-purple-300 bg-white px-3 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100"
                                    >
                                      Hủy dùng
                                    </button>
                                  )}
                                </div>
                                <p className="mb-2 text-xs text-purple-700">
                                  Dùng để giết 1 người bất kỳ.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {alivePlayers
                                    .filter((p) => p !== playerName)
                                    .map((p) => (
                                      <button
                                        key={p}
                                        onClick={() =>
                                          setWitchAction((prev) => ({
                                            ...prev,
                                            poison: p,
                                          }))
                                        }
                                        disabled={witchPotions.poison <= 0}
                                        className={`cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                          witchAction.poison === p
                                            ? "border-purple-600 bg-purple-600 text-white"
                                            : "border-purple-200 bg-white text-purple-900 hover:bg-purple-100"
                                        }`}
                                      >
                                        {p}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={confirmWitchAction}
                              className="w-full cursor-pointer rounded-lg bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800"
                            >
                              Xác nhận hành động
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* HUNTER */}
                    {playerRoles[playerName]?.id === "hunter" && (
                      <div className="flex w-full flex-col space-y-4">
                        {actionConfirmed ? (
                          <div className="rounded-lg border border-indigo-100 bg-white p-3 text-center">
                            <p className="text-sm font-medium text-orange-700">
                              <GiMusket className="mr-1 inline text-orange-700" />
                              Bạn đã ghim:
                              <span className="ml-1 font-bold">
                                {hunterTarget || "Không có ai"}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-indigo-800">
                              Chọn 1 người để ghim. Nếu đêm nay bạn chết, người
                              này sẽ chết theo.
                            </p>

                            {dayCount > 1 && (
                              <p className="text-sm font-bold text-orange-700">
                                Mục tiêu đang ghim: {hunterTarget || "Chưa có"}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              {alivePlayers
                                .filter((p) => p !== playerName)
                                .map((p) => (
                                  <button
                                    key={p}
                                    onClick={() => setNightSelection(p)}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                      nightSelection === p
                                        ? "border-orange-600 bg-orange-600 text-white"
                                        : "border-orange-200 bg-white text-orange-900 hover:bg-orange-100"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={confirmNightAction}
                                disabled={!nightSelection}
                                className="w-full rounded-lg bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"
                              >
                                Xác nhận ghim mới
                              </button>
                              {dayCount > 1 && (
                                <button
                                  onClick={() =>
                                    confirmNightAction(hunterTarget)
                                  }
                                  className="w-full rounded-lg bg-zinc-600 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-700"
                                >
                                  Bỏ qua
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action Log Area */}
            <div className="flex h-[300px] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col rounded-t-xl border-b border-zinc-100 bg-zinc-50">
                <div className="p-3">
                  <h3 className="flex items-center text-sm font-bold text-zinc-800">
                    📜 Nhật ký hành động
                  </h3>
                </div>
                <div className="flex">
                  <button
                    onClick={() => setActiveLogTab("night")}
                    className={`flex-1 border-b-2 py-2 text-sm font-bold text-center transition-colors ${activeLogTab === "night" ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}
                  >
                    <FaMoon className="mb-1 mr-2 inline" /> Ban Đêm
                  </button>
                  <button
                    onClick={() => setActiveLogTab("day")}
                    className={`flex-1 border-b-2 py-2 text-sm font-bold text-center transition-colors ${activeLogTab === "day" ? "border-amber-500 bg-amber-50/50 text-amber-600" : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}
                  >
                    <FaSun className="mb-1 mr-2 inline" /> Ban Ngày
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto rounded-b-xl bg-white p-4">
                {actionLogs.length === 0 && activeLogTab === "day" && (
                  <div className="text-center">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-500">
                      Hệ thống: Trò chơi bắt đầu! Hãy kiểm tra thẻ bài của bạn.
                    </span>
                  </div>
                )}

                {Object.entries(logsByNight).map(
                  ([dayStr, logs]: [string, ActionLog[]]) => {
                    const nightLogs = logs.filter((l) => l.roleId !== "system");
                    const dayLogs = logs.filter((l) => l.roleId === "system");

                    if (activeLogTab === "night" && nightLogs.length === 0)
                      return null;
                    if (activeLogTab === "day" && dayLogs.length === 0)
                      return null;

                    return (
                      <div key={dayStr} className="mb-6 space-y-4">
                        {/* ĐÊM */}
                        {activeLogTab === "night" && nightLogs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="flex items-center border-b border-zinc-100 pb-1 text-sm font-bold text-indigo-900">
                              <FaMoon className="mr-2 text-indigo-600" />
                              Đêm {dayStr}
                            </h4>
                            {nightLogs.map((log: ActionLog) => (
                              <div
                                key={log.id}
                                className="ml-2 text-sm text-zinc-600"
                              >
                                {log.roleId === "werewolf" &&
                                log.playerName !== playerName ? (
                                  <span className="block text-xs font-semibold text-red-600">
                                    ({playerRoles[log.playerName]?.name} -{" "}
                                    {log.playerName})
                                  </span>
                                ) : (
                                  <span className="block text-xs font-semibold text-indigo-600">
                                    (
                                    {
                                      defaultRoles.find(
                                        (r) => r.id === log.roleId,
                                      )?.name
                                    }
                                    )
                                  </span>
                                )}
                                <p className="ml-2 text-xs font-medium">
                                  - {log.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* NGÀY */}
                        {activeLogTab === "day" && dayLogs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="flex items-center border-b border-zinc-100 pb-1 text-sm font-bold text-amber-600">
                              <FaSun className="mr-2 text-amber-500" />
                              Ngày {dayStr}
                            </h4>
                            {dayLogs.map((log: ActionLog) => (
                              <div key={log.id} className="my-2 text-center">
                                <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700">
                                  {log.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Wolf Chat Area */}
            {playerRoles[playerName]?.id === "werewolf" && (
              <div className="flex h-[250px] flex-col rounded-xl border border-red-200 bg-red-50 shadow-sm">
                <div className="flex items-center rounded-t-xl border-b border-red-200 bg-red-100 p-3">
                  <GiWolfHead className="mr-2 text-red-700" />
                  <h3 className="text-sm font-bold text-red-900">
                    Kênh chat nội bộ Sói
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2">
                  {wolfChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.playerName === playerName ? "items-end" : "items-start"}`}
                    >
                      <span className="mb-0.5 text-[10px] font-bold text-red-600/70">
                        {msg.playerName}
                      </span>
                      <div
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          msg.playerName === playerName
                            ? "bg-red-600 text-white"
                            : "bg-white text-red-900 border border-red-200"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-b-xl border-t border-red-200 bg-white p-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        !chatInput.trim() ||
                        !alivePlayers.includes(playerName)
                      )
                        return;
                      const newMsg: ChatMessage = {
                        id: Math.random().toString(36).substring(2, 9),
                        playerName,
                        message: chatInput.trim(),
                        timestamp: Date.now(),
                      };
                      setWolfChat((prev) => [newMsg, ...prev]);
                      setChatInput("");
                      if (channel) {
                        channel.send({
                          type: "broadcast",
                          event: "wolf-chat",
                          payload: { message: newMsg },
                        });
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        alivePlayers.includes(playerName)
                          ? "Nhắn tin cho đồng bọn..."
                          : "Bạn đã chết, không thể chat."
                      }
                      disabled={!alivePlayers.includes(playerName)}
                      className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={
                        !alivePlayers.includes(playerName) || !chatInput.trim()
                      }
                      className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function WerewolfPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500">
          Đang tải sảnh Ma Sói...
        </div>
      }
    >
      <WerewolfGame />
    </Suspense>
  );
}
