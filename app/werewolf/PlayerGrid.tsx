import { FaCrown, FaGhost } from "react-icons/fa";
import { RoleConfig } from "./types";
import { RoleIcon, getRoleColor } from "./utils";

type PlayerGridProps = {
  players: string[];
  spectators: string[];
  alivePlayers: string[];
  playerRoles: Record<string, RoleConfig>;
  playerName: string;
  hostName: string | null;
  gameStarted: boolean;
  phase: string;
};

export default function PlayerGrid({
  players,
  spectators,
  alivePlayers,
  playerRoles,
  playerName,
  hostName,
  gameStarted,
  phase,
}: PlayerGridProps) {
  return (
    <div className="flex w-full flex-col space-y-6">
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
              const canSeeRole = isMe || isBothWolves || phase === "game_over";

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border bg-zinc-50 p-4 shadow-sm transition-shadow hover:shadow-md ${!alivePlayers.includes(p) && gameStarted ? "opacity-50 grayscale border-zinc-200" : "border-zinc-100"}`}
                >
                  {!alivePlayers.includes(p) && gameStarted && (
                    <div className="group absolute left-2 top-2 cursor-help text-lg text-zinc-500">
                      <FaGhost />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Đã chết
                        <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                      </div>
                    </div>
                  )}
                  {p === hostName && (
                    <div className="group absolute right-2 top-2 cursor-help text-lg text-amber-500">
                      <FaCrown />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Chủ phòng
                        <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
                      </div>
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
      {/* Chỗ này bạn có thể bổ sung phần Spectators nếu muốn, hoặc tách ra thành SpectatorList */}
    </div>
  );
}
