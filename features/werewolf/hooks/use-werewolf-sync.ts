import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useWerewolf } from "../contexts/werewolf-context";
import { GameState, ActionLog } from "../types";
import { generateId } from "../utils/helpers";
import { getNextNightPhase } from "../utils/game-logic";
import { initialGameState } from "../store/werewolf-store";

export const useWerewolfSync = () => {
  const {
    roomId,
    playerName,
    hasInitialized,
    requestedRole,
    setChannel,
    dispatch,
    stateRef,
    playerNameRef,
    channel,
  } = useWerewolf();
  const router = useRouter();

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
              if (state.gameStarted) {
                roomChannel.send({
                  type: "broadcast",
                  event: "join-rejected",
                  payload: {
                    playerName: newPlayer,
                    reason: "Trò chơi đang diễn ra, bạn không thể tham gia với tư cách Người chơi (hãy chọn Người xem)!",
                  },
                });
                return;
              }
              newPlayers.push(newPlayer);
              stateRef.current.players = newPlayers;
              dispatch({ type: "UPDATE", payload: { players: newPlayers } });
            } else {
              newSpecs.push(newPlayer);
              stateRef.current.spectators = newSpecs;
              dispatch({ type: "UPDATE", payload: { spectators: newSpecs } });
            }
          }

          roomChannel.send({
            type: "broadcast",
            event: "room-sync",
            payload: {
              ...stateRef.current,
            },
          });
        }
      })
      .on("broadcast", { event: "room-sync" }, (payload) => {
        const data = payload.payload;
        const updates: Partial<GameState> = {};
        if (data.hostName !== undefined) updates.hostName = data.hostName;
        if (data.players !== undefined) updates.players = data.players;
        if (data.spectators !== undefined) updates.spectators = data.spectators;
        if (data.gameStarted !== undefined) updates.gameStarted = data.gameStarted;
        if (data.roleConfig) updates.roleConfig = data.roleConfig;
        if (data.playerRoles) updates.playerRoles = data.playerRoles;
        if (data.originalRoles) updates.originalRoles = data.originalRoles;
        if (data.phase) updates.phase = data.phase;
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined) updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined) updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined) updates.executionVotes = data.executionVotes;
        if (data.dayCount !== undefined) updates.dayCount = data.dayCount;
        if (data.alivePlayers) updates.alivePlayers = data.alivePlayers;
        if (data.lastProtected !== undefined) updates.lastProtected = data.lastProtected;
        if (data.witchPotions) updates.witchPotions = data.witchPotions;
        if (data.wolfVotes) updates.wolfVotes = data.wolfVotes;
        if (data.wolfVictim !== undefined) updates.wolfVictim = data.wolfVictim;
        if (data.hunterTarget !== undefined) updates.hunterTarget = data.hunterTarget;
        if (data.witchAction) updates.witchAction = data.witchAction;
        if (data.deadThisNight) updates.deadThisNight = data.deadThisNight;
        if (data.nightPhase !== undefined) updates.nightPhase = data.nightPhase;
        if (data.nightTimeLeft !== undefined) updates.nightTimeLeft = data.nightTimeLeft;
        if (data.confirmedPlayers) updates.confirmedPlayers = data.confirmedPlayers;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        if (data.wolfChat) updates.wolfChat = data.wolfChat;
        if (data.loversChat) updates.loversChat = data.loversChat;
        if (data.generalChat) updates.generalChat = data.generalChat;
        if (data.winner !== undefined) updates.winner = data.winner;
        if (data.extraLives) updates.extraLives = data.extraLives;
        if (data.cursedWolfUsed !== undefined) updates.cursedWolfUsed = data.cursedWolfUsed;
        if (data.infectedPlayer !== undefined) updates.infectedPlayer = data.infectedPlayer;
        if (data.fogWolfUsed !== undefined) updates.fogWolfUsed = data.fogWolfUsed;
        if (data.whiteWolfVictim !== undefined) updates.whiteWolfVictim = data.whiteWolfVictim;
        if (data.headhunterTarget !== undefined) updates.headhunterTarget = data.headhunterTarget;
        if (data.assassinTarget !== undefined) updates.assassinTarget = data.assassinTarget;
        if (data.cupidTargets !== undefined) updates.cupidTargets = data.cupidTargets;
        if (data.mediumUsed !== undefined) updates.mediumUsed = data.mediumUsed;
        if (data.mediumResurrect !== undefined) updates.mediumResurrect = data.mediumResurrect;
        if (data.hypnotizedPlayers) updates.hypnotizedPlayers = data.hypnotizedPlayers;
        if (data.extraWolfKill !== undefined) updates.extraWolfKill = data.extraWolfKill;
        if (data.activeExtraWolfKill !== undefined) updates.activeExtraWolfKill = data.activeExtraWolfKill;

        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        const data = payload.payload;
        dispatch({
          type: "UPDATE",
          payload: {
            gameStarted: true,
            playerRoles: data.playerRoles || {},
            originalRoles: data.originalRoles || {},
            phase: data.phase || "role_reveal",
            dayPhase: null,
            dayTimeLeft: 0,
            dayVotes: {},
            accusedPlayer: null,
            executionVotes: {},
            dayCount: data.dayCount !== undefined ? data.dayCount : 0,
            alivePlayers: data.alivePlayers || [],
            lastProtected: data.lastProtected !== undefined ? data.lastProtected : null,
            witchPotions: data.witchPotions || { heal: 1, poison: 1 },
            wolfVotes: data.wolfVotes || {},
            wolfVictim: data.wolfVictim !== undefined ? data.wolfVictim : [],
            hunterTarget: data.hunterTarget !== undefined ? data.hunterTarget : null,
            witchAction: data.witchAction || { heal: [], poison: null },
            deadThisNight: data.deadThisNight || [],
            nightSelection: null,
            actionConfirmed: false,
            seerResult: null,
            nightPhase: null,
            nightTimeLeft: 0,
            confirmedPlayers: [],
            actionLogs: [],
            wolfChat: [],
            loversChat: [],
            generalChat: [],
            winner: null,
            extraLives: data.extraLives || {},
            cursedWolfUsed: false,
            infectedPlayer: null,
            fogWolfUsed: false,
            whiteWolfVictim: null,
            headhunterTarget: data.headhunterTarget !== undefined ? data.headhunterTarget : null,
            assassinTarget: data.assassinTarget !== undefined ? data.assassinTarget : null,
            cupidTargets: data.cupidTargets !== undefined ? data.cupidTargets : null,
            mediumUsed: false,
            mediumResurrect: null,
            hypnotizedPlayers: [],
            extraWolfKill: data.extraWolfKill || false,
            activeExtraWolfKill: data.activeExtraWolfKill || false,
          },
        });
      })
      .on("broadcast", { event: "reset-game" }, () => {
        dispatch({
          type: "UPDATE",
          payload: {
            ...initialGameState,
            hostName: stateRef.current.hostName,
            players: stateRef.current.players,
            spectators: stateRef.current.spectators,
            roleConfig: stateRef.current.roleConfig,
          },
        });
      })
      .on("broadcast", { event: "add-log" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            actionLogs: [...prev.actionLogs, payload.payload.log],
          }),
        });
      })
      .on("broadcast", { event: "update-name" }, (payload) => {
        const { oldName, newName } = payload.payload;
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            hostName: prev.hostName === oldName ? newName : prev.hostName,
            players: prev.players.map((p) => (p === oldName ? newName : p)),
            spectators: prev.spectators.map((s) => (s === oldName ? newName : s)),
          }),
        });
      })
      .on("broadcast", { event: "update-roles" }, (payload) => {
        dispatch({
          type: "UPDATE",
          payload: { roleConfig: payload.payload.roleConfig },
        });
      })
      .on("broadcast", { event: "phase-change" }, (payload) => {
        const data = payload.payload;
        const updates: Partial<GameState> = {
          nightSelection: null,
          actionConfirmed: false,
          seerResult: null,
          wolfVotes: {},
          wolfVictim: [],
          witchAction: { heal: [], poison: null },
          whiteWolfVictim: null,
          assassinTarget: null,
        };
        if (data.phase) updates.phase = data.phase;
        if (data.dayCount !== undefined) updates.dayCount = data.dayCount;
        if (data.alivePlayers) updates.alivePlayers = data.alivePlayers;
        if (data.witchPotions) updates.witchPotions = data.witchPotions;
        if (data.deadThisNight) updates.deadThisNight = data.deadThisNight;
        if (data.nightPhase !== undefined) updates.nightPhase = data.nightPhase;
        if (data.nightTimeLeft !== undefined) updates.nightTimeLeft = data.nightTimeLeft;
        if (data.confirmedPlayers) updates.confirmedPlayers = data.confirmedPlayers;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        if (data.extraLives) updates.extraLives = data.extraLives;
        if (data.winner !== undefined) updates.winner = data.winner;
        if (data.playerRoles) updates.playerRoles = data.playerRoles;
        if (data.infectedPlayer !== undefined) updates.infectedPlayer = data.infectedPlayer;
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined) updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined) updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined) updates.executionVotes = data.executionVotes;
        if (data.fogWolfUsed !== undefined) updates.fogWolfUsed = data.fogWolfUsed;
        updates.mediumResurrect = null;
        if (data.hypnotizedPlayers) updates.hypnotizedPlayers = data.hypnotizedPlayers;
        if (data.extraWolfKill !== undefined) updates.extraWolfKill = data.extraWolfKill;
        if (data.activeExtraWolfKill !== undefined) updates.activeExtraWolfKill = data.activeExtraWolfKill;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "day-phase-change" }, (payload) => {
        const data = payload.payload;
        const updates: Partial<GameState> = {};
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined) updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined) updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined) updates.executionVotes = data.executionVotes;
        if (data.actionLogs !== undefined) updates.actionLogs = data.actionLogs;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "sync-day-time" }, (payload) => {
        dispatch({
          type: "UPDATE",
          payload: { dayTimeLeft: payload.payload.dayTimeLeft },
        });
      })
      .on("broadcast", { event: "day-vote" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            dayVotes: {
              ...prev.dayVotes,
              [payload.payload.playerName]: payload.payload.target,
            },
          }),
        });
      })
      .on("broadcast", { event: "execution-vote" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            executionVotes: {
              ...prev.executionVotes,
              [payload.payload.playerName]: payload.payload.vote,
            },
          }),
        });
      })
      .on("broadcast", { event: "execution-result" }, (payload) => {
        const data = payload.payload;
        const updates: Partial<GameState> = {};
        if (data.phase) updates.phase = data.phase;
        if (data.winner !== undefined) updates.winner = data.winner;
        if (data.extraLives) updates.extraLives = data.extraLives;
        if (data.alivePlayers) updates.alivePlayers = data.alivePlayers;
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined) updates.dayTimeLeft = data.dayTimeLeft;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "night-phase-change" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => {
            const role = prev.playerRoles[playerName]?.id;
            const keepConfirmed = role === "seer" || role === "hunter" || role === "medium" || role === "pied_piper";
            return {
              nightPhase: payload.payload.nightPhase,
              nightTimeLeft: payload.payload.nightTimeLeft,
              confirmedPlayers: payload.payload.confirmedPlayers,
              nightSelection: keepConfirmed ? prev.nightSelection : null,
              actionConfirmed: keepConfirmed ? prev.actionConfirmed : false,
              seerResult: keepConfirmed ? prev.seerResult : null,
            };
          },
        });
      })
      .on("broadcast", { event: "sync-time" }, (payload) => {
        dispatch({
          type: "UPDATE",
          payload: { nightTimeLeft: payload.payload.nightTimeLeft },
        });
      })
      .on("broadcast", { event: "player-confirm" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            confirmedPlayers: [...new Set([...prev.confirmedPlayers, payload.payload.playerName])],
          }),
        });
      })
      .on("broadcast", { event: "player-unconfirm" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            confirmedPlayers: prev.confirmedPlayers.filter((p) => p !== payload.payload.playerName),
          }),
        });
      })
      .on("broadcast", { event: "wolf-vote" }, (payload) => {
        const { playerName: wName, target } = payload.payload;
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            wolfVotes: {
              ...prev.wolfVotes,
              [wName]: Array.isArray(target) ? target : target === "none" ? [] : [target],
            },
          }),
        });
      })
      .on("broadcast", { event: "witch-action" }, (payload) => {
        dispatch({
          type: "UPDATE",
          payload: { witchAction: payload.payload.action },
        });
      })
      .on("broadcast", { event: "night-action" }, (payload) => {
        const { role, target } = payload.payload;
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            lastProtected: role === "bodyguard" ? target : prev.lastProtected,
            hunterTarget: role === "hunter" ? target : prev.hunterTarget,
            infectedPlayer: role === "cursed_wolf" && target ? target : prev.infectedPlayer,
            wolfVictim: role === "cursed_wolf" && target ? prev.wolfVictim.filter((x) => x !== target) : prev.wolfVictim,
            whiteWolfVictim: role === "white_wolf" ? target : prev.whiteWolfVictim,
            headhunterTarget: role === "headhunter" ? target : prev.headhunterTarget,
            assassinTarget: role === "assassin" ? target : prev.assassinTarget,
            cupidTargets: role === "cupid" ? target : prev.cupidTargets,
            mediumResurrect: role === "medium" ? target : prev.mediumResurrect,
            hypnotizedPlayers: role === "pied_piper" && target ? [...new Set([...prev.hypnotizedPlayers, target])] : prev.hypnotizedPlayers,
          }),
        });
      })
      .on("broadcast", { event: "wolf-chat" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            wolfChat: [payload.payload.message, ...(prev.wolfChat || [])],
          }),
        });
      })
      .on("broadcast", { event: "lovers-chat" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => {
            const newArray = [payload.payload.message, ...(prev.loversChat || [])];
            return { loversChat: newArray };
          },
        });
      })
      .on("broadcast", { event: "general-chat" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => {
            const newArray = [payload.payload.message, ...(prev.generalChat || [])];
            return { generalChat: newArray };
          },
        });
      })
      .on("broadcast", { event: "use-fog" }, (payload) => {
        const state = stateRef.current;
        dispatch({
          type: "UPDATE",
          payload: { fogWolfUsed: true },
        });

        if (state.hostName === playerName && payload.payload.playerName !== state.hostName) {
          const sysLog: ActionLog = {
            id: generateId(),
            dayCount: state.dayCount,
            roleId: "system",
            playerName: "system",
            content: `🌫️ Sương mù dày đặc bao phủ ngôi làng! Sói Sương Mù đã kích hoạt kỹ năng. Mọi cuộc biểu quyết bị hủy bỏ, màn đêm lập tức buông xuống!`,
          };
          const newLogs = [...state.actionLogs, sysLog];

          const nextDay = state.dayCount + 1;
          const firstNightPhase = getNextNightPhase(null, state.playerRoles, nextDay);

          if (firstNightPhase) {
            const timeLimit = firstNightPhase === "hunter" && nextDay > 1 ? 15 : 120;

            const nightUpdates = {
              phase: "night" as const,
              dayCount: nextDay,
              nightPhase: firstNightPhase,
              nightTimeLeft: timeLimit,
              confirmedPlayers: [],
              nightSelection: null,
              actionConfirmed: false,
              seerResult: null,
              wolfVotes: {},
              wolfVictim: [],
              witchAction: { heal: [], poison: null },
              actionLogs: newLogs,
              dayPhase: null,
              dayTimeLeft: 0,
              dayVotes: {},
              accusedPlayer: null,
              executionVotes: {},
              fogWolfUsed: true,
              assassinTarget: null,
              cupidTargets: state.cupidTargets,
            };
            dispatch({ type: "UPDATE", payload: nightUpdates });

            roomChannel.send({
              type: "broadcast",
              event: "phase-change",
              payload: nightUpdates,
            });
          }
        }
      })
      .on("broadcast", { event: "kick-player" }, (payload) => {
        if (payload.payload.playerName === playerName) {
          toast.error("Bạn đã bị chủ phòng kích khỏi phòng!");
          if (roomId) localStorage.removeItem(`joinedRoom_${roomId}`);
          router.replace("/");
        }
      })
      .on("broadcast", { event: "leave-room" }, (payload) => {
        const state = stateRef.current;
        const leavingPlayer = payload.payload.playerName;
        const newPlayers = state.players.filter((p) => p !== leavingPlayer);
        const newSpecs = state.spectators.filter((s) => s !== leavingPlayer);

        let newHostName = state.hostName;
        if (state.hostName === leavingPlayer) {
          newHostName = newPlayers[0] || newSpecs[0] || null;
        }

        if (
          newPlayers.length !== state.players.length ||
          newSpecs.length !== state.spectators.length ||
          newHostName !== state.hostName
        ) {
          dispatch({
            type: "UPDATE",
            payload: {
              players: newPlayers,
              spectators: newSpecs,
              hostName: newHostName,
            },
          });
          stateRef.current.players = newPlayers;
          stateRef.current.spectators = newSpecs;
          stateRef.current.hostName = newHostName;

          if (newHostName === playerName) {
            setTimeout(() => {
              roomChannel.send({
                type: "broadcast",
                event: "room-sync",
                payload: {
                  ...stateRef.current,
                },
              });
            }, 50);
          }
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
  }, [roomId, playerName, hasInitialized, requestedRole, dispatch, setChannel, stateRef, router]);

  useEffect(() => {
    const handleUnload = () => {
      if (channel && playerNameRef.current) {
        channel.send({
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
  }, [channel, playerNameRef]);
};
