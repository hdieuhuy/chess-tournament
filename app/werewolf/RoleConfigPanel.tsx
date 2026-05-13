import { RoleConfig } from "./types";
import { RoleIcon, getRoleColor, getRoleDescription } from "./utils";

type RoleConfigPanelProps = {
  roleConfig: RoleConfig[];
  playersCount: number;
  hostName: string | null;
  playerName: string;
  gameStarted: boolean;
  updateRoleCount: (id: string, delta: number) => void;
};

export default function RoleConfigPanel({
  roleConfig,
  playersCount,
  hostName,
  playerName,
  gameStarted,
  updateRoleCount,
}: RoleConfigPanelProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:items-start w-full">
      <div className="mb-4 flex w-full items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-800">
          Cấu hình Vai trò
        </h3>
        <span className="text-xs font-medium text-zinc-500">
          Tổng: {roleConfig.reduce((acc, r) => acc + r.count, 0)}/{playersCount}
        </span>
      </div>

      {hostName === playerName && !gameStarted ? (
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
            </div>
          ))}
        </div>
      ) : (
        <div className="grid w-full grid-cols-5 gap-2">
          {roleConfig.map((role) => (
            <div
              key={role.id}
              className="group relative flex flex-col items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 p-2 hover:bg-zinc-100"
            >
              <RoleIcon
                id={role.id}
                className={`mb-1 text-2xl ${getRoleColor(role.id)}`}
              />
              <span className="text-sm font-bold text-zinc-800">
                {role.count}
              </span>

              {/* Tooltip hiển thị khi hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-40 -translate-x-1/2 rounded bg-zinc-800 px-2 py-1.5 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                <p className="mb-0.5 font-bold">{role.name}</p>
                <p className="text-[10px] leading-tight text-zinc-300">
                  {getRoleDescription(role.id)}
                </p>
                <div className="absolute left-1/2 top-full -mt-px border-4 border-transparent border-t-zinc-800 -translate-x-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {hostName === playerName &&
        !gameStarted &&
        roleConfig.reduce((acc, r) => acc + r.count, 0) !== playersCount && (
          <p className="mt-3 w-full text-center text-xs text-red-500">
            * Tổng số vai trò chưa khớp với số người chơi
          </p>
        )}
    </div>
  );
}
