"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

import { useWerewolf } from "../contexts/werewolf-context";
import { useWerewolfSync } from "../hooks/use-werewolf-sync";
import { useWerewolfActions } from "../hooks/use-werewolf-actions";

import { Modal } from "@/components/Modal";
import { FaUser, FaSun, FaMoon, FaGhost, FaBook } from "react-icons/fa";

// Import modular components
import NightSkyBackground from "./night-sky-background";
import LobbyScreen from "./lobby-screen";
import InteractiveBoard from "./interactive-board";
import GameSidebar from "./game-sidebar";
import SelfRoleCard from "./self-role-card";
import PostGameScreen from "./post-game-screen";
import DayActionController from "./day-action-controller";
import NightActionController from "./night-action-controller";
import NightSequenceTracker from "./night-sequence-tracker";

import { defaultRoles, RoleIcon } from "../utils";

function WerewolfGameUI() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [inputName, setInputName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [showGameSummaryModal, setShowGameSummaryModal] = useState<boolean>(false);
  const [summaryTab, setSummaryTab] = useState<"night" | "day">("night");
  const [activeLogTab, setActiveLogTab] = useState<"night" | "day">("night");
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);

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
    setRequestedRole,
  } = useWerewolf();

  // Bind real-time supbase listener
  useWerewolfSync();

  // Load actions helper
  const {
    handleStartGame,
    handleResetGame,
    handleKickPlayer,
    handleNextPhase,
  } = useWerewolfActions();

  const {
    hostName,
    players,
    spectators,
    gameStarted,
    roleConfig,
    playerRoles,
    phase,
    dayPhase,
    dayTimeLeft,
    dayVotes = {},
    accusedPlayer,
    executionVotes = {},
    dayCount,
    alivePlayers = [],
    wolfVotes = {},
    wolfVictim = [],
    actionLogs = [],
    nightPhase,
    nightTimeLeft,
    confirmedPlayers = [],
    wolfChat = [],
    loversChat = [],
    generalChat = [],
    winner,
    activeExtraWolfKill,
    lastProtected,
    nightSelection,
    witchPotions = { heal: 1, poison: 1 },
    witchAction = { heal: [], poison: null },
    cupidTargets,
    headhunterTarget,
    timeSettings = { discussion: 480, voting: 45, defense: 90, night: 60 },
  } = gameState;

  const isNight = phase === "night" && gameStarted;

  // Initialize Room ID on mount
  useEffect(() => {
    if (roomParam) {
      setRoomId(roomParam);
    }

    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setInputName(savedName);

      if (!roomParam) {
        setShowNameModal(false);
        setHasInitialized(true);
        const newRoomId = Math.random().toString(36).substring(2, 9);
        setRoomId(newRoomId);
        dispatch({
          type: "UPDATE",
          payload: { hostName: savedName, players: [savedName] },
        });
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

  useEffect(() => {
    if (phase === "night") setActiveLogTab("night");
    else setActiveLogTab("day");
  }, [phase]);

  // Update lobby config count
  const updateRoleCount = (id: string, delta: number) => {
    if (hostName !== playerName) return;

    dispatch({
      type: "UPDATE_FUNCTION",
      payload: (prev) => {
        const newConfig = prev.roleConfig.map((role) => {
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
        return { roleConfig: newConfig };
      },
    });
  };

  const applyRolePreset = (presetCounts: Record<string, number>) => {
    if (hostName !== playerName) return;
    dispatch({
      type: "UPDATE_FUNCTION",
      payload: (prev) => {
        const newConfig = prev.roleConfig.map((role) => ({
          ...role,
          count: presetCounts[role.id] || 0,
        }));
        if (channel) {
          channel.send({
            type: "broadcast",
            event: "update-roles",
            payload: { roleConfig: newConfig },
          });
        }
        return { roleConfig: newConfig };
      },
    });
  };

  const updateTimeSettings = (newSettings: { discussion: number; voting: number; defense: number; night: number }) => {
    if (hostName !== playerName) return;

    dispatch({
      type: "UPDATE",
      payload: { timeSettings: newSettings },
    });
    
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "update-time-settings",
        payload: { timeSettings: newSettings },
      });
    }
  };

  const onCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleJoinFormSubmit = (e: React.FormEvent) => {
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
        const newRoomId = Math.random().toString(36).substring(2, 9);
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
          spectators: prev.spectators.map((s) => (s === playerName ? newName : s)),
        }),
      });
    }
  };

  // Click on Player Card handler (Interactive Board click to act)
  const handlePlayerCardClick = (targetPlayerName: string) => {
    if (!gameStarted || !alivePlayers.includes(playerName)) return;

    // Day Voting selection
    if (phase === "day" && dayPhase === "voting" && alivePlayers.includes(targetPlayerName)) {
      const isCurrentlySelected = dayVotes[playerName] === targetPlayerName;
      const newTarget = isCurrentlySelected ? null : targetPlayerName;
      
      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev: any) => ({
          dayVotes: {
            ...prev.dayVotes,
            [playerName]: newTarget || "skip",
          },
        }),
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "day-vote",
          payload: { playerName, target: newTarget || "skip" },
        });
      }
      return;
    }

    // Night action selections
    if (phase === "night") {
      const myRole = playerRoles[playerName]?.id;
      const isActAnytimeRole = ["hunter", "medium", "pied_piper", "seer"].includes(myRole || "");
      const isMyTurn = nightPhase === myRole || isActAnytimeRole;

      // Werewolf selection
      const isWolf = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub"].includes(myRole || "");
      if (nightPhase === "werewolf" && isWolf && alivePlayers.includes(targetPlayerName)) {
        const currentVotes = wolfVotes[playerName] || [];
        const maxTargets = activeExtraWolfKill ? 2 : 1;
        let newVotes: string[];
        if (currentVotes.includes(targetPlayerName)) {
          newVotes = currentVotes.filter((v: any) => v !== targetPlayerName);
        } else {
          newVotes = [...currentVotes, targetPlayerName].slice(-maxTargets);
        }

        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev: any) => ({
            wolfVotes: {
              ...prev.wolfVotes,
              [playerName]: newVotes,
            },
          }),
        });
        if (channel) {
          channel.send({
            type: "broadcast",
            event: "wolf-vote",
            payload: { playerName, target: newVotes },
          });
        }
        return;
      }

      // Seer, Bodyguard, Hunter, Assassin selection
      const isStandardTargetRole = ["seer", "bodyguard", "hunter", "assassin"].includes(myRole || "");
      if (isMyTurn && isStandardTargetRole) {
        if (myRole === "bodyguard" && targetPlayerName === lastProtected) {
          toast.error("Không thể bảo vệ người này 2 đêm liên tiếp!");
          return;
        }
        if (myRole === "seer" && targetPlayerName === playerName) {
          toast.error("Bạn không thể tự soi chính mình!");
          return;
        }
        if (myRole === "hunter" && targetPlayerName === playerName) return;
        if (myRole === "assassin" && targetPlayerName === playerName) return;

        const newSelection = nightSelection === targetPlayerName ? null : targetPlayerName;
        dispatch({
          type: "UPDATE",
          payload: { nightSelection: newSelection },
        });
        return;
      }

      // Witch target action selection
      if (isMyTurn && myRole === "witch") {
        const isVictim = wolfVictim.includes(targetPlayerName);
        if (isVictim && witchPotions.heal > 0) {
          const currentHeal = witchAction.heal || [];
          let newHeal: string[];
          if (currentHeal.includes(targetPlayerName)) {
            newHeal = currentHeal.filter((x: any) => x !== targetPlayerName);
          } else {
            if (currentHeal.length < witchPotions.heal) {
              newHeal = [...currentHeal, targetPlayerName];
            } else if (witchPotions.heal === 1) {
              newHeal = [targetPlayerName];
            } else {
              newHeal = currentHeal; // Do not add if max reached
            }
          }
          dispatch({
            type: "UPDATE_FUNCTION",
            payload: (prev: any) => ({
              witchAction: {
                ...prev.witchAction,
                heal: newHeal,
              },
            }),
          });
        } else if (!isVictim && witchPotions.poison > 0 && targetPlayerName !== playerName) {
          const newPoison = witchAction.poison === targetPlayerName ? null : targetPlayerName;
          dispatch({
            type: "UPDATE_FUNCTION",
            payload: (prev: any) => ({
              witchAction: {
                ...prev.witchAction,
                poison: newPoison,
              },
            }),
          });
        }
        return;
      }

      // Cupid target selection
      if (isMyTurn && myRole === "cupid" && dayCount === 1) {
        if (!alivePlayers.includes(targetPlayerName)) return;
        let selected = nightSelection ? nightSelection.split(",") : [];
        if (selected.includes(targetPlayerName)) {
          selected = selected.filter((p) => p !== targetPlayerName);
        } else if (selected.length < 2) {
          selected.push(targetPlayerName);
        }
        dispatch({
          type: "UPDATE",
          payload: { nightSelection: selected.length ? selected.join(",") : null },
        });
        return;
      }

      // Medium target selection (dead players)
      if (isMyTurn && myRole === "medium") {
        if (alivePlayers.includes(targetPlayerName)) return; // Only dead
        const newSelection = nightSelection === targetPlayerName ? null : targetPlayerName;
        dispatch({ type: "UPDATE", payload: { nightSelection: newSelection } });
        return;
      }

      // Pied Piper target selection
      if (isMyTurn && myRole === "pied_piper") {
        if (!alivePlayers.includes(targetPlayerName) || targetPlayerName === playerName) return;
        if ((gameState.hypnotizedPlayers || []).includes(targetPlayerName)) return; // already hypnotized
        const newSelection = nightSelection === targetPlayerName ? null : targetPlayerName;
        dispatch({ type: "UPDATE", payload: { nightSelection: newSelection } });
        return;
      }

      // White Wolf target selection
      if (isMyTurn && myRole === "white_wolf") {
        if (!alivePlayers.includes(targetPlayerName) || targetPlayerName === playerName) return;
        const targetRole = playerRoles[targetPlayerName]?.id;
        const isTargetWolf = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "white_wolf"].includes(targetRole || "");
        if (!isTargetWolf) return; // Only target other wolves
        const newSelection = nightSelection === targetPlayerName ? null : targetPlayerName;
        dispatch({ type: "UPDATE", payload: { nightSelection: newSelection } });
        return;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper to return visual action helper guidance
  const getPromptText = () => {
    if (!gameStarted) return "Đang trong sảnh phòng chờ...";
    if (!alivePlayers.includes(playerName)) {
      return "Bạn đã hy sinh. Hãy tiếp tục quan sát sảnh đấu và ghi nhật ký.";
    }

    if (phase === "night") {
      const myRole = playerRoles[playerName]?.id;
      const isActAnytimeRole = ["hunter", "medium", "pied_piper", "seer"].includes(myRole || "");
      const isMyTurn = nightPhase === myRole || isActAnytimeRole;
      const isWolf = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub"].includes(myRole || "");

      if (isWolf && nightPhase === "werewolf") {
        return "🐺 Phe Sói hành động. Đồng lòng chọn cắn 1 người bằng cách click trực tiếp vào thẻ của họ.";
      }
      if (isMyTurn) {
        if (myRole === "seer") return "🔮 Tiên Tri hành động. Hãy click chọn 1 người chơi để soi vai trò.";
        if (myRole === "bodyguard") return "🛡️ Bảo Vệ hành động. Click chọn 1 người bạn muốn che chở.";
        if (myRole === "hunter") return "🏹 Thợ Săn hành động. Ghim 1 mục tiêu chết theo nếu bạn hy sinh đêm nay.";
        if (myRole === "witch") return "🧪 Phù Thủy hành động. Hãy lựa chọn dùng bình thuốc cứu người hoặc hạ độc.";
        if (myRole === "assassin") return "🔪 Sát Thủ hành động. Hãy chọn 1 người để ám sát.";
        if (myRole === "cupid") return "💖 Thần Tình Yêu hành động. Hãy chọn ghép đôi hai người.";
        if (myRole === "medium") return "🔮 Thầy Đồng hành động. Bạn có thể chọn hồi sinh 1 người đã mất.";
        if (myRole === "pied_piper") return "🎵 Người Thổi Sáo hành động. Chọn 1 người để thôi miên.";
        if (myRole === "white_wolf") return "🐺 Sói Trắng hành động. Chọn 1 con Sói để tiêu diệt.";
        if (myRole === "cursed_wolf") return "🐺 Sói Nguyền hành động. Chọn lây nhiễm nạn nhân bị cắn để biến họ thành Sói.";
      }
      return `🌙 Đêm ${dayCount}. Làng đang chìm vào giấc ngủ. Đang chờ lượt của ${
        defaultRoles.find((r) => r.id === nightPhase)?.name || "người khác"
      }...`;
    }

    if (phase === "day") {
      if (dayPhase === "discussion") return "🗣️ Ban Ngày. Cả làng tự do thảo luận tìm kiếm các dấu hiệu Ma Sói.";
      if (dayPhase === "voting") return "⚖️ Cả làng bỏ phiếu. Hãy click chọn 1 nghi can đưa lên giàn treo cổ.";
      if (dayPhase === "defense") return "⚖️ Phiên tòa. Lắng nghe nghi can biện hộ cho sự trong sạch của bản thân.";
      if (dayPhase === "execution") return `⚖️ Phán quyết cuối cùng. Bỏ phiếu kết liễu hoặc tha bổng cho ${accusedPlayer}.`;
    }

    return "Trò chơi đang tiếp diễn...";
  };

  const getLogFormatted = (content: string) => {
    const sortedNames = [...players].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${sortedNames.join("|")})`, "g");
    return content.split(regex).map((part, i) => {
      if (players.includes(part)) {
        return (
          <span key={i} className="font-bold text-zinc-900">
            {part} {part === playerName && "(Bạn)"}
          </span>
        );
      }
      return part;
    });
  };

  if (isCheckingStorage) {
    return (
      <div className="flex min-h-screen items-center justify-center font-medium text-zinc-500 bg-zinc-50">
        Đang tải phòng chơi...
      </div>
    );
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center px-4 py-8 md:justify-center overflow-x-hidden transition-colors duration-1000 ease-in-out ${
        isNight ? "bg-slate-950 text-slate-50" : "bg-zinc-50 text-zinc-950"
      }`}
    >
      {/* 3D Twinkling Starry night background layer */}
      <div
        className={`absolute inset-0 pointer-events-none z-0 ${
          isNight ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <NightSkyBackground />
      </div>

      {/* Floating profile avatar button to change name */}
      {hasInitialized && (
        <div className="fixed left-6 top-6 z-[40]">
          <button
            onClick={() => setShowNameModal(true)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-black shadow-md hover:scale-105 transition-transform ${
              isNight ? "bg-slate-800 text-indigo-300 border border-slate-700" : "bg-zinc-900 text-white"
            }`}
            title="Chỉnh sửa tên hiển thị"
          >
            {playerName ? playerName.charAt(0).toUpperCase() : <FaUser />}
          </button>
        </div>
      )}



      {/* Name Join Modal */}
      <Modal
        isOpen={showNameModal}
        title={
          hasInitialized
            ? "Chỉnh sửa tên của bạn"
            : roomParam
              ? "Tham gia đấu trường Ma Sói"
              : "Tạo phòng chơi Ma Sói mới"
        }
      >
        <form onSubmit={handleJoinFormSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Nhập biệt danh của bạn..."
            maxLength={14}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent bg-zinc-50"
            required
            autoFocus
          />
          {!hasInitialized && roomParam && (
            <div className="flex gap-6 justify-center">
              <label className="flex items-center space-x-2 text-sm font-bold text-zinc-700 cursor-pointer">
                <input
                  type="radio"
                  value="player"
                  checked={requestedRole === "player"}
                  onChange={(e) => setRequestedRole(e.target.value as "player" | "spectator")}
                  className="accent-zinc-950 h-4 w-4"
                />
                <span>Người chơi</span>
              </label>
              <label className="flex items-center space-x-2 text-sm font-bold text-zinc-700 cursor-pointer">
                <input
                  type="radio"
                  value="spectator"
                  checked={requestedRole === "spectator"}
                  onChange={(e) => setRequestedRole(e.target.value as "player" | "spectator")}
                  className="accent-zinc-950 h-4 w-4"
                />
                <span>Người xem</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-zinc-950 py-3.5 text-sm font-extrabold text-white hover:bg-zinc-900 transition-colors shadow-sm"
          >
            {hasInitialized ? "Cập nhật tên" : "Vào phòng đấu"}
          </button>
        </form>
      </Modal>

      {/* History timeline full log modal */}
      <Modal isOpen={showGameSummaryModal} title="Lịch sử chiến tích trận đấu" styleClassWrapper="max-w-xl">
        <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-left">
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setSummaryTab("night")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                summaryTab === "night" ? "border-indigo-600 text-indigo-700" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FaMoon className="inline mr-1.5 mb-0.5" /> Lượt Đêm
            </button>
            <button
              onClick={() => setSummaryTab("day")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                summaryTab === "day" ? "border-amber-500 text-amber-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FaSun className="inline mr-1.5 mb-0.5" /> Lượt Ngày
            </button>
          </div>
          
          <div className="space-y-3">
            {(() => {
              const logs = actionLogs.filter((l) => (summaryTab === "night" ? l.roleId !== "system" : l.roleId === "system"));
              if (logs.length === 0) return <p className="text-xs text-zinc-400 text-center py-6 italic">Chưa có bản ghi nào.</p>;
              
              const groupedLogs = logs.reduce((acc, log) => {
                const day = log.dayCount || 1;
                if (!acc[day]) acc[day] = [];
                acc[day].push(log);
                return acc;
              }, {} as Record<number, typeof logs>);

              return Object.entries(groupedLogs).sort(([a], [b]) => Number(a) - Number(b)).map(([day, dayLogs]) => (
                <div key={`day-group-${day}`} className="mb-6">
                  <h4 className="text-sm font-black text-zinc-800 mb-3 border-b pb-1">
                    {summaryTab === "night" ? `🌙 Đêm ${day}` : `☀️ Ngày ${day}`}
                  </h4>
                  <div className="space-y-3 pl-2 border-l-2 border-indigo-100">
                    {dayLogs.map((log) => {
                      const roleName = log.roleId === "system" ? "Hệ thống" : defaultRoles.find((r) => r.id === log.roleId)?.name || log.roleId;
                      return (
                        <div key={log.id} className="text-xs bg-zinc-50 border border-zinc-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                          <span className={`font-extrabold ${log.roleId === "system" ? "text-amber-600" : "text-indigo-600"}`}>
                            {roleName} {log.playerName !== "system" && `(${log.playerName})`}
                          </span>
                          <p className="mt-1 text-zinc-600 font-medium leading-relaxed">
                            {getLogFormatted(log.content)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
          
          <button
            onClick={() => setShowGameSummaryModal(false)}
            className="w-full cursor-pointer rounded-xl bg-zinc-950 py-3 text-xs font-bold text-white hover:bg-zinc-900"
          >
            Đóng
          </button>
        </div>
      </Modal>

      {/* Main Orchestrator layout renderer */}
      {!showNameModal && (
        <div className="w-full flex flex-col items-center z-10">
          {/* Lobby Screen */}
          {!gameStarted && (
            <LobbyScreen
              players={players}
              spectators={spectators}
              playerName={playerName}
              hostName={hostName}
              roleConfig={roleConfig}
              updateRoleCount={updateRoleCount}
              applyRolePreset={applyRolePreset}
              timeSettings={timeSettings}
              updateTimeSettings={updateTimeSettings}
              handleStartGame={handleStartGame}
              handleKickPlayer={handleKickPlayer}
              linkCopied={linkCopied}
              onCopyLink={onCopyLink}
              generalChat={generalChat}
              onSendGeneralMessage={(msg) => {
                const newMsg = { id: Math.random().toString(), playerName, message: msg, timestamp: Date.now() };
                dispatch({ type: "UPDATE_FUNCTION", payload: (prev) => ({ generalChat: [newMsg, ...(prev.generalChat || [])] }) });
                if (channel) channel.send({ type: "broadcast", event: "general-chat", payload: { message: newMsg } });
              }}
            />
          )}

          {/* Post Game Screen */}
          {gameStarted && phase === "game_over" && (
            <PostGameScreen
              winner={winner}
              players={players}
              playerRoles={playerRoles}
              originalRoles={gameState.originalRoles}
              playerName={playerName}
              hostName={hostName}
              alivePlayers={alivePlayers}
              handleResetGame={handleResetGame}
              showSummaryModal={() => {
                setSummaryTab("night");
                setShowGameSummaryModal(true);
              }}
            />
          )}

          {/* Active Gaming Screen Layout */}
          {gameStarted && phase !== "game_over" && (
            <div className="flex flex-col w-full max-w-7xl mt-4 gap-4 h-[calc(100vh-8rem)] min-h-[600px]">
              {/* Night sequence turn progress tracker - full width at the top */}
              {isNight && <NightSequenceTracker />}

              {/* 3-column grid layout */}
              <div className="grid w-full flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_350px] overflow-hidden">
              
              {/* Left Column: Self Card & Host actions */}
              <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-4 custom-scrollbar">
                {/* Visual Status Panel */}
                <div className={`w-full rounded-2xl border p-5 shadow-sm transition-all duration-500 ${
                  isNight
                    ? "border-slate-800 bg-slate-900/60 text-white shadow-indigo-950/20"
                    : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-200/50"
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-105 ${
                      isNight
                        ? "bg-indigo-950 text-indigo-400 border border-indigo-800/50 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                        : "bg-amber-100 text-amber-600 border border-amber-200"
                    }`}>
                      {isNight ? <FaMoon className="text-xl animate-pulse" /> : <FaSun className="text-xl animate-spin-slow" style={{ animationDuration: "12s" }} />}
                    </div>
                    <div className="text-left">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isNight ? "text-indigo-400" : "text-amber-600"
                      }`}>
                        Vòng đấu hiện tại
                      </span>
                      <h2 className="text-xl font-extrabold tracking-tight">
                        {isNight ? `Đêm ${dayCount}` : `Ngày ${dayCount}`}
                      </h2>
                    </div>
                  </div>

                  {/* Glowing Timer - only shown at night since day time is shown in the DayActionController */}
                  {isNight && (
                    <div className="w-full flex flex-col items-center mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">
                        Thời gian còn lại
                      </span>
                      <div className="w-full flex h-11 items-center justify-center rounded-xl font-mono text-2xl font-extrabold tracking-widest border bg-slate-950 border-indigo-900/60 text-indigo-200 shadow-[inset_0_0_8px_rgba(99,102,241,0.1)] transition-shadow">
                        {formatTime(nightTimeLeft)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Self secrets Card */}
                <SelfRoleCard
                  playerName={playerName}
                  role={playerRoles[playerName]}
                  originalRole={gameState.originalRoles[playerName]}
                  isNight={isNight}
                />

                {/* Host Force Actions & Quick Reset panel */}
                {hostName === playerName && (
                  <div className={`rounded-2xl border p-5 shadow-sm ${
                    isNight ? "border-slate-800 bg-slate-900/60" : "border-zinc-200 bg-white"
                  }`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isNight ? "text-slate-400" : "text-zinc-500"}`}>
                      Bảng Quản Trị Viên (Host)
                    </h4>
                    <div className="flex flex-col gap-2">
                      {(phase === "role_reveal" || (phase === "day" && !dayPhase)) && (
                        <button
                          onClick={handleNextPhase}
                          className="w-full cursor-pointer rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-extrabold text-white transition-colors"
                        >
                          Chuyển sang Đêm {phase === "day" ? dayCount + 1 : 1}
                        </button>
                      )}
                      <button
                        onClick={handleResetGame}
                        className="w-full cursor-pointer rounded-xl bg-red-600 hover:bg-red-700 py-3 text-xs font-extrabold text-white transition-colors"
                      >
                        Hủy trận / Reset Phòng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Column: Game Header & Interactive Board */}
              <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-4 custom-scrollbar">
                {/* Visual Header Instructions Banner */}
                <div
                  className={`w-full rounded-2xl border p-4 shadow-sm transition-all duration-700 ease-in-out ${
                    isNight
                      ? "border-indigo-900/50 bg-slate-800/80 text-indigo-100 shadow-indigo-950/10"
                      : "border-zinc-200 bg-white text-zinc-800 shadow-zinc-200/50"
                  }`}
                >
                  <p className="text-sm font-bold text-center leading-relaxed">
                    {getPromptText()}
                  </p>
                </div>

                {/* Night sequence turn progress tracker bar was moved to the left column */}

                {/* Main Interactive Player Grid Board */}
                <InteractiveBoard
                  players={players}
                  alivePlayers={alivePlayers}
                  playerRoles={playerRoles}
                  originalRoles={gameState.originalRoles}
                  playerName={playerName}
                  hostName={hostName}
                  gameStarted={gameStarted}
                  phase={phase}
                  dayPhase={dayPhase}
                  nightPhase={nightPhase}
                  headhunterTarget={headhunterTarget}
                  cupidTargets={cupidTargets}
                  hypnotizedPlayers={gameState.hypnotizedPlayers}
                  isNight={isNight}
                  onKickPlayer={handleKickPlayer}
                  nightSelection={nightSelection}
                  dayVotes={dayVotes}
                  wolfVotes={wolfVotes}
                  witchAction={witchAction}
                  activeExtraWolfKill={activeExtraWolfKill}
                  lastProtected={lastProtected}
                  wolfVictim={wolfVictim}
                  onPlayerClick={handlePlayerCardClick}
                />

                {/* Dead player alert box inside board column */}
                {!alivePlayers.includes(playerName) && (
                  <div className={`flex w-full items-start space-x-3 rounded-2xl border p-5 ${
                    isNight ? "border-slate-800 bg-slate-900/50" : "border-zinc-200 bg-zinc-100"
                  }`}>
                    <FaGhost className="text-3xl text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold">Bạn Đã Tử Nạn</h4>
                      <p className={`text-xs mt-1.5 leading-relaxed ${isNight ? "text-slate-400" : "text-zinc-500"}`}>
                        Mọi tương tác cắn, bảo vệ hoặc bỏ phiếu của bạn đã kết thúc. Vui lòng không tiết lộ bí mật hoặc chat làm phiền trong thời gian này.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Unified Sidebar (Chat / Logs / Roles cheat sheet) */}
              <div className="flex flex-col space-y-4 h-full overflow-hidden pb-2">
                <GameSidebar
                  actionComponent={
                    <>
                      {phase === "night" && alivePlayers.includes(playerName) && (
                        <NightActionController />
                      )}
                      {phase === "day" && (
                        <DayActionController
                          gameState={gameState}
                          dispatch={dispatch}
                          channel={channel}
                          playerName={playerName}
                        />
                      )}
                    </>
                  }
                  playerName={playerName}
                  alivePlayers={alivePlayers}
                  playerRoles={playerRoles}
                  phase={phase}
                  isNight={isNight}
                  
                  // Chat props
                  wolfChat={wolfChat}
                  loversChat={loversChat}
                  generalChat={generalChat}
                  isWolf={
                    ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "white_wolf"].includes(playerRoles[playerName]?.id || "")
                  }
                  isLover={!!(cupidTargets && cupidTargets.includes(playerName))}
                  
                  onSendWolfMessage={(msg) => {
                    const newMsg = { id: Math.random().toString(), playerName, message: msg, timestamp: Date.now() };
                    dispatch({ type: "UPDATE_FUNCTION", payload: (prev) => ({ wolfChat: [newMsg, ...(prev.wolfChat || [])] }) });
                    if (channel) channel.send({ type: "broadcast", event: "wolf-chat", payload: { message: newMsg } });
                  }}
                  
                  onSendLoversMessage={(msg) => {
                    const newMsg = { id: Math.random().toString(), playerName, message: msg, timestamp: Date.now() };
                    dispatch({ type: "UPDATE_FUNCTION", payload: (prev) => ({ loversChat: [newMsg, ...(prev.loversChat || [])] }) });
                    if (channel) channel.send({ type: "broadcast", event: "lovers-chat", payload: { message: newMsg } });
                  }}
                  
                  onSendGeneralMessage={(msg) => {
                    const newMsg = { id: Math.random().toString(), playerName, message: msg, timestamp: Date.now() };
                    dispatch({ type: "UPDATE_FUNCTION", payload: (prev) => ({ generalChat: [newMsg, ...(prev.generalChat || [])] }) });
                    if (channel) channel.send({ type: "broadcast", event: "general-chat", payload: { message: newMsg } });
                  }}

                  // Logs props
                  actionLogs={actionLogs}
                  activeLogTab={activeLogTab}
                  setActiveLogTab={setActiveLogTab}

                  // Reference props
                  roleConfig={roleConfig}
                />

                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default WerewolfGameUI;
