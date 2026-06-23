import { FaCrown, FaGhost, FaHeart } from "react-icons/fa";
import { GiBullseye, GiMusicalNotes } from "react-icons/gi";
import { RoleConfig } from "../types";
import { RoleIcon, getRoleColor } from "../utils";

type PlayerGridProps = {
  players: string[];
  spectators: string[];
  alivePlayers: string[];
  playerRoles: Record<string, RoleConfig>;
  originalRoles?: Record<string, RoleConfig>;
  playerName: string;
  hostName: string | null;
  gameStarted: boolean;
  phase: string;
  headhunterTarget?: string | null;
  cupidTargets?: [string, string] | null;
  hypnotizedPlayers?: string[];
  isNight?: boolean;
  onKickPlayer?: (name: string) => void;
};

export default function PlayerGrid({
  players,
  spectators,
  alivePlayers,
  playerRoles,
  originalRoles,
  playerName,
  hostName,
  gameStarted,
  phase,
  headhunterTarget,
  cupidTargets,
  hypnotizedPlayers,
  isNight,
  onKickPlayer,
}: PlayerGridProps) {
  return (
    <div className="flex w-full flex-col space-y-6">
      <div
        className={`w-full rounded-xl border p-6 shadow-sm ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
      >
        <div
          className={`mb-4 flex items-center justify-between border-b pb-4 ${isNight ? "border-slate-700" : "border-zinc-100"}`}
        >
          <h3
            className={`text-lg font-medium ${isNight ? "text-slate-200" : "text-zinc-900"}`}
          >
            Người chơi ({players.length})
          </h3>
          {gameStarted && (
            <span className="animate-pulse rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              ĐANG CHƠI
            </span>
          )}
        </div>

        {players.length === 0 ? (
          <p
            className={`py-8 text-center text-sm italic ${isNight ? "text-slate-400" : "text-zinc-500"}`}
          >
            Chưa có người chơi nào.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {players.map((p, idx) => {
              const role = playerRoles[p];
              const originalRole = originalRoles?.[p];
              const myRole = playerRoles[playerName];
              const isMe = p === playerName;
              const isBothWolves =
                (myRole?.id === "werewolf" ||
                  myRole?.id === "cursed_wolf" ||
                  myRole?.id === "fog_wolf" ||
                  myRole?.id === "wolf_cub" ||
                  myRole?.id === "white_wolf") &&
                (role?.id === "werewolf" ||
                  role?.id === "cursed_wolf" ||
                  role?.id === "fog_wolf" ||
                  role?.id === "wolf_cub" ||
                  role?.id === "white_wolf");
              const canSeeRole = isMe || isBothWolves || phase === "game_over";
              const isTarget =
                headhunterTarget === p &&
                (myRole?.id === "headhunter" || phase === "game_over");
              const isLover =
                cupidTargets &&
                cupidTargets.includes(p) &&
                (cupidTargets.includes(playerName) ||
                  myRole?.id === "cupid" ||
                  phase === "game_over");
              const canSeeHypnotized =
                phase === "game_over" ||
                myRole?.id === "pied_piper" ||
                (isMe && hypnotizedPlayers?.includes(p));

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md ${isNight ? "bg-slate-700/50" : "bg-zinc-50"} ${!alivePlayers.includes(p) && gameStarted ? `opacity-50 grayscale ${isNight ? "border-slate-700" : "border-zinc-200"}` : isNight ? "border-slate-600" : "border-zinc-100"}`}
                >
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {!alivePlayers.includes(p) && gameStarted && (
                      <div className="group relative cursor-help text-lg text-zinc-500">
                        <FaGhost />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Đã chết
                          <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                        </div>
                      </div>
                    )}
                    {p === hostName && (
                      <div className="group relative cursor-help text-lg text-amber-500">
                        <FaCrown />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Chủ phòng
                          <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                        </div>
                      </div>
                    )}
                    {gameStarted && isTarget && (
                      <div className="group relative cursor-help text-lg text-cyan-600">
                        <GiBullseye />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Mục tiêu săn thưởng
                          <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                        </div>
                      </div>
                    )}
                    {gameStarted && isLover && (
                      <div className="group relative cursor-help text-lg text-pink-500">
                        <FaHeart />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Cặp đôi
                          <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                        </div>
                      </div>
                    )}
                    {gameStarted &&
                      hypnotizedPlayers?.includes(p) &&
                      canSeeHypnotized && (
                        <div className="group relative cursor-help text-lg text-emerald-500">
                          <GiMusicalNotes />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Bị thôi miên
                            <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                          </div>
                        </div>
                      )}
                    {p !== hostName &&
                      !gameStarted &&
                      hostName === playerName &&
                      onKickPlayer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onKickPlayer(p);
                          }}
                          className="group relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-100/80 text-xs font-bold text-red-600 transition-colors hover:bg-red-200"
                        >
                          ✕
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-red-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Đuổi người chơi
                            <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-red-800 -translate-x-1/2"></div>
                          </div>
                        </button>
                      )}
                  </div>
                  <div
                    className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-inner ${isNight ? "bg-slate-600 text-slate-300" : "bg-zinc-200 text-zinc-700"}`}
                  >
                    {p.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`w-full truncate text-center text-sm ${isMe ? (isNight ? "font-bold text-indigo-400" : "font-bold text-indigo-700") : isNight ? "font-medium text-slate-200" : "font-medium text-zinc-800"}`}
                  >
                    {p} {isMe && "(Bạn)"}
                  </span>
                  {gameStarted && role && canSeeRole && (
                    <div className="mt-1 flex flex-col items-center justify-center space-y-1">
                      {originalRole && originalRole.id !== role.id && (
                        <span
                          className={`flex items-center justify-center space-x-1 text-xs font-bold line-through opacity-50 ${getRoleColor(originalRole.id)}`}
                        >
                          <RoleIcon id={originalRole.id} className="text-sm" />
                          <span>{originalRole.name}</span>
                        </span>
                      )}
                      <span className={`whitespace-nowrap mt-1 flex items-center space-x-1 rounded px-2 py-0.5 text-[10px] font-extrabold shadow-sm border ${getRoleColor(role.id)} ${
                    isNight ? "border-slate-600 bg-slate-700/80" : "border-zinc-200 bg-white"
                  }`}>  <RoleIcon id={role.id} className="text-sm" />
                        <span>{role.name}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Chỗ này bạn có thể bổ sung phần Spectators nếu muốn, hoặc tách ra thành SpectatorList */}
    </div>
  );
}
