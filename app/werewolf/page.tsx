/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
  useReducer,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Modal } from "@/components/Modal";
import { FaGhost, FaMoon, FaSun, FaEye, FaUser } from "react-icons/fa";
import {
  GiWolfHead,
  GiShield,
  GiWitchFlight,
  GiMusket,
  GiBullseye,
  GiBowieKnife,
} from "react-icons/gi";
import { RoleConfig, ActionLog, ChatMessage } from "./types";
import { defaultRoles, RoleIcon } from "./utils";
import PlayerGrid from "./PlayerGrid";
import WolfChat from "./WolfChat";
import RoleConfigPanel from "./RoleConfigPanel";
import ActionLogsArea from "./ActionLogsArea";

const getNextNightPhase = (
  currentPhase: string | null,
  roles: Record<string, RoleConfig>,
  dayCount: number,
) => {
  const nightPhaseOrder = [
    "bodyguard",
    "werewolf",
    "cursed_wolf",
    "assassin",
    "seer",
    "witch",
    "headhunter",
    "hunter",
  ];
  const startIndex = currentPhase
    ? nightPhaseOrder.indexOf(currentPhase) + 1
    : 0;
  for (let i = startIndex; i < nightPhaseOrder.length; i++) {
    const role = nightPhaseOrder[i];
    if (role === "headhunter" && dayCount > 1) {
      continue;
    }
    const hasRoleInGame = Object.values(roles).some(
      (r) =>
        r?.id === role ||
        (role === "werewolf" &&
          (r?.id === "cursed_wolf" || r?.id === "fog_wolf")),
    );
    if (hasRoleInGame) return role;
  }
  return null;
};

type GameState = {
  hostName: string | null;
  players: string[];
  spectators: string[];
  gameStarted: boolean;
  roleConfig: RoleConfig[];
  playerRoles: Record<string, RoleConfig>;
  phase: "lobby" | "role_reveal" | "night" | "day" | "game_over";
  dayPhase: "discussion" | "voting" | "defense" | "execution" | null;
  dayTimeLeft: number;
  dayVotes: Record<string, string>;
  accusedPlayer: string | null;
  executionVotes: Record<string, "kill" | "save">;
  dayCount: number;
  alivePlayers: string[];
  lastProtected: string | null;
  witchPotions: { heal: number; poison: number };
  wolfVotes: Record<string, string>;
  wolfVictim: string | null;
  hunterTarget: string | null;
  witchAction: { heal: boolean; poison: string | null };
  deadThisNight: string[];
  nightSelection: string | null;
  actionConfirmed: boolean;
  seerResult: { name: string; isWolf: boolean } | null;
  actionLogs: ActionLog[];
  nightPhase: string | null;
  nightTimeLeft: number;
  confirmedPlayers: string[];
  wolfChat: ChatMessage[];
  winner: "wolves" | "villagers" | "fool" | "headhunter" | "assassin" | null;
  extraLives: Record<string, number>;
  cursedWolfUsed: boolean;
  infectedPlayer: string | null;
  fogWolfUsed: boolean;
  headhunterTarget: string | null;
  assassinTarget: string | null;
};

type GameAction =
  | { type: "UPDATE"; payload: Partial<GameState> }
  | {
      type: "UPDATE_FUNCTION";
      payload: (state: GameState) => Partial<GameState>;
    };

const initialGameState: GameState = {
  hostName: null,
  players: [],
  spectators: [],
  gameStarted: false,
  roleConfig: defaultRoles,
  playerRoles: {},
  phase: "lobby",
  dayPhase: null,
  dayTimeLeft: 0,
  dayVotes: {},
  accusedPlayer: null,
  executionVotes: {},
  dayCount: 0,
  alivePlayers: [],
  lastProtected: null,
  witchPotions: { heal: 1, poison: 1 },
  wolfVotes: {},
  wolfVictim: null,
  hunterTarget: null,
  witchAction: { heal: false, poison: null },
  deadThisNight: [],
  nightSelection: null,
  actionConfirmed: false,
  seerResult: null,
  actionLogs: [],
  nightPhase: null,
  nightTimeLeft: 0,
  confirmedPlayers: [],
  wolfChat: [],
  winner: null,
  extraLives: {},
  cursedWolfUsed: false,
  infectedPlayer: null,
  fogWolfUsed: false,
  headhunterTarget: null,
  assassinTarget: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "UPDATE_FUNCTION":
      return { ...state, ...action.payload(state) };
    default:
      return state;
  }
}

const checkWinCondition = (
  alivePlayers: string[],
  playerRoles: Record<string, RoleConfig>,
) => {
  const assassinAlive = alivePlayers.some(
    (p) => playerRoles[p]?.id === "assassin",
  );
  if (assassinAlive && alivePlayers.length <= 2) {
    return "assassin";
  }

  let wolfCount = 0;
  let villagerCount = 0;
  alivePlayers.forEach((p) => {
    if (
      playerRoles[p]?.id === "werewolf" ||
      playerRoles[p]?.id === "cursed_wolf" ||
      playerRoles[p]?.id === "fog_wolf"
    )
      wolfCount++;
    else villagerCount++;
  });

  if (wolfCount === 0 && !assassinAlive) return "villagers";
  if (wolfCount >= villagerCount) return "wolves";
  return null;
};

// ============================================================================
// ==================== STRATEGY PATTERN CHO ROLE UIs =========================
// ============================================================================

type RoleUIProps = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  channel: RealtimeChannel | null;
  playerName: string;
  executeAction: (
    logContent: string | null,
    stateUpdates: Partial<GameState>,
    broadcastEvent?: { name: string; payload: any },
  ) => void;
};

const BodyguardNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { alivePlayers, lastProtected, nightSelection, actionConfirmed } =
    gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-green-700">
          <GiShield className="mr-1 inline text-green-700" />
          Bạn đã chọn bảo vệ:
          <span className="ml-1 font-bold">{nightSelection}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người để bảo vệ đêm nay (không được bảo vệ người cũ của đêm qua):
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers.map((p) => (
          <button
            key={p}
            disabled={p === lastProtected}
            onClick={() =>
              dispatch({ type: "UPDATE", payload: { nightSelection: p } })
            }
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              nightSelection === p
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
            }`}
          >
            {p} {p === lastProtected && "(Đã bảo vệ)"}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          executeAction(
            `Bạn đã bảo vệ ${nightSelection}`,
            { lastProtected: nightSelection as string | null },
            {
              name: "night-action",
              payload: {
                role: "bodyguard",
                target: nightSelection,
                playerName,
              },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Xác nhận
      </button>
    </div>
  );
};

const WerewolfNightUI = ({
  gameState,
  dispatch,
  channel,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { alivePlayers, playerRoles, wolfVotes, actionConfirmed } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-red-700">
          <GiWolfHead className="mr-1 inline text-red-700" />
          Bạn đã chốt vote cắn:
          <span className="ml-1 font-bold">
            {wolfVotes[playerName] === "none"
              ? "Không ai"
              : wolfVotes[playerName]}
          </span>
        </p>
        <p className="mt-1 text-xs text-indigo-400">
          Đợi các Sói khác và Phù thủy...
        </p>
      </div>
    );
  }

  const handleVote = (target: string) => {
    const newVotes = { ...wolfVotes, [playerName]: target };
    dispatch({
      type: "UPDATE",
      payload: { nightSelection: target, wolfVotes: newVotes },
    });
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "wolf-vote",
        payload: { playerName, target },
      });
    }
  };

  const myVote = wolfVotes[playerName];
  const aliveWolves = alivePlayers.filter(
    (w) =>
      playerRoles[w]?.id === "werewolf" ||
      playerRoles[w]?.id === "cursed_wolf" ||
      playerRoles[w]?.id === "fog_wolf",
  );
  const isWaitingForOthers = aliveWolves.some((w) => wolfVotes[w] !== myVote);

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người để cắn. Sói cần phải thống nhất vote cùng 1 người.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers.map((p) => {
          const wolvesVotingForP = aliveWolves.filter(
            (w) => wolfVotes[w] === p,
          );
          return (
            <button
              key={p}
              onClick={() => handleVote(p)}
              className={`relative cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                myVote === p
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
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
        <button
          onClick={() => handleVote("none")}
          className={`relative cursor-pointer col-span-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            myVote === "none"
              ? "border-slate-500 bg-slate-600 text-white"
              : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
          }`}
        >
          Không cắn ai
          {aliveWolves.filter((w) => wolfVotes[w] === "none").length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
              {aliveWolves.filter((w) => wolfVotes[w] === "none").length}
            </span>
          )}
        </button>
      </div>
      <button
        onClick={() => {
          executeAction(
            `Bạn đã vote cắn ${myVote === "none" ? "Không ai" : myVote}`,
            {},
          );
        }}
        disabled={!myVote || isWaitingForOthers}
        className="w-full cursor-pointer rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
      >
        {isWaitingForOthers ? "Chờ đồng bọn thống nhất" : "Xác nhận vote"}
      </button>
    </div>
  );
};

const CursedWolfNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { wolfVictim, cursedWolfUsed, actionConfirmed } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-rose-700">
          Bạn đã hoàn tất lượt của mình.
        </p>
      </div>
    );
  }

  if (cursedWolfUsed || !wolfVictim || wolfVictim === "none") {
    return (
      <div className="flex flex-col gap-4 w-full mt-2">
        <p className="text-sm font-medium text-indigo-300">
          {cursedWolfUsed
            ? "Bạn đã sử dụng quyền năng lây nhiễm trong trận này."
            : "Đêm nay Sói không cắn ai, không có mục tiêu để nguyền."}
        </p>
        <button
          onClick={() =>
            executeAction(
              "Sói Nguyền bỏ qua lượt.",
              {},
              {
                name: "night-action",
                payload: { role: "cursed_wolf", target: null, playerName },
              },
            )
          }
          className="w-full cursor-pointer rounded-lg bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800"
        >
          Xác nhận
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Sói đã chọn cắn:{" "}
        <span className="font-bold text-red-600">{wolfVictim}</span>. Bạn có
        muốn sử dụng quyền năng lây nhiễm (chỉ 1 lần/trận) để biến người này
        thành Sói không?
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={() =>
            executeAction(
              `Sói Nguyền đã chọn nguyền ${wolfVictim}`,
              {
                cursedWolfUsed: true,
                infectedPlayer: wolfVictim,
                wolfVictim: null,
              },
              {
                name: "night-action",
                payload: {
                  role: "cursed_wolf",
                  target: wolfVictim,
                  playerName,
                },
              },
            )
          }
          className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          Có (Nguyền)
        </button>
        <button
          onClick={() =>
            executeAction(
              `Sói Nguyền không dùng kỹ năng`,
              { infectedPlayer: null },
              {
                name: "night-action",
                payload: { role: "cursed_wolf", target: null, playerName },
              },
            )
          }
          className="w-full cursor-pointer rounded-lg bg-slate-600 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          Không
        </button>
      </div>
    </div>
  );
};

const SeerNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { players, nightSelection, actionConfirmed, seerResult, playerRoles } =
    gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-indigo-400">
          <FaEye className="mr-1 inline text-indigo-400" />
          Bạn đã soi:
          <span className="ml-1 font-bold">{seerResult?.name}</span>
        </p>
        <p className="mt-2 text-base font-bold text-indigo-300">
          Kết quả: {seerResult?.isWolf ? "LÀ SÓI 🐺" : "KHÔNG PHẢI SÓI 👨‍🌾"}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người để soi xem họ có phải là Sói hay không:
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {players
          .filter((p) => p !== playerName)
          .map((p) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: "UPDATE", payload: { nightSelection: p } })
              }
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                nightSelection === p
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
              }`}
            >
              {p}
            </button>
          ))}
      </div>
      <button
        onClick={() => {
          const isWolf =
            playerRoles[nightSelection as string]?.id === "werewolf";
          executeAction(
            `Bạn đã soi ${nightSelection} ${isWolf ? "LÀ SÓI" : "KHÔNG PHẢI là sói"}`,
            { seerResult: { name: nightSelection as string, isWolf } },
            {
              name: "night-action",
              payload: { role: "seer", target: nightSelection, playerName },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        Xác nhận soi
      </button>
    </div>
  );
};

const WitchNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const {
    alivePlayers,
    wolfVictim,
    witchPotions,
    witchAction,
    actionConfirmed,
  } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-purple-700">
          <GiWitchFlight className="mr-1 inline text-purple-700" />
          Bạn đã hoàn tất hành động đêm nay!
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <div className="w-full rounded-lg bg-indigo-900/40 p-3 text-center">
        <p className="text-sm font-medium text-indigo-300">
          Đêm nay, Sói đã cắn:{" "}
          <span className="font-bold text-red-600">
            {wolfVictim === "none" || !wolfVictim ? "Không ai" : wolfVictim}
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="rounded-lg border border-green-900/50 bg-green-900/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-green-400">
              🧪 Bình Máu (còn {witchPotions.heal})
            </span>
            <button
              onClick={() =>
                dispatch({
                  type: "UPDATE_FUNCTION",
                  payload: (prev) => ({
                    witchAction: {
                      ...prev.witchAction,
                      heal: !prev.witchAction.heal,
                    },
                  }),
                })
              }
              disabled={
                witchPotions.heal <= 0 || !wolfVictim || wolfVictim === "none"
              }
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                witchAction.heal
                  ? "border border-green-600 bg-green-600 text-white"
                  : "border border-green-800 bg-slate-700 text-green-300 hover:bg-green-900/50"
              }`}
            >
              {witchAction.heal ? "Đang sử dụng" : "Sử dụng"}
            </button>
          </div>
          <p className="text-xs text-green-500">
            Dùng để cứu người bị Sói cắn.
          </p>
        </div>
        <div className="rounded-lg border border-purple-900/50 bg-purple-900/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-purple-400">
              ☠️ Bình Độc (còn {witchPotions.poison})
            </span>
            {witchAction.poison && (
              <button
                onClick={() =>
                  dispatch({
                    type: "UPDATE_FUNCTION",
                    payload: (prev) => ({
                      witchAction: { ...prev.witchAction, poison: null },
                    }),
                  })
                }
                className="cursor-pointer rounded-md border border-purple-800 bg-slate-700 px-3 py-1 text-xs font-bold text-purple-300 hover:bg-purple-900/50"
              >
                Hủy dùng
              </button>
            )}
          </div>
          <p className="mb-2 text-xs text-purple-500">
            Dùng để giết 1 người bất kỳ.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {alivePlayers
              .filter((p) => p !== playerName)
              .map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_FUNCTION",
                      payload: (prev) => ({
                        witchAction: { ...prev.witchAction, poison: p },
                      }),
                    })
                  }
                  disabled={witchPotions.poison <= 0}
                  className={`cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    witchAction.poison === p
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-purple-800 bg-slate-700 text-purple-300 hover:bg-purple-900/50"
                  }`}
                >
                  {p}
                </button>
              ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          let content = "";
          if (witchAction.heal)
            content += `Bạn đã dùng bình cứu lên ${wolfVictim === "none" ? "Không ai" : wolfVictim}. `;
          if (witchAction.poison)
            content += `Bạn đã ném bình độc vào ${witchAction.poison}.`;
          if (!witchAction.heal && !witchAction.poison)
            content += "Bạn đã không dùng bình nào.";
          executeAction(
            content.trim(),
            {},
            {
              name: "witch-action",
              payload: { action: witchAction, playerName },
            },
          );
        }}
        className="w-full cursor-pointer rounded-lg bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800"
      >
        Xác nhận hành động
      </button>
    </div>
  );
};

const HunterNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const {
    alivePlayers,
    dayCount,
    hunterTarget,
    nightSelection,
    actionConfirmed,
  } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-orange-700">
          <GiMusket className="mr-1 inline text-orange-700" />
          Bạn đã ghim:
          <span className="ml-1 font-bold">
            {hunterTarget || "Không có ai"}
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người để ghim. Nếu đêm nay bạn chết, người này sẽ chết theo.
      </p>
      {dayCount > 1 && (
        <p className="text-sm font-bold text-orange-700">
          Mục tiêu đang ghim: {hunterTarget || "Chưa có"}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers
          .filter((p) => p !== playerName)
          .map((p) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: "UPDATE", payload: { nightSelection: p } })
              }
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                nightSelection === p
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-orange-900/50 bg-slate-700 text-orange-300 hover:bg-orange-900/50"
              }`}
            >
              {p}
            </button>
          ))}
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => {
            executeAction(
              `Bạn đã ghim mục tiêu ${nightSelection || "Không có ai"}`,
              { hunterTarget: nightSelection as string | null },
              {
                name: "night-action",
                payload: { role: "hunter", target: nightSelection, playerName },
              },
            );
          }}
          disabled={!nightSelection}
          className="w-full cursor-pointer rounded-lg bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"
        >
          Xác nhận ghim mới
        </button>
        {dayCount > 1 && (
          <button
            onClick={() => {
              executeAction(
                `Bạn đã giữ nguyên mục tiêu ${hunterTarget || "Không có ai"}`,
                {},
                {
                  name: "night-action",
                  payload: { role: "hunter", target: hunterTarget, playerName },
                },
              );
            }}
            className="w-full cursor-pointer rounded-lg bg-slate-600 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Bỏ qua
          </button>
        )}
      </div>
    </div>
  );
};

const HeadhunterNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const {
    alivePlayers,
    dayCount,
    headhunterTarget,
    nightSelection,
    actionConfirmed,
  } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-cyan-700">
          <GiBullseye className="mr-1 inline text-cyan-700" />
          Bạn đã chốt mục tiêu săn thưởng:
          <span className="ml-1 font-bold">
            {headhunterTarget || nightSelection}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người làm mục tiêu. Nếu người này bị làng biểu quyết treo cổ, bạn
        sẽ giành chiến thắng!
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers
          .filter((p) => p !== playerName)
          .map((p) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: "UPDATE", payload: { nightSelection: p } })
              }
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                nightSelection === p
                  ? "border-cyan-600 bg-cyan-600 text-white"
                  : "border-cyan-800 bg-slate-700 text-cyan-300 hover:bg-cyan-900/50"
              }`}
            >
              {p}
            </button>
          ))}
      </div>
      <button
        onClick={() => {
          executeAction(
            `Bạn đã chọn mục tiêu săn thưởng là ${nightSelection}`,
            { headhunterTarget: nightSelection as string },
            {
              name: "night-action",
              payload: {
                role: "headhunter",
                target: nightSelection,
                playerName,
              },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50"
      >
        Xác nhận mục tiêu
      </button>
    </div>
  );
};

const AssassinNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { alivePlayers, nightSelection, actionConfirmed } = gameState;
  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-red-900">
          <GiBowieKnife className="mr-1 inline text-red-900" />
          Bạn đã quyết định ám sát:
          <span className="ml-1 font-bold">
            {nightSelection === "none" ? "Không ai" : nightSelection}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 1 người để ám sát trong đêm nay:
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers
          .filter((p) => p !== playerName)
          .map((p) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: "UPDATE", payload: { nightSelection: p } })
              }
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                nightSelection === p
                  ? "border-red-900 bg-red-900 text-white"
                  : "border-red-900/50 bg-slate-700 text-red-300 hover:bg-red-900/50"
              }`}
            >
              {p}
            </button>
          ))}
        <button
          onClick={() =>
            dispatch({ type: "UPDATE", payload: { nightSelection: "none" } })
          }
          className={`col-span-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            nightSelection === "none"
              ? "border-slate-500 bg-slate-600 text-white"
              : "border-red-900/50 bg-slate-700 text-red-300 hover:bg-red-900/50"
          }`}
        >
          Không giết ai
        </button>
      </div>
      <button
        onClick={() => {
          executeAction(
            nightSelection === "none"
              ? "Bạn đã quyết định không ám sát ai"
              : `Bạn đã ám sát ${nightSelection}`,
            {
              assassinTarget:
                nightSelection === "none" ? null : (nightSelection as string),
            },
            {
              name: "night-action",
              payload: {
                role: "assassin",
                target: nightSelection === "none" ? null : nightSelection,
                playerName,
              },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-red-900 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
      >
        Xác nhận ám sát
      </button>
    </div>
  );
};

const ROLE_STRATEGIES: Record<string, React.FC<RoleUIProps>> = {
  headhunter: HeadhunterNightUI,
  bodyguard: BodyguardNightUI,
  werewolf: WerewolfNightUI,
  cursed_wolf: CursedWolfNightUI,
  fog_wolf: WerewolfNightUI,
  seer: SeerNightUI,
  witch: WitchNightUI,
  hunter: HunterNightUI,
  assassin: AssassinNightUI,
};

function WerewolfGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = searchParams.get("room");

  const [roomId, setRoomId] = useState<string | null>(roomParam);
  const [playerName, setPlayerName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");

  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
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
    dayVotes,
    accusedPlayer,
    executionVotes,
    dayCount,
    alivePlayers,
    lastProtected,
    witchPotions,
    wolfVotes,
    wolfVictim,
    hunterTarget,
    witchAction,
    nightSelection,
    actionConfirmed,
    seerResult,
    actionLogs,
    nightPhase,
    nightTimeLeft,
    confirmedPlayers,
    wolfChat,
    winner,
    extraLives,
    cursedWolfUsed,
    infectedPlayer,
    fogWolfUsed,
    headhunterTarget,
    assassinTarget,
  } = gameState;

  const isNight = phase === "night" && gameStarted;

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [activeLogTab, setActiveLogTab] = useState<"night" | "day">("night");
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

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

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
              hostName: state.hostName,
              players: newPlayers,
              spectators: newSpecs,
              gameStarted: state.gameStarted,
              roleConfig: state.roleConfig,
              playerRoles: state.playerRoles,
              phase: state.phase,
              dayPhase: state.dayPhase,
              dayTimeLeft: state.dayTimeLeft,
              dayVotes: state.dayVotes,
              accusedPlayer: state.accusedPlayer,
              executionVotes: state.executionVotes,
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
              winner: state.winner,
              extraLives: state.extraLives,
              cursedWolfUsed: state.cursedWolfUsed,
              infectedPlayer: state.infectedPlayer,
              fogWolfUsed: state.fogWolfUsed,
              headhunterTarget: state.headhunterTarget,
              assassinTarget: state.assassinTarget,
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
        if (data.gameStarted !== undefined)
          updates.gameStarted = data.gameStarted;
        if (data.roleConfig) updates.roleConfig = data.roleConfig;
        if (data.playerRoles) updates.playerRoles = data.playerRoles;
        if (data.phase) updates.phase = data.phase;
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined)
          updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined)
          updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined)
          updates.executionVotes = data.executionVotes;
        if (data.dayCount !== undefined) updates.dayCount = data.dayCount;
        if (data.alivePlayers) updates.alivePlayers = data.alivePlayers;
        if (data.lastProtected !== undefined)
          updates.lastProtected = data.lastProtected;
        if (data.witchPotions) updates.witchPotions = data.witchPotions;
        if (data.wolfVotes) updates.wolfVotes = data.wolfVotes;
        if (data.wolfVictim !== undefined) updates.wolfVictim = data.wolfVictim;
        if (data.hunterTarget !== undefined)
          updates.hunterTarget = data.hunterTarget;
        if (data.witchAction) updates.witchAction = data.witchAction;
        if (data.deadThisNight) updates.deadThisNight = data.deadThisNight;
        if (data.nightPhase !== undefined) updates.nightPhase = data.nightPhase;
        if (data.nightTimeLeft !== undefined)
          updates.nightTimeLeft = data.nightTimeLeft;
        if (data.confirmedPlayers)
          updates.confirmedPlayers = data.confirmedPlayers;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        if (data.wolfChat) updates.wolfChat = data.wolfChat;
        if (data.winner !== undefined) updates.winner = data.winner;
        if (data.extraLives) updates.extraLives = data.extraLives;
        if (data.cursedWolfUsed !== undefined)
          updates.cursedWolfUsed = data.cursedWolfUsed;
        if (data.infectedPlayer !== undefined)
          updates.infectedPlayer = data.infectedPlayer;
        if (data.fogWolfUsed !== undefined)
          updates.fogWolfUsed = data.fogWolfUsed;
        if (data.headhunterTarget !== undefined)
          updates.headhunterTarget = data.headhunterTarget;
        if (data.assassinTarget !== undefined)
          updates.assassinTarget = data.assassinTarget;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "game-start" }, (payload) => {
        const data = payload.payload;
        dispatch({
          type: "UPDATE",
          payload: {
            gameStarted: true,
            playerRoles: data.playerRoles || {},
            phase: data.phase || "role_reveal",
            dayPhase: null,
            dayTimeLeft: 0,
            dayVotes: {},
            accusedPlayer: null,
            executionVotes: {},
            dayCount: data.dayCount !== undefined ? data.dayCount : 0,
            alivePlayers: data.alivePlayers || [],
            lastProtected:
              data.lastProtected !== undefined ? data.lastProtected : null,
            witchPotions: data.witchPotions || { heal: 1, poison: 1 },
            wolfVotes: data.wolfVotes || {},
            wolfVictim: data.wolfVictim !== undefined ? data.wolfVictim : null,
            hunterTarget:
              data.hunterTarget !== undefined ? data.hunterTarget : null,
            witchAction: data.witchAction || { heal: false, poison: null },
            deadThisNight: data.deadThisNight || [],
            nightSelection: null,
            actionConfirmed: false,
            seerResult: null,
            nightPhase: null,
            nightTimeLeft: 0,
            confirmedPlayers: [],
            actionLogs: [],
            wolfChat: [],
            winner: null,
            extraLives: data.extraLives || {},
            cursedWolfUsed: false,
            infectedPlayer: null,
            fogWolfUsed: false,
            headhunterTarget:
              data.headhunterTarget !== undefined
                ? data.headhunterTarget
                : null,
            assassinTarget:
              data.assassinTarget !== undefined ? data.assassinTarget : null,
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
            spectators: prev.spectators.map((s) =>
              s === oldName ? newName : s,
            ),
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
          wolfVictim: null,
          witchAction: { heal: false, poison: null },
          assassinTarget: null,
        };
        if (data.phase) updates.phase = data.phase;
        if (data.dayCount !== undefined) updates.dayCount = data.dayCount;
        if (data.alivePlayers) updates.alivePlayers = data.alivePlayers;
        if (data.witchPotions) updates.witchPotions = data.witchPotions;
        if (data.deadThisNight) updates.deadThisNight = data.deadThisNight;
        if (data.nightPhase !== undefined) updates.nightPhase = data.nightPhase;
        if (data.nightTimeLeft !== undefined)
          updates.nightTimeLeft = data.nightTimeLeft;
        if (data.confirmedPlayers)
          updates.confirmedPlayers = data.confirmedPlayers;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        if (data.extraLives) updates.extraLives = data.extraLives;
        if (data.winner !== undefined) updates.winner = data.winner;
        if (data.playerRoles) updates.playerRoles = data.playerRoles;
        if (data.infectedPlayer !== undefined)
          updates.infectedPlayer = data.infectedPlayer;
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined)
          updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined)
          updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined)
          updates.executionVotes = data.executionVotes;
        if (data.fogWolfUsed !== undefined)
          updates.fogWolfUsed = data.fogWolfUsed;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "day-phase-change" }, (payload) => {
        const data = payload.payload;
        const updates: Partial<GameState> = {};
        if (data.dayPhase !== undefined) updates.dayPhase = data.dayPhase;
        if (data.dayTimeLeft !== undefined)
          updates.dayTimeLeft = data.dayTimeLeft;
        if (data.dayVotes !== undefined) updates.dayVotes = data.dayVotes;
        if (data.accusedPlayer !== undefined)
          updates.accusedPlayer = data.accusedPlayer;
        if (data.executionVotes !== undefined)
          updates.executionVotes = data.executionVotes;
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
        if (data.dayTimeLeft !== undefined)
          updates.dayTimeLeft = data.dayTimeLeft;
        if (data.actionLogs) updates.actionLogs = data.actionLogs;
        dispatch({ type: "UPDATE", payload: updates });
      })
      .on("broadcast", { event: "night-phase-change" }, (payload) => {
        dispatch({
          type: "UPDATE",
          payload: {
            nightPhase: payload.payload.nightPhase,
            nightTimeLeft: payload.payload.nightTimeLeft,
            confirmedPlayers: payload.payload.confirmedPlayers,
            nightSelection: null,
            actionConfirmed: false,
            seerResult: null,
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
            confirmedPlayers: [
              ...new Set([
                ...prev.confirmedPlayers,
                payload.payload.playerName,
              ]),
            ],
          }),
        });
      })
      .on("broadcast", { event: "wolf-vote" }, (payload) => {
        const { playerName: wName, target } = payload.payload;
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            wolfVotes: { ...prev.wolfVotes, [wName]: target },
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
            infectedPlayer:
              role === "cursed_wolf" && target ? target : prev.infectedPlayer,
            wolfVictim:
              role === "cursed_wolf" && target ? null : prev.wolfVictim,
            headhunterTarget:
              role === "headhunter" ? target : prev.headhunterTarget,
            assassinTarget: role === "assassin" ? target : prev.assassinTarget,
          }),
        });
      })
      .on("broadcast", { event: "wolf-chat" }, (payload) => {
        dispatch({
          type: "UPDATE_FUNCTION",
          payload: (prev) => ({
            wolfChat: [payload.payload.message, ...prev.wolfChat],
          }),
        });
      })
      .on("broadcast", { event: "use-fog" }, (payload) => {
        const state = stateRef.current;
        dispatch({
          type: "UPDATE",
          payload: { fogWolfUsed: true },
        });

        if (
          state.hostName === playerName &&
          payload.payload.playerName !== state.hostName
        ) {
          const sysLog: ActionLog = {
            id: Math.random().toString(36).substring(2, 9),
            dayCount: state.dayCount,
            roleId: "system",
            playerName: "system",
            content: `🌫️ Sương mù dày đặc bao phủ ngôi làng! Sói Sương Mù đã kích hoạt kỹ năng. Mọi cuộc biểu quyết bị hủy bỏ, màn đêm lập tức buông xuống!`,
          };
          const newLogs = [...state.actionLogs, sysLog];

          const nextDay = state.dayCount + 1;
          const firstNightPhase = getNextNightPhase(
            null,
            state.playerRoles,
            nextDay,
          );

          if (firstNightPhase) {
            const timeLimit =
              firstNightPhase === "hunter" && nextDay > 1 ? 15 : 120;

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
              wolfVictim: null,
              witchAction: { heal: false, poison: null },
              actionLogs: newLogs,
              dayPhase: null,
              dayTimeLeft: 0,
              dayVotes: {},
              accusedPlayer: null,
              executionVotes: {},
              fogWolfUsed: true,
              assassinTarget: null,
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

  const executeDayExecution = useCallback(
    (executedPlayer: string) => {
      const state = stateRef.current;
      const newExtraLives = { ...state.extraLives };
      const actualDeaths = new Set<string>();

      if (newExtraLives[executedPlayer] > 0) {
        newExtraLives[executedPlayer] -= 1;
      } else {
        actualDeaths.add(executedPlayer);

        if (
          state.playerRoles[executedPlayer]?.id === "hunter" &&
          state.hunterTarget
        ) {
          const hTarget = state.hunterTarget;
          if (newExtraLives[hTarget] > 0) {
            newExtraLives[hTarget] -= 1;
          } else {
            actualDeaths.add(hTarget);
          }
        }
      }

      const newAlive = state.alivePlayers.filter((p) => !actualDeaths.has(p));
      let newWinner = checkWinCondition(newAlive, state.playerRoles);

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
        content = `Làng đã quyết định treo cổ ${executedPlayer}. ${finalDeadArray.length > 1 ? `Ngoài ra ${finalDeadArray.filter((p) => p !== executedPlayer).join(", ")} cũng bị ghim và chết theo.` : ""}`;
      } else {
        content = `Làng đã biểu quyết treo cổ ${executedPlayer}, nhưng với quyền năng của Trưởng Làng, người này vẫn còn sống!`;
      }

      const sysLog: ActionLog = {
        id: Math.random().toString(36).substring(2, 9),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content,
      };

      const newLogs = [...state.actionLogs, sysLog];

      if (newWinner) {
        const endLog: ActionLog = {
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content:
            newWinner === "assassin"
              ? "Trò chơi kết thúc! Sát Thủ đã tiêu diệt hầu hết làng và giành chiến thắng."
              : newWinner === "headhunter"
                ? "Trò chơi kết thúc! Làng đã treo cổ mục tiêu của Thợ Săn Người. Thợ Săn Người giành chiến thắng!"
                : newWinner === "fool"
                  ? "Trò chơi kết thúc! Kẻ Ngốc đã đánh lừa được cả làng và bị treo cổ. Kẻ Ngốc giành chiến thắng!"
                  : newWinner === "wolves"
                    ? "Trò chơi kết thúc! Phe Sói đã chiến thắng."
                    : "Trò chơi kết thúc! Phe Dân làng đã chiến thắng.",
        };
        newLogs.push(endLog);
      }

      dispatch({
        type: "UPDATE",
        payload: {
          alivePlayers: newAlive,
          extraLives: newExtraLives,
          dayPhase: null,
          dayTimeLeft: 0,
          actionLogs: newLogs,
          ...(newWinner && { phase: "game_over", winner: newWinner }),
        },
      });

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
            dayTimeLeft: 0,
            actionLogs: newLogs,
          },
        });
      }
    },
    [channel],
  );

  const advanceDayPhase = useCallback(() => {
    const state = stateRef.current;
    if (state.dayPhase === "discussion") {
      dispatch({
        type: "UPDATE",
        payload: { dayPhase: "voting", dayTimeLeft: 60 },
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "day-phase-change",
          payload: {
            dayPhase: "voting",
            dayTimeLeft: 60,
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
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content: `${accused} có nhiều phiếu nhất (${maxVotes} phiếu) và đang bị đưa lên giàn treo cổ để biện hộ.`,
        };
        const newLogs = [...state.actionLogs, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: "defense",
            dayTimeLeft: 180,
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
              dayTimeLeft: 180,
              accusedPlayer: accused,
              actionLogs: newLogs,
            },
          });
        }
      } else {
        const sysLog: ActionLog = {
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content:
            tie && maxVotes > 0
              ? `Bầu cử hòa (${maxVotes} phiếu). Làng quyết định không treo cổ ai hôm nay.`
              : `Làng quyết định không treo cổ ai hôm nay.`,
        };
        const newLogs = [...state.actionLogs, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: null,
            dayTimeLeft: 0,
            actionLogs: newLogs,
          },
        });

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "day-phase-change",
            payload: {
              dayPhase: null,
              dayTimeLeft: 0,
              accusedPlayer: null,
              actionLogs: newLogs,
            },
          });
        }
      }
    } else if (state.dayPhase === "defense") {
      dispatch({
        type: "UPDATE",
        payload: { dayPhase: "execution", dayTimeLeft: 60 },
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "day-phase-change",
          payload: { dayPhase: "execution", dayTimeLeft: 60 },
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
        const sysLog: ActionLog = {
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "system",
          playerName: "system",
          content: `${state.accusedPlayer} đã được tha bổng với ${saveVotes} phiếu cứu / ${killVotes} phiếu treo cổ.`,
        };
        const newLogs = [...state.actionLogs, sysLog];

        dispatch({
          type: "UPDATE",
          payload: {
            dayPhase: null,
            dayTimeLeft: 0,
            actionLogs: newLogs,
          },
        });

        if (channel) {
          channel.send({
            type: "broadcast",
            event: "day-phase-change",
            payload: { dayPhase: null, dayTimeLeft: 0, actionLogs: newLogs },
          });
        }
      }
    }
  }, [channel, executeDayExecution]);

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

    if (state.assassinTarget) {
      if (state.lastProtected !== state.assassinTarget) {
        deaths.add(state.assassinTarget);
      }
    }

    const newPlayerRoles = { ...state.playerRoles };
    const newLogs = [...state.actionLogs];

    if (state.infectedPlayer) {
      if (state.infectedPlayer === state.lastProtected) {
        newLogs.push({
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "werewolf",
          playerName: "system",
          content: `Sói Nguyền lây nhiễm thất bại do ${state.infectedPlayer} đã được Bảo vệ.`,
        });
      } else {
        newPlayerRoles[state.infectedPlayer] = {
          id: "werewolf",
          name: "Sói",
          count: 1,
        };
        newLogs.push({
          id: Math.random().toString(36).substring(2, 9),
          dayCount: state.dayCount,
          roleId: "werewolf",
          playerName: "system",
          content: `Sói Nguyền lây nhiễm thành công! ${state.infectedPlayer} đã trở thành Sói.`,
        });
      }
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

    // Process hunter targets
    const actualDeadArray = Array.from(actualDeaths);
    for (const dead of actualDeadArray) {
      if (state.playerRoles[dead]?.id === "hunter" && state.hunterTarget) {
        const hTarget = state.hunterTarget;
        if (newExtraLives[hTarget] > 0) {
          newExtraLives[hTarget] -= 1;
        } else {
          actualDeaths.add(hTarget);
        }
      }
    }

    const newAlive = state.alivePlayers.filter((p) => !actualDeaths.has(p));

    const newWinner = checkWinCondition(newAlive, newPlayerRoles);
    const newPhase = newWinner ? "game_over" : "day";

    const newPotions = { ...state.witchPotions };
    if (state.witchAction.heal) newPotions.heal -= 1;
    if (state.witchAction.poison) newPotions.poison -= 1;

    const finalDeadArray = Array.from(actualDeaths);
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
    newLogs.push(sysLog);

    if (newWinner) {
      const endLog: ActionLog = {
        id: Math.random().toString(36).substring(2, 9),
        dayCount: state.dayCount,
        roleId: "system",
        playerName: "system",
        content:
          newWinner === "assassin"
            ? "Trò chơi kết thúc! Sát Thủ đã tiêu diệt hầu hết làng và giành chiến thắng."
            : newWinner === "wolves"
              ? "Trò chơi kết thúc! Phe Sói đã chiến thắng."
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
        wolfVictim: null,
        witchAction: { heal: false, poison: null },
        dayVotes: {},
        accusedPlayer: null,
        executionVotes: {},
        infectedPlayer: null,
        assassinTarget: null,
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
          assassinTarget: null,
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
      dispatch({
        type: "UPDATE",
        payload: {
          nightPhase: nextNightPhase,
          nightTimeLeft: timeLimit,
          confirmedPlayers: [],
          nightSelection: null,
          actionConfirmed: false,
          seerResult: null,
        },
      });

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
    if (phase === "day" && gameStarted && dayPhase) {
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
        advanceDayPhase();
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
              ["werewolf", "cursed_wolf", "fog_wolf"].includes(
                playerRoles[p]?.id || "",
              ),
            )
          : alivePlayers.filter((p) => playerRoles[p]?.id === nightPhase);

      if (activePlayersOfRole.length === 0) {
        // Nếu role đã chết (hoặc không ai sống), random delay 10-30s để fake hành động
        const currentLimit = nightPhase === "hunter" && dayCount > 1 ? 15 : 120;
        const maxDelay = Math.min(30, currentLimit - 1);
        const minDelay = Math.min(10, maxDelay);
        const randomDelay =
          Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

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
        (p) =>
          playerRoles[p]?.id === "werewolf" ||
          playerRoles[p]?.id === "cursed_wolf" ||
          playerRoles[p]?.id === "fog_wolf",
      );
      if (aliveWolves.length === 0) {
        if (wolfVictim !== "none") {
          dispatch({ type: "UPDATE", payload: { wolfVictim: "none" } });
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
            dispatch({ type: "UPDATE", payload: { wolfVictim: firstVote } });
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "room-sync",
                payload: { ...stateRef.current, wolfVictim: firstVote },
              });
            }
          } else if (!sameTarget && wolfVictim !== null) {
            dispatch({ type: "UPDATE", payload: { wolfVictim: null } });
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
      const newExtraLives: Record<string, number> = {};
      players.forEach((player, idx) => {
        const role = rolePool[idx];
        newPlayerRoles[player] = role;
        if (role.id === "mayor") {
          newExtraLives[player] = 1;
        }
      });

      dispatch({
        type: "UPDATE",
        payload: {
          playerRoles: newPlayerRoles,
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
          wolfVictim: null,
          hunterTarget: null,
          witchAction: { heal: false, poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: [],
          wolfChat: [],
          winner: null,
          extraLives: newExtraLives,
          cursedWolfUsed: false,
          infectedPlayer: null,
          fogWolfUsed: false,
          headhunterTarget: null,
          assassinTarget: null,
        },
      });

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
          headhunterTarget: null,
          assassinTarget: null,
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
          wolfVictim: null,
          hunterTarget: null,
          witchAction: { heal: false, poison: null },
          deadThisNight: [],
          nightPhase: null,
          nightTimeLeft: 0,
          confirmedPlayers: [],
          actionLogs: [],
          wolfChat: [],
          winner: null,
          extraLives: {},
          cursedWolfUsed: false,
          infectedPlayer: null,
          fogWolfUsed: false,
          headhunterTarget: null,
          assassinTarget: null,
        },
      });

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
              wolfVictim: null,
              witchAction: { heal: false, poison: null },
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
            },
          });
        } else {
          executeNightResolution();
        }
      }
    }
  };

  const executeAction = useCallback(
    (
      logContent: string | null,
      stateUpdates: Partial<GameState>,
      broadcastEvent?: { name: string; payload: any },
    ) => {
      let newLog: ActionLog | null = null;
      if (logContent) {
        newLog = {
          id: Math.random().toString(36).substring(2, 9),
          dayCount: stateRef.current.dayCount,
          roleId: stateRef.current.playerRoles[playerName]?.id || "system",
          playerName,
          content: logContent,
        };
      }

      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev) => ({
          actionConfirmed: true,
          confirmedPlayers: [
            ...new Set([...prev.confirmedPlayers, playerName]),
          ],
          ...stateUpdates,
          ...(newLog ? { actionLogs: [...prev.actionLogs, newLog] } : {}),
        }),
      });

      if (channel) {
        if (newLog)
          channel.send({
            type: "broadcast",
            event: "add-log",
            payload: { log: newLog },
          });
        if (broadcastEvent)
          channel.send({
            type: "broadcast",
            event: broadcastEvent.name,
            payload: broadcastEvent.payload,
          });
        channel.send({
          type: "broadcast",
          event: "player-confirm",
          payload: { playerName },
        });
      }
    },
    [channel, playerName],
  );

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

  useEffect(() => {
    if (phase === "night") setActiveLogTab("night");
    if (phase === "day" || phase === "role_reveal" || phase === "game_over")
      setActiveLogTab("day");
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
                <label
                  className={`mb-2 block text-xs font-medium ${isNight ? "text-slate-400" : "text-zinc-700"}`}
                >
                  Mời bạn bè tham gia:
                </label>
                <div
                  className={`flex w-full items-center space-x-2 rounded-lg border px-3 py-2 shadow-sm ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
                >
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
              <div
                className={`flex flex-col items-center rounded-xl border p-6 shadow-sm md:items-start ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
              >
                {phase === "night" && gameStarted ? (
                  <>
                    <h3 className="mb-2 flex items-center text-sm font-semibold text-indigo-300">
                      <FaMoon className="mr-2 text-indigo-700" /> Đêm {dayCount}
                    </h3>
                    <div className="flex flex-col items-center justify-center w-full py-4 bg-indigo-900/30 rounded-lg border border-indigo-900/50 mb-4">
                      <span className="text-4xl font-mono text-indigo-200 mb-2">
                        {Math.floor(nightTimeLeft / 60)}:
                        {(nightTimeLeft % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-indigo-300 uppercase tracking-wider">
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
                    <h3
                      className={`mb-2 text-sm font-semibold ${isNight ? "text-slate-200" : "text-zinc-800"}`}
                    >
                      {gameStarted
                        ? `Trạng thái: ${phase === "role_reveal" ? "Phát vai trò" : phase === "game_over" ? "Kết thúc" : `Ngày ${dayCount}`}`
                        : "Trạng thái phòng"}
                    </h3>
                    <p
                      className={`mb-4 text-sm ${isNight ? "text-slate-400" : "text-zinc-500"}`}
                    >
                      {gameStarted
                        ? `${alivePlayers.length} người còn sống.`
                        : `${players.length} người chơi đã sẵn sàng trong sảnh.`}
                    </p>

                    {phase === "game_over" && (
                      <div
                        className={`w-full mb-4 flex flex-col items-center justify-center py-4 rounded-xl border ${winner === "wolves" ? "bg-red-50 border-red-200 text-red-700" : winner === "fool" ? "bg-pink-50 border-pink-200 text-pink-700" : winner === "headhunter" ? "bg-cyan-50 border-cyan-200 text-cyan-700" : winner === "assassin" ? "bg-red-950 border-red-900 text-red-900" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
                      >
                        <h3 className="text-lg font-bold mb-1">
                          Trò chơi kết thúc!
                        </h3>
                        <span className="font-bold uppercase tracking-wider">
                          {winner === "wolves"
                            ? "Phe Sói thắng!"
                            : winner === "fool"
                              ? "Kẻ Ngốc thắng!"
                              : winner === "headhunter"
                                ? "Thợ Săn Người thắng!"
                                : winner === "assassin"
                                  ? "Sát Thủ thắng!"
                                  : "Phe Dân Làng thắng!"}
                        </span>
                      </div>
                    )}

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
                          {phase === "role_reveal" ||
                          (phase === "day" && !dayPhase) ? (
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
                      <div
                        className={`w-full rounded-lg p-3 text-center text-sm font-medium ${isNight ? "bg-slate-700/50 text-slate-300" : "bg-zinc-100 text-zinc-600"}`}
                      >
                        {gameStarted
                          ? "Trò chơi đang diễn ra..."
                          : "Đang chờ chủ phòng bắt đầu..."}
                      </div>
                    )}
                  </>
                )}
              </div>

              <RoleConfigPanel
                roleConfig={roleConfig}
                playersCount={players.length}
                hostName={hostName}
                playerName={playerName}
                gameStarted={gameStarted}
                updateRoleCount={updateRoleCount}
                isNight={isNight}
              />

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
          <PlayerGrid
            players={players}
            spectators={spectators}
            alivePlayers={alivePlayers}
            playerRoles={playerRoles}
            playerName={playerName}
            hostName={hostName}
            gameStarted={gameStarted}
            phase={phase}
            headhunterTarget={headhunterTarget}
            isNight={isNight}
          />

          {/* Spectators */}
          {spectators.length > 0 && (
            <div
              className={`w-full rounded-xl border p-6 shadow-sm ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
            >
              <h3
                className={`mb-4 border-b pb-3 text-base font-medium ${isNight ? "border-slate-700 text-slate-200" : "border-zinc-100 text-zinc-900"}`}
              >
                Người xem ({spectators.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {spectators.map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-2 rounded-full border px-3 py-1.5 ${isNight ? "border-slate-600 bg-slate-700" : "border-zinc-100 bg-zinc-50"}`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isNight ? "bg-slate-600 text-slate-300" : "bg-zinc-200 text-zinc-700"}`}
                    >
                      {spec.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`text-xs font-medium ${isNight ? "text-slate-200" : "text-zinc-800"}`}
                    >
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
              <div
                className={`flex w-full flex-col items-center rounded-xl border p-6 shadow-sm md:items-start ${isNight ? "border-slate-700 bg-slate-800/80" : "border-zinc-200 bg-zinc-100"}`}
              >
                <h3
                  className={`mb-2 flex items-center text-sm font-bold ${isNight ? "text-slate-300" : "text-zinc-600"}`}
                >
                  <FaGhost className="mr-2 text-zinc-500" />
                  Trạng thái: Đã chết
                </h3>

                <p
                  className={`text-sm ${isNight ? "text-slate-400" : "text-zinc-500"}`}
                >
                  Bạn không còn khả năng tham gia vào các hoạt động của làng
                  nữa. Hãy giữ im lặng để không ảnh hưởng đến người chơi khác.
                </p>
              </div>
            )}

            {/* Night Action Area */}
            {phase === "night" && alivePlayers.includes(playerName) && (
              <div className="flex flex-col items-center rounded-xl border border-indigo-900/50 bg-slate-800/80 p-6 shadow-sm md:items-start">
                <h3 className="mb-4 flex items-center text-sm font-bold text-indigo-300">
                  Chức năng: {playerRoles[playerName]?.name}
                  <RoleIcon
                    id={playerRoles[playerName]?.id}
                    className="ml-2 text-lg"
                  />
                </h3>

                {playerRoles[playerName]?.id === "villager" ||
                playerRoles[playerName]?.id === "mayor" ||
                playerRoles[playerName]?.id === "fool" ? (
                  <p className="w-full py-4 text-center text-sm text-indigo-300">
                    Nhân vật của bạn không có chức năng trong đêm. Hãy nhắm mắt
                    lại!
                  </p>
                ) : nightPhase === "werewolf" &&
                  ["werewolf", "cursed_wolf", "fog_wolf"].includes(
                    playerRoles[playerName]?.id as string,
                  ) ? (
                  <WerewolfNightUI
                    gameState={gameState}
                    dispatch={dispatch}
                    channel={channel}
                    playerName={playerName}
                    executeAction={executeAction}
                  />
                ) : nightPhase !== playerRoles[playerName]?.id ? (
                  <p className="w-full animate-pulse py-4 text-center text-sm font-medium text-indigo-300">
                    Hãy nhắm mắt lại. Đang chờ các vai trò khác hành động...
                  </p>
                ) : ROLE_STRATEGIES[playerRoles[playerName]?.id] ? (
                  (() => {
                    const ActiveRoleUI =
                      ROLE_STRATEGIES[playerRoles[playerName]?.id];
                    return (
                      <ActiveRoleUI
                        gameState={gameState}
                        dispatch={dispatch}
                        channel={channel}
                        playerName={playerName}
                        executeAction={executeAction}
                      />
                    );
                  })()
                ) : null}
              </div>
            )}

            {/* Day Action Area */}
            {phase === "day" && gameStarted && dayPhase && (
              <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:items-start">
                <h3 className="mb-4 flex items-center text-sm font-bold text-amber-900">
                  <FaSun className="mr-2 text-lg" /> Ban Ngày - Ngày {dayCount}
                </h3>

                {dayPhase === "discussion" && (
                  <div className="w-full text-center">
                    <p className="mb-2 text-sm text-amber-800">
                      Thời gian thảo luận tự do:
                    </p>
                    <div className="text-4xl font-mono font-bold text-amber-900">
                      {Math.floor(dayTimeLeft / 60)}:
                      {(dayTimeLeft % 60).toString().padStart(2, "0")}
                    </div>
                    {hostName === playerName && (
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE",
                            payload: { dayTimeLeft: 0 },
                          })
                        }
                        className="mt-4 cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                      >
                        Bỏ qua thảo luận (Skip)
                      </button>
                    )}
                  </div>
                )}

                {dayPhase === "voting" && (
                  <div className="w-full">
                    <p className="mb-4 text-sm text-center text-amber-800">
                      Chọn người bị nghi ngờ là Sói để đưa lên biểu quyết:
                    </p>
                    <div className="text-2xl text-center font-mono font-bold text-amber-900 mb-6">
                      {Math.floor(dayTimeLeft / 60)}:
                      {(dayTimeLeft % 60).toString().padStart(2, "0")}
                    </div>
                    {alivePlayers.includes(playerName) ? (
                      <div className="grid grid-cols-2 gap-3">
                        {alivePlayers.map((p) => {
                          const votesForPWeight = alivePlayers.reduce(
                            (acc, voter) => {
                              if (dayVotes[voter] === p) {
                                return (
                                  acc +
                                  (playerRoles[voter]?.id === "mayor" ? 2 : 1)
                                );
                              }
                              return acc;
                            },
                            0,
                          );
                          return (
                            <button
                              key={p}
                              onClick={() => {
                                dispatch({
                                  type: "UPDATE_FUNCTION",
                                  payload: (prev) => ({
                                    dayVotes: {
                                      ...prev.dayVotes,
                                      [playerName]: p,
                                    },
                                  }),
                                });

                                if (channel)
                                  channel.send({
                                    type: "broadcast",
                                    event: "day-vote",
                                    payload: { playerName, target: p },
                                  });
                              }}
                              className={`relative cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${dayVotes[playerName] === p ? "border-amber-600 bg-amber-600 text-white" : "border-amber-200 bg-white text-amber-900 hover:bg-amber-100"}`}
                            >
                              {p}
                              {votesForPWeight > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                                  {votesForPWeight}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            dispatch({
                              type: "UPDATE_FUNCTION",
                              payload: (prev) => ({
                                dayVotes: {
                                  ...prev.dayVotes,
                                  [playerName]: "skip",
                                },
                              }),
                            });

                            if (channel)
                              channel.send({
                                type: "broadcast",
                                event: "day-vote",
                                payload: { playerName, target: "skip" },
                              });
                          }}
                          className={`relative col-span-2 mt-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${dayVotes[playerName] === "skip" ? "border-zinc-600 bg-zinc-600 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"}`}
                        >
                          Không chọn ai
                          {(() => {
                            const skipVotesWeight = alivePlayers.reduce(
                              (acc, voter) => {
                                if (dayVotes[voter] === "skip") {
                                  return (
                                    acc +
                                    (playerRoles[voter]?.id === "mayor" ? 2 : 1)
                                  );
                                }
                                return acc;
                              },
                              0,
                            );
                            return skipVotesWeight > 0 ? (
                              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
                                {skipVotesWeight}
                              </span>
                            ) : null;
                          })()}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-sm text-zinc-500">
                        Bạn đã chết, chỉ có thể quan sát.
                      </p>
                    )}
                    {hostName === playerName && (
                      <div className="mt-4 flex w-full justify-center">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE",
                              payload: { dayTimeLeft: 0 },
                            })
                          }
                          className="cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                        >
                          Kết thúc Vote sớm (Skip)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {dayPhase === "defense" && (
                  <div className="w-full text-center">
                    <p className="mb-2 text-lg font-bold text-purple-600">
                      {accusedPlayer} đang bị đưa lên giàn treo cổ!
                    </p>
                    <p className="mb-4 text-sm text-amber-800">
                      Thời gian để biện hộ:
                    </p>
                    <div className="text-4xl font-mono font-bold text-amber-900">
                      {Math.floor(dayTimeLeft / 60)}:
                      {(dayTimeLeft % 60).toString().padStart(2, "0")}
                    </div>
                    {hostName === playerName && (
                      <button
                        onClick={() =>
                          dispatch({
                            type: "UPDATE",
                            payload: { dayTimeLeft: 0 },
                          })
                        }
                        className="mt-4 cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                      >
                        Bỏ qua biện hộ (Skip)
                      </button>
                    )}
                  </div>
                )}

                {dayPhase === "execution" && (
                  <div className="w-full">
                    <p className="mb-2 text-center text-lg font-bold text-purple-600">
                      Quyết định số phận của {accusedPlayer}:
                    </p>
                    <div className="text-2xl text-center font-mono font-bold text-amber-900 mb-4">
                      {Math.floor(dayTimeLeft / 60)}:
                      {(dayTimeLeft % 60).toString().padStart(2, "0")}
                    </div>
                    {alivePlayers.includes(playerName) &&
                    playerName !== accusedPlayer ? (
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => {
                            dispatch({
                              type: "UPDATE_FUNCTION",
                              payload: (prev) => ({
                                executionVotes: {
                                  ...prev.executionVotes,
                                  [playerName]: "kill",
                                },
                              }),
                            });

                            if (channel)
                              channel.send({
                                type: "broadcast",
                                event: "execution-vote",
                                payload: { playerName, vote: "kill" },
                              });
                          }}
                          className={`w-full py-3 cursor-pointer rounded-lg font-bold transition-colors ${executionVotes[playerName] === "kill" ? "bg-purple-500 text-white" : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"}`}
                        >
                          Treo cổ 💀
                        </button>
                        <button
                          onClick={() => {
                            dispatch({
                              type: "UPDATE_FUNCTION",
                              payload: (prev) => ({
                                executionVotes: {
                                  ...prev.executionVotes,
                                  [playerName]: "save",
                                },
                              }),
                            });

                            if (channel)
                              channel.send({
                                type: "broadcast",
                                event: "execution-vote",
                                payload: { playerName, vote: "save" },
                              });
                          }}
                          className={`w-full py-3 cursor-pointer rounded-lg font-bold transition-colors ${executionVotes[playerName] === "save" ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          Tha bổng 🕊️
                        </button>
                      </div>
                    ) : playerName === accusedPlayer ? (
                      <p className="text-center text-sm text-zinc-500">
                        Bạn đang bị xét xử, không thể tự vote.
                      </p>
                    ) : (
                      <p className="text-center text-sm text-zinc-500">
                        Bạn đã chết, chỉ có thể quan sát.
                      </p>
                    )}

                    {hostName === playerName && (
                      <div className="mt-4 flex w-full justify-center">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE",
                              payload: { dayTimeLeft: 0 },
                            })
                          }
                          className="cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                        >
                          Kết thúc Vote sớm (Skip)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Nút tung sương mù cho Sói Sương Mù */}
                {playerRoles[playerName]?.id === "fog_wolf" &&
                  alivePlayers.includes(playerName) &&
                  !fogWolfUsed && (
                    <div className="mt-6 flex w-full justify-center border-t border-amber-200 pt-4">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Bạn có chắc muốn tung sương mù để hủy bỏ hoàn toàn ban ngày và chuyển ngay sang ban đêm không? (Chỉ dùng 1 lần/trận)",
                            )
                          ) {
                            dispatch({
                              type: "UPDATE",
                              payload: { fogWolfUsed: true },
                            });

                            if (channel) {
                              channel.send({
                                type: "broadcast",
                                event: "use-fog",
                                payload: { playerName },
                              });
                            }

                            if (hostName === playerName) {
                              const state = stateRef.current;
                              const sysLog: ActionLog = {
                                id: Math.random().toString(36).substring(2, 9),
                                dayCount: state.dayCount,
                                roleId: "system",
                                playerName: "system",
                                content: `🌫️ Sương mù dày đặc bao phủ ngôi làng! Sói Sương Mù đã kích hoạt kỹ năng. Mọi cuộc biểu quyết bị hủy bỏ, màn đêm lập tức buông xuống!`,
                              };
                              const newLogs = [...state.actionLogs, sysLog];

                              const nextDay = state.dayCount + 1;
                              const firstNightPhase = getNextNightPhase(
                                null,
                                state.playerRoles,
                                nextDay,
                              );

                              if (firstNightPhase) {
                                const timeLimit =
                                  firstNightPhase === "hunter" && nextDay > 1
                                    ? 15
                                    : 120;

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
                                  wolfVictim: null,
                                  witchAction: { heal: false, poison: null },
                                  actionLogs: newLogs,
                                  dayPhase: null,
                                  dayTimeLeft: 0,
                                  dayVotes: {},
                                  accusedPlayer: null,
                                  executionVotes: {},
                                  fogWolfUsed: true,
                                  assassinTarget: null,
                                };
                                dispatch({
                                  type: "UPDATE",
                                  payload: nightUpdates,
                                });

                                if (channel) {
                                  channel.send({
                                    type: "broadcast",
                                    event: "phase-change",
                                    payload: nightUpdates,
                                  });
                                }
                              }
                            }
                          }
                        }}
                        className="w-full cursor-pointer rounded-lg bg-slate-700 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                      >
                        🌫️ Tung Sương Mù (Bỏ qua Ngày)
                      </button>
                    </div>
                  )}
              </div>
            )}

            <ActionLogsArea
              actionLogs={actionLogs}
              activeLogTab={activeLogTab}
              setActiveLogTab={setActiveLogTab}
              playerName={playerName}
              playerRoles={playerRoles}
              isNight={isNight}
            />

            {/* Wolf Chat Area */}
            {(playerRoles[playerName]?.id === "werewolf" ||
              playerRoles[playerName]?.id === "cursed_wolf" ||
              playerRoles[playerName]?.id === "fog_wolf") && (
              <WolfChat
                wolfChat={wolfChat}
                playerName={playerName}
                alivePlayers={alivePlayers}
                onSendMessage={(msg) => {
                  const newMsg: ChatMessage = {
                    id: Math.random().toString(36).substring(2, 9),
                    playerName,
                    message: msg,
                    timestamp: Date.now(),
                  };
                  dispatch({
                    type: "UPDATE_FUNCTION",
                    payload: (prev) => ({
                      wolfChat: [newMsg, ...prev.wolfChat],
                    }),
                  });
                  if (channel) {
                    channel.send({
                      type: "broadcast",
                      event: "wolf-chat",
                      payload: { message: newMsg },
                    });
                  }
                }}
                isNight={isNight}
              />
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
