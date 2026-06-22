import React, { useState } from "react";
import { FaEye, FaHeart } from "react-icons/fa";
import { GiWolfHead, GiShield, GiDirewolf, GiWitchFlight, GiMusket, GiBowieKnife, GiMagicSwirl, GiMusicalNotes } from "react-icons/gi";
import { GameState, GameAction } from "../../types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
        {alivePlayers.map((p: any) => (
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
            `${playerName} đã bảo vệ ${nightSelection}`,
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
  const {
    alivePlayers,
    playerRoles,
    wolfVotes,
    actionConfirmed,
    activeExtraWolfKill,
  } = gameState;
  const maxTargets = activeExtraWolfKill ? 2 : 1;

  if (actionConfirmed) {
    const myVotes = wolfVotes[playerName] || [];
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-red-700">
          <GiWolfHead className="mr-1 inline text-red-700" />
          Bạn đã chốt vote cắn:
          <span className="ml-1 font-bold">
            {myVotes.length === 0 ? "Không ai" : myVotes.join(" và ")}
          </span>
        </p>
        <p className="mt-1 text-xs text-indigo-400">
          Đợi các Sói khác và Phù thủy...
        </p>
        <button
          onClick={() => {
            dispatch({
              type: "UPDATE_FUNCTION",
              payload: (prev: any) => ({
                actionConfirmed: false,
                confirmedPlayers: prev.confirmedPlayers.filter(
                  (p: any) => p !== playerName,
                ),
              }),
            });
            if (channel) {
              channel.send({
                type: "broadcast",
                event: "player-unconfirm",
                payload: { playerName },
              });
            }
          }}
          className="mt-3 w-full cursor-pointer rounded-lg border border-red-700 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-900/30"
        >
          Chọn lại
        </button>
      </div>
    );
  }

  const handleVote = (target: string) => {
    const currentVotes = wolfVotes[playerName] || [];
    let newVotes: string[];
    if (target === "none") {
      newVotes = [];
    } else {
      if (currentVotes.includes(target)) {
        newVotes = currentVotes.filter((v: any) => v !== target);
      } else {
        newVotes = [...currentVotes, target].slice(-maxTargets);
      }
    }
    const newWolfVotes = { ...wolfVotes, [playerName]: newVotes };
    dispatch({
      type: "UPDATE",
      payload: { wolfVotes: newWolfVotes },
    });
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "wolf-vote",
        payload: { playerName, target: newVotes },
      });
    }
  };

  const myVote = wolfVotes[playerName] || [];
  const aliveWolves = alivePlayers.filter(
    (w: any) =>
      playerRoles[w]?.id === "werewolf" ||
      playerRoles[w]?.id === "cursed_wolf" ||
      playerRoles[w]?.id === "fog_wolf" ||
      playerRoles[w]?.id === "wolf_cub" ||
      playerRoles[w]?.id === "white_wolf",
  );
  const isWaitingForOthers = aliveWolves.some((w: any) => {
    const v = wolfVotes[w] || [];
    if (v.length !== myVote.length) return true;
    return !v.every((x: any) => myVote.includes(x));
  });

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        {activeExtraWolfKill
          ? "Sói Con đã chết, đêm nay Sói được chọn tối đa 2 người để cắn."
          : "Chọn 1 người để cắn. Sói cần phải thống nhất vote cùng người."}
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers.map((p: any) => {
          const wolvesVotingForP = aliveWolves.filter((w: any) =>
            (wolfVotes[w] || []).includes(p),
          );
          return (
            <button
              key={p}
              onClick={() => handleVote(p)}
              className={`relative cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                myVote.includes(p)
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
            myVote.length === 0
              ? "border-slate-500 bg-slate-600 text-white"
              : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
          }`}
        >
          Không cắn ai
          {(() => {
            const wolvesWithNoVote = aliveWolves.filter(
              (w: any) => (wolfVotes[w] || []).length === 0,
            );
            return wolvesWithNoVote.length > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
                {wolvesWithNoVote.length}
              </span>
            ) : null;
          })()}
        </button>
      </div>
      <button
        onClick={() => {
          executeAction(
            `${playerName} đã vote cắn ${myVote.length === 0 ? "Không ai" : myVote.join(" và ")}`,
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

  if (cursedWolfUsed || !wolfVictim || wolfVictim.length === 0) {
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
              `${playerName} bỏ qua lượt.`,
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
        <span className="font-bold text-red-600">
          {wolfVictim.join(" và ")}
        </span>
        . Bạn có muốn sử dụng quyền năng lây nhiễm (chỉ 1 lần/trận) để biến 1
        người thành Sói không?
      </p>
      <div className="flex gap-3 w-full flex-wrap">
        {wolfVictim.map((v: any) => (
          <button
            key={v}
            onClick={() =>
              executeAction(
                `${playerName} đã chọn nguyền ${v}`,
                {
                  cursedWolfUsed: true,
                  infectedPlayer: v,
                },
                {
                  name: "night-action",
                  payload: {
                    role: "cursed_wolf",
                    target: v,
                    playerName,
                  },
                },
              )
            }
            className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            Nguyền {v}
          </button>
        ))}
        <button
          onClick={() =>
            executeAction(
              `${playerName} không dùng kỹ năng`,
              { infectedPlayer: null },
              {
                name: "night-action",
                payload: { role: "cursed_wolf", target: null, playerName },
              },
            )
          }
          className="w-full cursor-pointer rounded-lg bg-slate-600 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 mt-2"
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
          .filter((p: any) => p !== playerName)
          .map((p: any) => (
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
          const isWolf = [
            "werewolf",
            "cursed_wolf",
            "fog_wolf",
            "wolf_cub",
          ].includes(playerRoles[nightSelection as string]?.id || "");
          executeAction(
            `${playerName} đã soi ${nightSelection} ${isWolf ? "LÀ SÓI" : "KHÔNG PHẢI là Sói"}`,
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

  const handleHealToggle = (v: string) => {
    dispatch({
      type: "UPDATE_FUNCTION",
      payload: (prev: any) => {
        const currentHeal = prev.witchAction.heal || [];
        if (currentHeal.includes(v)) {
          return {
            witchAction: {
              ...prev.witchAction,
              heal: currentHeal.filter((x: any) => x !== v),
            },
          };
        } else {
          if (currentHeal.length < prev.witchPotions.heal) {
            return {
              witchAction: {
                ...prev.witchAction,
                heal: [...currentHeal, v],
              },
            };
          } else if (prev.witchPotions.heal === 1) {
            return {
              witchAction: { ...prev.witchAction, heal: [v] },
            };
          }
          return {};
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <div className="w-full rounded-lg bg-indigo-900/40 p-3 text-center">
        <p className="text-sm font-medium text-indigo-300">
          Đêm nay, Sói đã cắn:{" "}
          <span className="font-bold text-red-600">
            {!wolfVictim || wolfVictim.length === 0
              ? "Không ai"
              : wolfVictim.join(" và ")}
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="rounded-lg border border-green-900/50 bg-green-900/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-green-400">
              🧪 Bình Máu (còn {witchPotions.heal})
            </span>
          </div>
          <p className="text-xs text-green-500 mb-2">
            Dùng để cứu người bị Sói cắn.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {wolfVictim.map((v: any) => (
              <button
                key={v}
                onClick={() => handleHealToggle(v)}
                disabled={
                  witchPotions.heal <= 0 &&
                  !(witchAction.heal || []).includes(v)
                }
                className={`cursor-pointer rounded-md px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  (witchAction.heal || []).includes(v)
                    ? "border border-green-600 bg-green-600 text-white"
                    : "border border-green-800 bg-slate-700 text-green-300 hover:bg-green-900/50"
                }`}
              >
                Cứu {v}
              </button>
            ))}
            {wolfVictim.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Không có ai để cứu.
              </span>
            )}
          </div>
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
                    payload: (prev: any) => ({
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
              .filter((p: any) => p !== playerName)
              .map((p: any) => (
                <button
                  key={p}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_FUNCTION",
                      payload: (prev: any) => ({
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
          if ((witchAction.heal || []).length > 0)
            content += `${playerName} đã dùng bình cứu lên ${(witchAction.heal || []).join(" và ")}. `;
          if (witchAction.poison)
            content += `${playerName} đã ném bình độc vào ${witchAction.poison}.`;
          if ((witchAction.heal || []).length === 0 && !witchAction.poison)
            content += `${playerName} đã không dùng bình nào.`;
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
          .filter((p: any) => p !== playerName)
          .map((p: any) => (
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
              `${playerName} đã ghim mục tiêu ${nightSelection || "Không có ai"}`,
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
                `${playerName} đã giữ nguyên mục tiêu ${hunterTarget || "Không có ai"}`,
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
          .filter((p: any) => p !== playerName)
          .map((p: any) => (
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
              ? `${playerName} đã quyết định không ám sát ai`
              : `${playerName} đã ám sát ${nightSelection}`,
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

const CupidNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { alivePlayers, actionConfirmed, cupidTargets } = gameState;
  const [selected, setSelected] = useState<string[]>([]);

  if (actionConfirmed || cupidTargets) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-pink-400">
          <FaHeart className="mr-1 inline text-pink-500" />
          Bạn đã ghép đôi:
          <span className="ml-1 font-bold">
            {cupidTargets ? cupidTargets.join(" và ") : "..."}
          </span>
        </p>
      </div>
    );
  }

  const toggleSelection = (p: string) => {
    if (selected.includes(p)) {
      setSelected(selected.filter((x: any) => x !== p));
    } else if (selected.length < 2) {
      setSelected([...selected, p]);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Chọn 2 người để ghép đôi (có thể chọn chính mình). Hai người này sẽ sống
        chết có nhau!
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers.map((p: any) => (
          <button
            key={p}
            onClick={() => toggleSelection(p)}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${selected.includes(p) ? "border-pink-500 bg-pink-600 text-white" : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() =>
          executeAction(
            `${playerName} đã ghép đôi ${selected[0]} và ${selected[1]}`,
            { cupidTargets: selected as [string, string] },
            {
              name: "night-action",
              payload: { role: "cupid", target: selected, playerName },
            },
          )
        }
        disabled={selected.length !== 2}
        className="w-full cursor-pointer rounded-lg bg-pink-600 px-4 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
      >
        Xác nhận ghép đôi
      </button>
    </div>
  );
};

const MediumNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { players, alivePlayers, nightSelection, actionConfirmed, mediumUsed } =
    gameState;

  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-teal-400">
          <GiMagicSwirl className="mr-1 inline text-teal-400" />
          Bạn đã hoàn tất hành động đêm nay.
          {nightSelection && nightSelection !== "none" && (
            <>
              {" "}
              Màn hồi sinh: <span className="font-bold">{nightSelection}</span>
            </>
          )}
        </p>
      </div>
    );
  }

  if (mediumUsed) {
    return (
      <div className="flex flex-col gap-4 w-full mt-2">
        <p className="text-sm font-medium text-teal-300">
          Bạn đã sử dụng quyền năng hồi sinh. Đêm nay bạn không thể làm gì thêm.
        </p>
        <button
          onClick={() => {
            executeAction(
              `${playerName} không còn quyền năng.`,
              {},
              {
                name: "night-action",
                payload: { role: "medium", target: null, playerName },
              },
            );
          }}
          className="w-full cursor-pointer rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800"
        >
          Xác nhận
        </button>
      </div>
    );
  }

  const deadPlayers = players.filter((p: any) => !alivePlayers.includes(p));

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Bạn có thể chọn 1 người đã chết để hồi sinh (chỉ dùng 1 lần/trận):
      </p>
      {deadPlayers.length === 0 ? (
        <p className="text-sm italic text-slate-400">Chưa có ai chết.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full">
          {deadPlayers.map((p: any) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: "UPDATE", payload: { nightSelection: p } })
              }
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${nightSelection === p ? "border-teal-600 bg-teal-600 text-white" : "border-teal-900/50 bg-slate-700 text-teal-300 hover:bg-teal-900/50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={() =>
            executeAction(
              `${playerName} đã dùng quyền năng hồi sinh ${nightSelection}`,
              { mediumResurrect: nightSelection as string },
              {
                name: "night-action",
                payload: { role: "medium", target: nightSelection, playerName },
              },
            )
          }
          disabled={!nightSelection || nightSelection === "none"}
          className="w-full cursor-pointer rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Hồi sinh
        </button>
        <button
          onClick={() =>
            executeAction(
              `${playerName} đã quyết định không hồi sinh ai đêm nay.`,
              { mediumResurrect: null },
              {
                name: "night-action",
                payload: { role: "medium", target: null, playerName },
              },
            )
          }
          className="w-full cursor-pointer rounded-lg bg-slate-600 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          Không dùng
        </button>
      </div>
    </div>
  );
};

const PiedPiperNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const { alivePlayers, hypnotizedPlayers, nightSelection, actionConfirmed } =
    gameState;

  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-emerald-400">
          <GiMusicalNotes className="mr-1 inline text-emerald-400" />
          Bạn đã quyết định thôi miên:
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
        Chọn 1 người để thôi miên đêm nay. Bạn sẽ thắng nếu tất cả những người
        còn sống đều bị thôi miên.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {alivePlayers
          .filter((p: any) => p !== playerName)
          .map((p: any) => {
            const isHypnotized = hypnotizedPlayers.includes(p);
            return (
              <button
                key={p}
                disabled={isHypnotized}
                onClick={() =>
                  dispatch({ type: "UPDATE", payload: { nightSelection: p } })
                }
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  nightSelection === p
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
                }`}
              >
                {p} {isHypnotized && "(Đã thôi miên)"}
              </button>
            );
          })}
        <button
          onClick={() =>
            dispatch({ type: "UPDATE", payload: { nightSelection: "none" } })
          }
          className={`col-span-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            nightSelection === "none"
              ? "border-slate-500 bg-slate-600 text-white"
              : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"
          }`}
        >
          Không thôi miên ai
        </button>
      </div>
      <button
        onClick={() => {
          executeAction(
            nightSelection === "none"
              ? `${playerName} đã không thôi miên ai đêm nay.`
              : `${playerName} đã thôi miên ${nightSelection}.`,
            {
              hypnotizedPlayers:
                nightSelection !== "none" && nightSelection
                  ? Array.from(
                      new Set([...hypnotizedPlayers, nightSelection as string]),
                    )
                  : hypnotizedPlayers,
            },
            {
              name: "night-action",
              payload: {
                role: "pied_piper",
                target: nightSelection === "none" ? null : nightSelection,
                playerName,
              },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        Xác nhận
      </button>
    </div>
  );
};

const WhiteWolfNightUI = ({
  gameState,
  dispatch,
  playerName,
  executeAction,
}: RoleUIProps) => {
  const {
    alivePlayers,
    nightSelection,
    actionConfirmed,
    playerRoles,
    dayCount,
  } = gameState;

  if (dayCount < 2 || dayCount % 2 !== 0) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-indigo-400">
          Bạn chỉ có thể giết Sói vào các đêm chẵn (2, 4, 6...). Đêm nay bạn
          không có hành động.
        </p>
      </div>
    );
  }

  if (actionConfirmed) {
    return (
      <div className="rounded-lg border border-indigo-900/50 bg-slate-800 p-3 text-center">
        <p className="text-sm font-medium text-zinc-400">
          <GiDirewolf className="mr-1 inline" />
          Bạn đã quyết định:
          <span className="ml-1 font-bold">
            {nightSelection === "none"
              ? "Không giết ai"
              : `Giết ${nightSelection}`}
          </span>
        </p>
      </div>
    );
  }

  const otherWolves = alivePlayers.filter(
    (p: any) =>
      p !== playerName &&
      ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub"].includes(
        playerRoles[p]?.id || "",
      ),
  );

  if (otherWolves.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full mt-2">
        <p className="text-sm font-medium text-indigo-400">
          Không còn Sói nào khác trong bầy để bạn ra tay.
        </p>
        <button
          onClick={() => {
            executeAction(
              `${playerName} không còn Sói nào khác để giết.`,
              { whiteWolfVictim: null },
              {
                name: "night-action",
                payload: { role: "white_wolf", target: null, playerName },
              },
            );
          }}
          className="w-full cursor-pointer rounded-lg bg-zinc-500 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-600"
        >
          Xác nhận
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full mt-2">
      <p className="text-sm font-medium text-indigo-300">
        Đêm nay là đêm chẵn, bạn có thể chọn một Sói khác để giết.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {otherWolves.map((p: any) => (
          <button
            key={p}
            onClick={() =>
              dispatch({ type: "UPDATE", payload: { nightSelection: p } })
            }
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${nightSelection === p ? "border-zinc-400 bg-zinc-300 text-black" : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() =>
            dispatch({ type: "UPDATE", payload: { nightSelection: "none" } })
          }
          className={`col-span-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${nightSelection === "none" ? "border-slate-500 bg-slate-600 text-white" : "border-indigo-800 bg-slate-700 text-indigo-300 hover:bg-indigo-900/50"}`}
        >
          Không giết ai
        </button>
      </div>
      <button
        onClick={() => {
          executeAction(
            nightSelection === "none"
              ? `${playerName} đã quyết định không giết Sói nào.`
              : `${playerName} đã chọn giết Sói ${nightSelection}.`,
            {
              whiteWolfVictim:
                nightSelection === "none" ? null : (nightSelection as string),
            },
            {
              name: "night-action",
              payload: {
                role: "white_wolf",
                target: nightSelection === "none" ? null : nightSelection,
                playerName,
              },
            },
          );
        }}
        disabled={!nightSelection}
        className="w-full cursor-pointer rounded-lg bg-zinc-500 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        Xác nhận
      </button>
    </div>
  );
};

const ROLE_STRATEGIES: Record<string, React.FC<RoleUIProps>> = {
  bodyguard: BodyguardNightUI,
  werewolf: WerewolfNightUI,
  cursed_wolf: CursedWolfNightUI,
  fog_wolf: WerewolfNightUI,
  seer: SeerNightUI,
  witch: WitchNightUI,
  hunter: HunterNightUI,
  assassin: AssassinNightUI,
  cupid: CupidNightUI,
  medium: MediumNightUI,
  pied_piper: PiedPiperNightUI,
  white_wolf: WhiteWolfNightUI,
};

export { ROLE_STRATEGIES };
export type { RoleUIProps };
