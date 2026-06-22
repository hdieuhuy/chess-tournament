import { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useWerewolf } from "../contexts/werewolf-context";
import { generateId, getRandomInt, shuffleArray } from "../utils/helpers";
import { getNextNightPhase, checkWinCondition } from "../utils/game-logic";
import { GameState, ActionLog, RoleConfig } from "../types";

export const useWerewolfActions = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    gameState,
    dispatch,
    channel,
    playerName,
    roomId,
    setRoomId,
    setPlayerName,
    hasInitialized,
    setHasInitialized,
    requestedRole,
    stateRef
  } = useWerewolf();
  const { hostName, players, gameStarted, phase, dayPhase, dayTimeLeft, nightTimeLeft, nightPhase, alivePlayers, playerRoles, dayCount, confirmedPlayers, wolfVictim, wolfVotes, extraLives, actionLogs, executionVotes, accusedPlayer, dayVotes, roleConfig } = gameState;


  const handleJoinRoom = (e: React.FormEvent, inputName: string, setShowNameModal: (v: boolean) => void) => {
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
        const newRoomId = generateId();
        setRoomId(newRoomId);
        dispatch({
          type: "UPDATE",
          payload: { hostName: newName, players: [newName] },
        });
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
      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev) => ({
          hostName: prev.hostName === playerName ? newName : prev.hostName,
          players: prev.players.map((p) => (p === playerName ? newName : p)),
          spectators: prev.spectators.map((s) =>
            s === playerName ? newName : s,
          ),
        }),
      });
    }
  };

  const handleKickPlayer = (targetName: string) => {
    if (playerName !== hostName || !channel || gameStarted) return;

    channel.send({
      type: "broadcast",
      event: "kick-player",
      payload: { playerName: targetName },
    });

    const state = stateRef.current;
    const newPlayers = state.players.filter((p) => p !== targetName);
    const newSpecs = state.spectators.filter((s) => s !== targetName);

    dispatch({
      type: "UPDATE",
      payload: { players: newPlayers, spectators: newSpecs },
    });
    stateRef.current.players = newPlayers;
    stateRef.current.spectators = newSpecs;

    setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "room-sync",
        payload: {
          ...stateRef.current,
          players: newPlayers,
          spectators: newSpecs,
        },
      });
    }, 50);
  };

  const executeDayExecution = useCallback(
    (executedPlayer: string) => {
      const state = stateRef.current;
      const newExtraLives = { ...state.extraLives };
      const actualDeaths = new Set<string>();

      if (newExtraLives[executedPlayer] > 0) {
        newExtraLives[executedPlayer] -= 1;
      } else {
        actualDeaths.add(executedPlayer);
      }

      const deathQueue = Array.from(actualDeaths);
      while (deathQueue.length > 0) {
        const currentDead = deathQueue.shift()!;

        if (
          state.playerRoles[currentDead]?.id === "hunter" &&
          state.hunterTarget
        ) {
          const hTarget = state.hunterTarget;
          if (newExtraLives[hTarget] > 0) {
            newExtraLives[hTarget] -= 1;
          } else if (!actualDeaths.has(hTarget)) {
            actualDeaths.add(hTarget);
            deathQueue.push(hTarget);
          }
        }

        if (state.cupidTargets) {
          const [l1, l2] = state.cupidTargets;
          if (currentDead === l1 && !actualDeaths.has(l2)) {
            if (newExtraLives[l2] > 0) newExtraLives[l2] -= 1;
            else {
              actualDeaths.add(l2);
              deathQueue.push(l2);
            }
          } else if (currentDead === l2 && !actualDeaths.has(l1)) {
            if (newExtraLives[l1] > 0) newExtraLives[l1] -= 1;
            else {
              actualDeaths.add(l1);
              deathQueue.push(l1);
            }
          }
        }
      }

      const newAlive = state.alivePlayers.filter((p) => !actualDeaths.has(p));

      let newExtraWolfKill = state.extraWolfKill;
      actualDeaths.forEach((dead) => {
        if (state.playerRoles[dead]?.id === "wolf_cub") {
          newExtraWolfKill = true;
        }
      });

      let newWinner: GameState["winner"] = checkWinCondition(
        newAlive,
        state.playerRoles,
        state.cupidTargets,
        state.hypnotizedPlayers,
      );

      // Kẻ Ngốc chiến thắng nếu bị treo cổ
      if (
        actualDeaths.has(executedPlayer) &&
        state.playerRoles[executedPlayer]?.id === "fool"
      ) {
        newWinner = "fool";
      }

      // Thợ Săn Người chiến thắng nếu mục tiêu bị treo cổ và Thợ Săn Người còn sống
      const headhunterName = Object.keys(state.playerRoles).find(
        (p) => state.playerRoles[p]?.id === "headhunter",
      );
      if (
        actualDeaths.has(executedPlayer) &&
        state.headhunterTarget === executedPlayer &&
        headhunterName &&
        state.alivePlayers.includes(headhunterName)
      ) {
        newWinner = "headhunter";
      }

      const finalDeadArray = Array.from(actualDeaths);

      let content = "";
      if (actualDeaths.has(executedPlayer)) {
        content = `Làng đã quyết định treo cổ ${executedPlayer}. ${finalDeadArray.length > 1 ? `Ngoài ra ${finalDeadArray.filter((p) => p !== executedPlayer).join(", ")} cũng đã chết theo.` : ""}`;
      } else {
        content = `Làng đã biểu quyết treo cổ ${executedPlayer}, nhưng với quyền năng của Trưởng Làng, người này vẫn còn sống!`;
      }

      let killVotesCount = 0;
      let saveVotesCount = 0;
      Object.entries(state.executionVotes).forEach(([voter, vote]) => {
        const weight = state.playerRoles[voter]?.id === "mayor" ? 2 : 1;
        if (vote === "kill") killVotesCount += weight;
        else if (vote === "save") saveVotesCount += weight;
      });

      const execVoteLog: ActionLog = {
        id: generateId(),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content: `Kết quả phiếu sinh tử: ${killVotesCount} phiếu Treo cổ, ${saveVotesCount} phiếu Tha bổng.`,
      };

      const sysLog: ActionLog = {
        id: generateId(),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content,
      };

      const newLogs = [...state.actionLogs, execVoteLog, sysLog];

      if (newWinner) {
        const endLog: ActionLog = {
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content:
            newWinner === "lovers"
              ? "Trò chơi kết thúc! Cặp đôi đã sống sót đến cuối cùng và giành chiến thắng!"
              : newWinner === "assassin"
                ? "Trò chơi kết thúc! Sát Thủ đã tiêu diệt hầu hết làng và giành chiến thắng."
                : newWinner === "headhunter"
                  ? "Trò chơi kết thúc! Làng đã treo cổ mục tiêu của Thợ Săn Người. Thợ Săn Người giành chiến thắng!"
                  : newWinner === "fool"
                    ? "Trò chơi kết thúc! Kẻ Ngốc đã đánh lừa được cả làng và bị treo cổ. Kẻ Ngốc giành chiến thắng!"
                    : newWinner === "wolves"
                      ? "Trò chơi kết thúc! Phe Sói đã chiến thắng."
                      : newWinner === "pied_piper"
                        ? "Trò chơi kết thúc! Người Thổi Sáo đã thôi miên toàn bộ dân làng và giành chiến thắng!"
                        : "Trò chơi kết thúc! Phe Dân làng đã chiến thắng.",
        };
        newLogs.push(endLog);
      }

      const updatePayload: Partial<GameState> = {
        alivePlayers: newAlive,
        extraLives: newExtraLives,
        dayPhase: null,
        dayTimeLeft: newWinner ? 0 : 5,
        actionLogs: newLogs,
        extraWolfKill: newExtraWolfKill,
      };
      if (newWinner) {
        updatePayload.phase = "game_over";
        updatePayload.winner = newWinner;
      }
      dispatch({ type: "UPDATE", payload: updatePayload });

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "execution-result",
          payload: {
            phase: newWinner ? "game_over" : "day",
            winner: newWinner,
            alivePlayers: newAlive,
            extraLives: newExtraLives,
            dayPhase: null,
            dayTimeLeft: newWinner ? 0 : 5,
            actionLogs: newLogs,
            extraWolfKill: newExtraWolfKill,
          },
        });
      }
    },
    [channel],
  );

  const executeNightResolution = useCallback(() => {
    const state = stateRef.current;
    const deaths = new Set<string>();

    const newPlayerRoles = { ...state.playerRoles };
    const newLogs = [...state.actionLogs];

    if (state.wolfVictim && state.wolfVictim.length > 0) {
      state.wolfVictim.forEach((victim) => {
        const protectedByGuard = state.lastProtected === victim;
        const savedByWitch = (state.witchAction.heal || []).includes(victim);
        if (!protectedByGuard && !savedByWitch) {
          if (state.infectedPlayer === victim) {
            // Will handle in infectedPlayer block
          } else if (state.playerRoles[victim]?.id === "half_wolf") {
            newPlayerRoles[victim] = {
              id: "werewolf",
              name: "Sói",
              count: 1,
            };
            newLogs.push({
              id: generateId(),
              dayCount: state.dayCount,
              roleId: "werewolf",
              playerName: victim,
              content: `Bán Sói ${victim} đã bị cắn và biến thành Sói từ đêm nay!`,
            });
          } else {
            deaths.add(victim);
          }
        }
      });
    }

    if (state.witchAction.poison) {
      deaths.add(state.witchAction.poison);
    }

    if (state.assassinTarget) {
      if (state.lastProtected !== state.assassinTarget) {
        deaths.add(state.assassinTarget);
      }
    }

    if (state.infectedPlayer) {
      if (state.infectedPlayer === state.lastProtected) {
        newLogs.push({
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "werewolf",
          playerName: state.infectedPlayer,
          content: `Sói Nguyền lây nhiễm thất bại do ${state.infectedPlayer} đã được Bảo vệ.`,
        });
      } else {
        newPlayerRoles[state.infectedPlayer] = {
          id: "werewolf",
          name: "Sói",
          count: 1,
        };
        newLogs.push({
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "werewolf",
          playerName: state.infectedPlayer,
          content: `Sói Nguyền lây nhiễm thành công! ${state.infectedPlayer} đã trở thành Sói.`,
        });
      }
    }

    if (state.whiteWolfVictim) {
      deaths.add(state.whiteWolfVictim);
    }

    const deadArray = Array.from(deaths);
    const newExtraLives = { ...state.extraLives };
    const actualDeaths = new Set<string>();

    // Process initial deaths
    for (const dead of deadArray) {
      if (newExtraLives[dead] > 0) {
        newExtraLives[dead] -= 1;
      } else {
        actualDeaths.add(dead);
      }
    }

    const deathQueue = Array.from(actualDeaths);
    while (deathQueue.length > 0) {
      const currentDead = deathQueue.shift()!;

      if (
        state.playerRoles[currentDead]?.id === "hunter" &&
        state.hunterTarget
      ) {
        const hTarget = state.hunterTarget;
        if (newExtraLives[hTarget] > 0) {
          newExtraLives[hTarget] -= 1;
        } else if (!actualDeaths.has(hTarget)) {
          actualDeaths.add(hTarget);
          deathQueue.push(hTarget);
        }
      }

      if (state.cupidTargets) {
        const [l1, l2] = state.cupidTargets;
        if (currentDead === l1 && !actualDeaths.has(l2)) {
          if (newExtraLives[l2] > 0) newExtraLives[l2] -= 1;
          else {
            actualDeaths.add(l2);
            deathQueue.push(l2);
          }
        } else if (currentDead === l2 && !actualDeaths.has(l1)) {
          if (newExtraLives[l1] > 0) newExtraLives[l1] -= 1;
          else {
            actualDeaths.add(l1);
            deathQueue.push(l1);
          }
        }
      }
    }

    let newExtraWolfKill = state.extraWolfKill;
    actualDeaths.forEach((dead) => {
      if (state.playerRoles[dead]?.id === "wolf_cub") {
        newExtraWolfKill = true;
      }
    });

    let currentMediumUsed = state.mediumUsed;
    if (state.mediumResurrect) {
      currentMediumUsed = true;
      actualDeaths.delete(state.mediumResurrect); // Tránh người được cứu chết nếu họ bị Sói cắn đêm nay
    }

    const newAlive = state.alivePlayers.filter((p) => !actualDeaths.has(p));
    if (
      state.mediumResurrect &&
      !newAlive.includes(state.mediumResurrect) &&
      state.players.includes(state.mediumResurrect)
    ) {
      newAlive.push(state.mediumResurrect); // Đưa người chết từ ngày trước trở lại danh sách sống
    }

    const newWinner = checkWinCondition(
      newAlive,
      newPlayerRoles,
      state.cupidTargets,
      state.hypnotizedPlayers,
    );
    const newPhase = newWinner ? "game_over" : "day";

    const newPotions = { ...state.witchPotions };
    if ((state.witchAction.heal || []).length > 0)
      newPotions.heal -= (state.witchAction.heal || []).length;
    if (state.witchAction.poison) newPotions.poison -= 1;

    const finalDeadArray = Array.from(actualDeaths);
    const sysLog: ActionLog = {
      id: generateId(),
      dayCount: state.dayCount,
      roleId: "system",
      playerName: "system",
      content:
        finalDeadArray.length > 0
          ? `Báo cáo buổi sáng: Đêm qua những người sau đã chết: ${finalDeadArray.join(", ")}`
          : "Báo cáo buổi sáng: Đêm qua là một đêm bình yên, không có ai chết!",
    };
    newLogs.push(sysLog);

    if (state.mediumResurrect) {
      newLogs.push({
        id: generateId(),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content: `✨ Người chơi ${state.mediumResurrect} đã được hồi sinh từ cõi âm!`,
      });
    }

    if (newWinner) {
      const endLog: ActionLog = {
        id: generateId(),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content:
          newWinner === "lovers"
            ? "Trò chơi kết thúc! Cặp đôi đã sống sót đến cuối cùng và giành chiến thắng!"
            : newWinner === "assassin"
              ? "Trò chơi kết thúc! Sát Thủ đã tiêu diệt hầu hết làng và giành chiến thắng."
              : newWinner === "wolves"
                ? "Trò chơi kết thúc! Phe Sói đã chiến thắng."
                : newWinner === "white_wolf"
                  ? "Trò chơi kết thúc! Sói Trắng đã trở thành kẻ sống sót cuối cùng và giành chiến thắng!"
                  : newWinner === "pied_piper"
                    ? "Trò chơi kết thúc! Người Thổi Sáo đã thôi miên toàn bộ dân làng và giành chiến thắng!"
                    : "Trò chơi kết thúc! Phe Dân làng đã chiến thắng.",
      };
      newLogs.push(endLog);
    }

    dispatch({
      type: "UPDATE",
      payload: {
        playerRoles: newPlayerRoles,
        alivePlayers: newAlive,
        extraLives: newExtraLives,
        witchPotions: newPotions,
        deadThisNight: Array.from(actualDeaths),
        actionLogs: newLogs,
        phase: newPhase,
        winner: newWinner,
        dayPhase: newPhase === "day" ? "discussion" : null,
        dayTimeLeft: newPhase === "day" ? 480 : 0,
        nightPhase: null,
        nightTimeLeft: 0,
        confirmedPlayers: [],
        nightSelection: null,
        actionConfirmed: false,
        seerResult: null,
        wolfVotes: {},
        wolfVictim: [],
        witchAction: { heal: [], poison: null },
        whiteWolfVictim: null,
        dayVotes: {},
        accusedPlayer: null,
        executionVotes: {},
        infectedPlayer: null,
        assassinTarget: null,
        mediumUsed: currentMediumUsed,
        mediumResurrect: null,
        extraWolfKill: newExtraWolfKill,
        activeExtraWolfKill: false,
      },
    });

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "phase-change",
        payload: {
          phase: newPhase,
          winner: newWinner,
          dayCount: state.dayCount,
          alivePlayers: newAlive,
          playerRoles: newPlayerRoles,
          infectedPlayer: null,
          extraLives: newExtraLives,
          witchPotions: newPotions,
          deadThisNight: Array.from(actualDeaths),
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: newLogs,
          dayPhase: newPhase === "day" ? "discussion" : null,
          dayTimeLeft: newPhase === "day" ? 480 : 0,
          dayVotes: {},
          accusedPlayer: null,
          executionVotes: {},
          whiteWolfVictim: null,
          assassinTarget: null,
          mediumUsed: currentMediumUsed,
          mediumResurrect: null,
          extraWolfKill: newExtraWolfKill,
          activeExtraWolfKill: false,
        },
      });
    }
  }, [channel]);

  const advanceNightPhase = useCallback(() => {
    const state = stateRef.current;
    const nextNightPhase = getNextNightPhase(
      state.nightPhase,
      state.playerRoles,
      state.dayCount,
    );

    if (nextNightPhase) {
      const timeLimit =
        nextNightPhase === "hunter" && state.dayCount > 1 ? 15 : 120;

      const newConfirmedPlayers = state.confirmedPlayers.filter(
        (p) =>
          state.playerRoles[p]?.id === "seer" ||
          state.playerRoles[p]?.id === "hunter" ||
          state.playerRoles[p]?.id === "medium" ||
          state.playerRoles[p]?.id === "pied_piper",
      );

      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev) => {
          const role = prev.playerRoles[playerName]?.id;
          const keepConfirmed =
            role === "seer" ||
            role === "hunter" ||
            role === "medium" ||
            role === "pied_piper";
          return {
            nightPhase: nextNightPhase,
            nightTimeLeft: timeLimit,
            confirmedPlayers: newConfirmedPlayers,
            nightSelection: keepConfirmed ? prev.nightSelection : null,
            actionConfirmed: keepConfirmed ? prev.actionConfirmed : false,
            seerResult: keepConfirmed ? prev.seerResult : null,
          };
        },
      });

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "night-phase-change",
          payload: {
            nightPhase: nextNightPhase,
            nightTimeLeft: timeLimit,
            confirmedPlayers: newConfirmedPlayers,
          },
        });
      }
    } else {
      executeNightResolution();
    }
  }, [channel, executeNightResolution, playerName]);

  const handleNextPhase = useCallback(() => {
    if (channel && hostName === playerName) {
      if (phase === "role_reveal" || phase === "day") {
        const nextDay = phase === "role_reveal" ? 1 : dayCount + 1;
        const firstNightPhase = getNextNightPhase(null, playerRoles, nextDay);

        if (firstNightPhase) {
          const timeLimit =
            firstNightPhase === "hunter" && nextDay > 1 ? 15 : 120;
          dispatch({
            type: "UPDATE",
            payload: {
              phase: "night",
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
              whiteWolfVictim: null,
              dayPhase: null,
              dayTimeLeft: 0,
              extraWolfKill: false,
              activeExtraWolfKill: stateRef.current.extraWolfKill,
            },
          });

          channel.send({
            type: "broadcast",
            event: "phase-change",
            payload: {
              phase: "night",
              dayCount: nextDay,
              nightPhase: firstNightPhase,
              nightTimeLeft: timeLimit,
              confirmedPlayers: [],
              dayPhase: null,
              dayTimeLeft: 0,
              extraWolfKill: false,
              activeExtraWolfKill: stateRef.current.extraWolfKill,
            },
          });
        } else {
          executeNightResolution();
        }
      }
    }
  }, [
    channel,
    hostName,
    playerName,
    phase,
    dayCount,
    playerRoles,
    executeNightResolution,
  ]);

  const advanceDayPhase = useCallback(() => {
    const state = stateRef.current;
    if (state.dayPhase === "discussion") {
      dispatch({
        type: "UPDATE",
        payload: { dayPhase: "voting", dayTimeLeft: 45 },
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "day-phase-change",
          payload: {
            dayPhase: "voting",
            dayTimeLeft: 45,
            dayVotes: {},
            accusedPlayer: null,
            executionVotes: {},
          },
        });
      }
    } else if (state.dayPhase === "voting") {
      const voteCounts: Record<string, number> = {};
      Object.entries(state.dayVotes).forEach(([voter, target]) => {
        if (target !== "skip") {
          const weight = state.playerRoles[voter]?.id === "mayor" ? 2 : 1;
          voteCounts[target] = (voteCounts[target] || 0) + weight;
        }
      });

      const skipVotesWeight = Object.entries(state.dayVotes).reduce((acc, [voter, target]) => {
        if (target === "skip") {
          return acc + (state.playerRoles[voter]?.id === "mayor" ? 2 : 1);
        }
        return acc;
      }, 0);

      const voteSummaryParts: string[] = [];
      Object.entries(voteCounts).forEach(([target, count]) => {
        voteSummaryParts.push(`${target} (${count} phiếu)`);
      });
      if (skipVotesWeight > 0) {
        voteSummaryParts.push(`Bỏ qua (${skipVotesWeight} phiếu)`);
      }

      const voteLog: ActionLog = {
        id: generateId(),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content: voteSummaryParts.length > 0
          ? `Kết quả biểu quyết: ${voteSummaryParts.join(", ")}`
          : "Không có ai tham gia biểu quyết.",
      };

      let maxVotes = 0;
      let accused: string | null = null;
      let tie = false;

      Object.entries(voteCounts).forEach(([target, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          accused = target;
          tie = false;
        } else if (count === maxVotes) {
          tie = true;
        }
      });

      if (accused && !tie) {
        const sysLog: ActionLog = {
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content: `${accused} có nhiều phiếu nhất (${maxVotes} phiếu) và đang bị đưa lên giàn treo cổ để biện hộ.`,
        };
        const newLogs = [...state.actionLogs, voteLog, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: "defense",
            dayTimeLeft: 90,
            accusedPlayer: accused,
            actionLogs: newLogs,
          },
        });

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "day-phase-change",
            payload: {
              dayPhase: "defense",
              dayTimeLeft: 90,
              accusedPlayer: accused,
              actionLogs: newLogs,
            },
          });
        }
      } else {
        const sysLog: ActionLog = {
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content:
            tie && maxVotes > 0
              ? `Bầu cử hòa (${maxVotes} phiếu). Làng quyết định không treo cổ ai hôm nay.`
              : `Làng quyết định không treo cổ ai hôm nay.`,
        };
        const newLogs = [...state.actionLogs, voteLog, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: null,
            dayTimeLeft: 5,
            actionLogs: newLogs,
          },
        });

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "day-phase-change",
            payload: {
              dayPhase: null,
              dayTimeLeft: 5,
              accusedPlayer: null,
              actionLogs: newLogs,
            },
          });
        }
      }
    } else if (state.dayPhase === "defense") {
      dispatch({
        type: "UPDATE",
        payload: { dayPhase: "execution", dayTimeLeft: 45 },
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "day-phase-change",
          payload: { dayPhase: "execution", dayTimeLeft: 45 },
        });
      }
    } else if (state.dayPhase === "execution") {
      let killVotes = 0;
      let saveVotes = 0;
      Object.entries(state.executionVotes).forEach(([voter, vote]) => {
        const weight = state.playerRoles[voter]?.id === "mayor" ? 2 : 1;
        if (vote === "kill") killVotes += weight;
        else if (vote === "save") saveVotes += weight;
      });

      if (killVotes > saveVotes && state.accusedPlayer) {
        executeDayExecution(state.accusedPlayer);
      } else {
        let killVotesCount = 0;
        let saveVotesCount = 0;
        Object.entries(state.executionVotes).forEach(([voter, vote]) => {
          const weight = state.playerRoles[voter]?.id === "mayor" ? 2 : 1;
          if (vote === "kill") killVotesCount += weight;
          else if (vote === "save") saveVotesCount += weight;
        });

        const execVoteLog: ActionLog = {
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content: `Kết quả phiếu sinh tử: ${killVotesCount} phiếu Treo cổ, ${saveVotesCount} phiếu Tha bổng.`,
        };

        const sysLog: ActionLog = {
          id: generateId(),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content: `${state.accusedPlayer} đã được tha bổng với ${saveVotes} phiếu cứu / ${killVotes} phiếu treo cổ.`,
        };
        const newLogs = [...state.actionLogs, execVoteLog, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: null,
            dayTimeLeft: 5,
            actionLogs: newLogs,
          },
        });

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "day-phase-change",
            payload: { dayPhase: null, dayTimeLeft: 5, actionLogs: newLogs },
          });
        }
      }
    }
  }, [channel, executeDayExecution]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (phase === "night" && gameStarted) {
      if (nightTimeLeft > 0) {
        timerRef.current = setTimeout(() => {
          dispatch({
            type: "UPDATE_FUNCTION",
            payload: (prev) => ({ nightTimeLeft: prev.nightTimeLeft - 1 }),
          });
          if (
            hostName === playerName &&
            channel &&
            (nightTimeLeft - 1) % 5 === 0
          ) {
            channel.send({
              type: "broadcast",
              event: "sync-time",
              payload: { nightTimeLeft: nightTimeLeft - 1 },
            });
          }
        }, 1000);
      } else if (nightTimeLeft === 0 && hostName === playerName) {
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

  const dayTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (phase === "day" && gameStarted) {
      if (dayTimeLeft > 0) {
        dayTimerRef.current = setTimeout(() => {
          dispatch({
            type: "UPDATE_FUNCTION",
            payload: (prev) => ({ dayTimeLeft: prev.dayTimeLeft - 1 }),
          });
          if (
            hostName === playerName &&
            channel &&
            (dayTimeLeft - 1) % 5 === 0
          ) {
            channel.send({
              type: "broadcast",
              event: "sync-day-time",
              payload: { dayTimeLeft: dayTimeLeft - 1 },
            });
          }
        }, 1000);
      } else if (dayTimeLeft === 0 && hostName === playerName) {
        if (!dayPhase) {
          handleNextPhase();
        } else {
          advanceDayPhase();
        }
      }
    }
    return () => {
      if (dayTimerRef.current) clearTimeout(dayTimerRef.current);
    };
  }, [
    phase,
    dayPhase,
    dayTimeLeft,
    hostName,
    playerName,
    gameStarted,
    channel,
    advanceDayPhase,
    dayCount,
    handleNextPhase,
  ]);

  const deadRoleTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (
      phase === "night" &&
      hostName === playerName &&
      gameStarted &&
      nightPhase
    ) {
      const activePlayersOfRole =
        nightPhase === "werewolf"
          ? alivePlayers.filter((p) =>
              [
                "werewolf",
                "cursed_wolf",
                "fog_wolf",
                "wolf_cub",
                "white_wolf",
              ].includes(playerRoles[p]?.id || ""),
            )
          : alivePlayers.filter((p) => playerRoles[p]?.id === nightPhase);

      if (
        activePlayersOfRole.length === 0 ||
        (nightPhase === "white_wolf" && (dayCount < 2 || dayCount % 2 !== 0))
      ) {
        // Nếu role đã chết (hoặc không ai sống), random delay 10-30s để fake hành động
        const currentLimit = nightPhase === "hunter" && dayCount > 1 ? 15 : 120;
        const maxDelay = Math.min(30, currentLimit - 1);
        const minDelay = Math.min(10, maxDelay);
        const randomDelay = getRandomInt(minDelay, maxDelay);

        deadRoleTimerRef.current = setTimeout(() => {
          advanceNightPhase();
        }, randomDelay * 1000);
      } else if (
        activePlayersOfRole.every((p) => confirmedPlayers.includes(p))
      ) {
        advanceNightPhase();
      }
    }
    return () => {
      if (deadRoleTimerRef.current) clearTimeout(deadRoleTimerRef.current);
    };
  }, [
    confirmedPlayers,
    phase,
    nightPhase,
    alivePlayers,
    playerRoles,
    hostName,
    playerName,
    gameStarted,
    dayCount,
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
        (
          p, // Sói trắng không vote cắn
        ) =>
          ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub"].includes(
            playerRoles[p]?.id || "",
          ),
      );
      if (aliveWolves.length === 0) {
        if (wolfVictim.length > 0) {
          dispatch({ type: "UPDATE", payload: { wolfVictim: [] } });
          if (channel) {
            channel.send({
              type: "broadcast",
              event: "room-sync",
              payload: { ...stateRef.current, wolfVotes, wolfVictim: [] },
            });
          }
        }
      } else {
        const allVoted = aliveWolves.every((w) => wolfVotes[w] !== undefined);
        if (allVoted && aliveWolves.length > 0) {
          const firstVote = wolfVotes[aliveWolves[0]] || [];
          const sameTarget = aliveWolves.every((w) => {
            const v = wolfVotes[w] || [];
            return (
              v.length === firstVote.length &&
              v.every((x) => firstVote.includes(x))
            );
          });

          const currentVictimSorted = [...wolfVictim].sort().join(",");
          const newVictimSorted = [...firstVote].sort().join(",");

          if (sameTarget && currentVictimSorted !== newVictimSorted) {
            dispatch({ type: "UPDATE", payload: { wolfVictim: firstVote } });
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current, wolfVotes, wolfVictim: firstVote },
              });
            }
          } else if (!sameTarget && wolfVictim.length > 0) {
            dispatch({ type: "UPDATE", payload: { wolfVictim: [] } });
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current, wolfVotes, wolfVictim: [] },
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
        toast.error(
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
      const shuffledRolePool = shuffleArray(rolePool);

      const newPlayerRoles: Record<string, RoleConfig> = {};
      const newExtraLives: Record<string, number> = {};
      players.forEach((player, idx) => {
        const role = shuffledRolePool[idx];
        newPlayerRoles[player] = role;
        if (role.id === "mayor") {
          newExtraLives[player] = 1;
        }
      });

      let initialHeadhunterTarget: string | null = null;
      const headhunterPlayer = players.find(
        (p) => newPlayerRoles[p]?.id === "headhunter",
      );
      if (headhunterPlayer) {
        const villagers = players.filter((p) => {
          const rId = newPlayerRoles[p]?.id;
          const wolves = [
            "werewolf",
            "half_wolf",
            "white_wolf",
            "cursed_wolf",
            "fog_wolf",
          ];
          const thirdParties = [
            "fool",
            "headhunter",
            "assassin",
            "thief",
            "tanner",
            "pied_piper",
          ];
          return (
            !wolves.includes(rId as string) &&
            !thirdParties.includes(rId as string)
          );
        });
        if (villagers.length > 0) {
          initialHeadhunterTarget =
            villagers[getRandomInt(0, villagers.length - 1)];
        }
      }

      const initialLogs: ActionLog[] = [];
      if (headhunterPlayer && initialHeadhunterTarget) {
        initialLogs.push({
          id: generateId(),
          dayCount: 1,
          roleId: "headhunter",
          playerName: headhunterPlayer,
          content: `Hệ thống đã chọn ${initialHeadhunterTarget} làm mục tiêu săn thưởng của ${headhunterPlayer}. Hãy tìm cách để Làng treo cổ người này!`,
        });
      }

      dispatch({
        type: "UPDATE",
        payload: {
          playerRoles: newPlayerRoles,
          originalRoles: newPlayerRoles,
          gameStarted: true,
          phase: "role_reveal",
          dayPhase: null,
          dayTimeLeft: 0,
          dayVotes: {},
          accusedPlayer: null,
          executionVotes: {},
          dayCount: 0,
          alivePlayers: players,
          lastProtected: null,
          nightSelection: null,
          actionConfirmed: false,
          seerResult: null,
          witchPotions: { heal: 1, poison: 1 },
          wolfVotes: {},
          wolfVictim: [],
          hunterTarget: null,
          witchAction: { heal: [], poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: initialLogs,
          wolfChat: [],
          loversChat: [],
          generalChat: [],
          winner: null,
          extraLives: newExtraLives,
          cursedWolfUsed: false,
          infectedPlayer: null,
          fogWolfUsed: false,
          whiteWolfVictim: null,
          headhunterTarget: initialHeadhunterTarget,
          assassinTarget: null,
          cupidTargets: null,
          mediumUsed: false,
          mediumResurrect: null,
          hypnotizedPlayers: [],
          extraWolfKill: false,
          activeExtraWolfKill: false,
        },
      });

      channel.send({
        type: "broadcast",
        event: "game-start",
        payload: {
          playerRoles: newPlayerRoles,
          originalRoles: newPlayerRoles,
          phase: "role_reveal",
          dayCount: 0,
          alivePlayers: players,
          lastProtected: null,
          witchPotions: { heal: 1, poison: 1 },
          wolfVotes: {},
          wolfVictim: [],
          hunterTarget: null,
          witchAction: { heal: [], poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: initialLogs,
          wolfChat: [],
          loversChat: [],
          generalChat: [],
          winner: null,
          extraLives: newExtraLives,
          dayPhase: null,
          dayTimeLeft: 0,
          dayVotes: {},
          accusedPlayer: null,
          executionVotes: {},
          cursedWolfUsed: false,
          infectedPlayer: null,
          fogWolfUsed: false,
          whiteWolfVictim: null,
          headhunterTarget: initialHeadhunterTarget,
          assassinTarget: null,
          cupidTargets: null,
          mediumUsed: false,
          mediumResurrect: null,
          hypnotizedPlayers: [],
          extraWolfKill: false,
          activeExtraWolfKill: false,
        },
      });
    }
  };

  const handleResetGame = () => {
    if (channel && hostName === playerName) {
      dispatch({
        type: "UPDATE",
        payload: {
          gameStarted: false,
          playerRoles: {},
          originalRoles: {},
          phase: "lobby",
          dayPhase: null,
          dayTimeLeft: 0,
          dayVotes: {},
          accusedPlayer: null,
          executionVotes: {},
          dayCount: 0,
          alivePlayers: [],
          lastProtected: null,
          nightSelection: null,
          actionConfirmed: false,
          seerResult: null,
          witchPotions: { heal: 1, poison: 1 },
          wolfVotes: {},
          wolfVictim: [],
          hunterTarget: null,
          witchAction: { heal: [], poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: [],
          wolfChat: [],
          loversChat: [],
          generalChat: [],
          winner: null,
          extraLives: {},
          cursedWolfUsed: false,
          infectedPlayer: null,
          fogWolfUsed: false,
          whiteWolfVictim: null,
          headhunterTarget: null,
          assassinTarget: null,
          cupidTargets: null,
          mediumUsed: false,
          mediumResurrect: null,
          hypnotizedPlayers: [],
          extraWolfKill: false,
          activeExtraWolfKill: false,
        },
      });

      channel.send({
        type: "broadcast",
        event: "reset-game",
        payload: {},
      });
    }
  };

  return {
    handleJoinRoom,
    handleKickPlayer,
    executeDayExecution,
    executeNightResolution,
    advanceNightPhase,
    handleNextPhase,
    
    advanceDayPhase,
    
    
    
    handleStartGame,
    handleResetGame
  };
};
