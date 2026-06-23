"use client";

import React from "react";
import { FaSun } from "react-icons/fa";
import { GiWolfHead } from "react-icons/gi";
import { GameState, GameAction } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type DayActionControllerProps = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  channel: RealtimeChannel | null;
  playerName: string;
};

export default function DayActionController({
  gameState,
  dispatch,
  channel,
  playerName,
}: DayActionControllerProps) {
  const {
    hostName,
    alivePlayers,
    playerRoles,
    dayCount,
    dayPhase,
    dayTimeLeft,
    dayVotes = {},
    executionVotes = {},
    accusedPlayer,
  } = gameState;

  const isHost = hostName === playerName;
  const isAlive = alivePlayers.includes(playerName);
  const myRole = playerRoles[playerName]?.id;
  const isFogWolf = myRole === "fog_wolf" && isAlive;
  const fogWolfUsed = gameState.fogWolfUsed;

  return (
    <div className="flex flex-col items-center p-4 w-full md:items-start">
      <h3 className="mb-4 flex items-center text-sm font-extrabold text-amber-900 uppercase tracking-wider">
        <FaSun className="mr-2 text-lg text-amber-600 animate-spin-slow" style={{ animationDuration: "12s" }} /> 
        Ban Ngày - Ngày {dayCount} ({Math.floor(dayTimeLeft / 60)}:{(dayTimeLeft % 60).toString().padStart(2, "0")})
      </h3>

      {/* Discussion Phase */}
      {dayPhase === "discussion" && (
        <div className="w-full text-center md:text-left space-y-4">

          {/* Fog Wolf special morning ability */}
          {isFogWolf && !fogWolfUsed && (
            <div className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <GiWolfHead className="text-xl text-slate-300" />
                <span className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">Năng Lực Sói Sương Mù</span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Bạn có thể kích hoạt <span className="font-bold text-slate-200">Màn Sương</span> — huỷ bỏ mọi biểu quyết ban ngày và ngay lập tức bước vào đêm mới. Chỉ dùng được <span className="font-bold text-yellow-400">1 lần</span> trong trận.
              </p>
              <button
                onClick={() => {
                  if (channel) {
                    channel.send({
                      type: "broadcast",
                      event: "use-fog",
                      payload: { playerName },
                    });
                  }
                }}
                className="w-full cursor-pointer rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 py-2.5 text-xs font-extrabold text-white transition-colors shadow-sm"
              >
                🌫️ Kích hoạt Màn Sương — Bắt đầu đêm ngay!
              </button>
            </div>
          )}

          {isFogWolf && fogWolfUsed && (
            <div className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <p className="text-xs text-slate-500 italic">Bạn đã dùng năng lực Màn Sương trong trận này.</p>
            </div>
          )}
        <div className="w-full text-center md:text-left">
          <p className="mb-4 text-sm font-bold text-amber-800">
            Thời gian thảo luận tự do đang diễn ra...
          </p>
          {isHost && (
            <button
              onClick={() => dispatch({ type: "UPDATE", payload: { dayTimeLeft: 0 } })}
              className="cursor-pointer rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 shadow-sm"
            >
              Bỏ qua thảo luận (Skip)
            </button>
          )}
        </div>
        </div>
      )}


      {/* Target Voting Phase */}
      {dayPhase === "voting" && (
        <div className="w-full">
          <p className="mb-5 text-sm font-bold text-center text-amber-800 md:text-left">
            Chọn người nghi ngờ là Sói để đưa lên giàn treo cổ:
          </p>
          
          {isAlive ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              {alivePlayers.map((p) => {
                const votesForPWeight = alivePlayers.reduce((acc, voter) => {
                  if (dayVotes[voter] === p) {
                    return acc + (playerRoles[voter]?.id === "mayor" ? 2 : 1);
                  }
                  return acc;
                }, 0);
                
                const hasVotedForThis = dayVotes[playerName] === p;

                return (
                  <button
                    key={p}
                    onClick={() => {
                      const newTarget = hasVotedForThis ? null : p;
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
                    }}
                    className={`relative cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      hasVotedForThis
                        ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    {p} {p === playerName && "(Bạn)"}
                    {votesForPWeight > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white border-2 border-amber-50 shadow-sm">
                        {votesForPWeight}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Skip Vote Button */}
              <button
                onClick={() => {
                  const hasSkipped = dayVotes[playerName] === "skip";
                  const newTarget = hasSkipped ? null : "skip";
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
                }}
                className={`relative col-span-2 mt-2 cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                  dayVotes[playerName] === "skip"
                    ? "border-zinc-600 bg-zinc-600 text-white shadow-md"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Không chọn ai (Bỏ qua)
                {(() => {
                  const skipVotesWeight = alivePlayers.reduce((acc, voter) => {
                    if (dayVotes[voter] === "skip") {
                      return acc + (playerRoles[voter]?.id === "mayor" ? 2 : 1);
                    }
                    return acc;
                  }, 0);
                  return skipVotesWeight > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-black text-white border-2 border-amber-50 shadow-sm">
                      {skipVotesWeight}
                    </span>
                  ) : null;
                })()}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-zinc-500 italic py-2">
              Bạn đã tử nạn. Hãy theo dõi biểu quyết từ dân làng.
            </p>
          )}

          {isHost && (
            <div className="mt-4 flex w-full justify-center">
              <button
                onClick={() => dispatch({ type: "UPDATE", payload: { dayTimeLeft: 0 } })}
                className="cursor-pointer rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
              >
                Kết thúc biểu quyết sớm
              </button>
            </div>
          )}
        </div>
      )}

      {/* Defense Phase */}
      {dayPhase === "defense" && (
        <div className="w-full text-center md:text-left">
          <p className="mb-2 text-md font-extrabold text-purple-700">
            ⚖️ {accusedPlayer} đang bị tố giác và chuẩn bị lên giàn treo cổ!
          </p>
          <p className="mb-4 text-xs font-semibold text-amber-800">
            Đang trong thời gian biện hộ tự do của {accusedPlayer}...
          </p>
          {isHost && (
            <button
              onClick={() => dispatch({ type: "UPDATE", payload: { dayTimeLeft: 0 } })}
              className="cursor-pointer rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              Bỏ qua biện hộ (Skip)
            </button>
          )}
        </div>
      )}

      {/* Trial Execution Phase */}
      {dayPhase === "execution" && (
        <div className="w-full">
          <p className="mb-5 text-sm font-bold text-amber-800">
            Biểu quyết sinh tử cho {accusedPlayer}:
          </p>

          {/* Voting scoreboard */}
          {(() => {
            let killVotes = 0;
            let saveVotes = 0;
            Object.entries(executionVotes).forEach(([voter, vote]) => {
              const weight = playerRoles[voter]?.id === "mayor" ? 2 : 1;
              if (vote === "kill") killVotes += weight;
              else if (vote === "save") saveVotes += weight;
            });
            return (
              <div className="mb-5 flex justify-center gap-12 text-xs font-extrabold rounded-2xl bg-white/70 py-4 border border-amber-200/50 shadow-inner">
                <div className="flex flex-col items-center">
                  <span className="text-purple-700 mb-1">💀 Treo cổ</span>
                  <span className="text-3xl font-black text-purple-600">{killVotes}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-emerald-700 mb-1">🕊️ Tha bổng</span>
                  <span className="text-3xl font-black text-emerald-600">{saveVotes}</span>
                </div>
              </div>
            );
          })()}

          {/* User vote controls */}
          {isAlive && playerName !== accusedPlayer ? (
            <div className="flex justify-center gap-4 w-full">
              <button
                onClick={() => {
                  dispatch({
                    type: "UPDATE_FUNCTION",
                    payload: (prev: any) => ({
                      executionVotes: {
                        ...prev.executionVotes,
                        [playerName]: "kill",
                      },
                    }),
                  });

                  if (channel) {
                    channel.send({
                      type: "broadcast",
                      event: "execution-vote",
                      payload: { playerName, vote: "kill" },
                    });
                  }
                }}
                className={`w-full py-3 cursor-pointer rounded-xl font-extrabold text-xs transition-all ${
                  executionVotes[playerName] === "kill"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                }`}
              >
                Treo cổ 💀
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: "UPDATE_FUNCTION",
                    payload: (prev: any) => ({
                      executionVotes: {
                        ...prev.executionVotes,
                        [playerName]: "save",
                      },
                    }),
                  });

                  if (channel) {
                    channel.send({
                      type: "broadcast",
                      event: "execution-vote",
                      payload: { playerName, vote: "save" },
                    });
                  }
                }}
                className={`w-full py-3 cursor-pointer rounded-xl font-extrabold text-xs transition-all ${
                  executionVotes[playerName] === "save"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                Tha bổng 🕊️
              </button>
            </div>
          ) : playerName === accusedPlayer ? (
            <p className="text-center text-xs text-zinc-500 italic py-2">
              Bạn đang bị phán quyết. Hãy đợi bản án từ hội đồng làng.
            </p>
          ) : (
            <p className="text-center text-xs text-zinc-500 italic py-2">
              Bạn đã tử nạn. Chỉ có thể quan sát phiên tòa.
            </p>
          )}

          {isHost && (
            <div className="mt-4 flex w-full justify-center">
              <button
                onClick={() => dispatch({ type: "UPDATE", payload: { dayTimeLeft: 0 } })}
                className="cursor-pointer rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
              >
                Kết thúc phiên xử sớm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
