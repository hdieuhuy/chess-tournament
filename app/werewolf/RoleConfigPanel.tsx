import { useState } from "react";
import { Modal } from "@/components/Modal";
import { RoleConfig } from "./types";
import { RoleIcon, getRoleColor, getRoleDescription } from "./utils";

type RoleConfigPanelProps = {
  roleConfig: RoleConfig[];
  playersCount: number;
  hostName: string | null;
  playerName: string;
  gameStarted: boolean;
  updateRoleCount: (id: string, delta: number) => void;
  isNight?: boolean;
};

const getFaction = (roleId: string) => {
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
  if (wolves.includes(roleId)) return "wolf";
  if (thirdParties.includes(roleId)) return "third_party";
  return "villager";
};

const FACTIONS = [
  { id: "villager", name: "Phe Dân Làng" },
  { id: "wolf", name: "Phe Sói" },
  { id: "third_party", name: "Phe Thứ Ba" },
];

export default function RoleConfigPanel({
  roleConfig,
  playersCount,
  hostName,
  playerName,
  gameStarted,
  updateRoleCount,
  isNight,
}: RoleConfigPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalRoles = roleConfig.reduce((acc, r) => acc + r.count, 0);

  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-6 shadow-sm md:items-start w-full ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
    >
      <div className="mb-4 flex w-full items-center justify-between">
        <div>
          <h3
            className={`text-sm font-semibold ${isNight ? "text-slate-200" : "text-zinc-800"}`}
          >
            Cấu hình Vai trò
          </h3>
          <span
            className={`text-xs font-medium ${isNight ? "text-slate-400" : "text-zinc-500"}`}
          >
            Tổng: {totalRoles}/{playersCount}
          </span>
        </div>
        {hostName === playerName && !gameStarted && (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${isNight ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Luôn hiển thị giao diện xem (dạng lưới) */}
      <div className="flex w-full flex-col space-y-4">
        {FACTIONS.map((faction) => {
          const factionRoles = roleConfig.filter(
            (r) => r.count > 0 && getFaction(r.id) === faction.id,
          );
          const factionTotal = factionRoles.reduce(
            (sum, r) => sum + r.count,
            0,
          );

          if (factionRoles.length === 0) return null;

          return (
            <div key={faction.id} className="flex w-full flex-col">
              <div
                className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${isNight ? "text-slate-400" : faction.id === "villager" ? "text-emerald-600" : faction.id === "wolf" ? "text-red-600" : "text-purple-600"}`}
              >
                {faction.name} ({factionTotal})
              </div>
              <div className="grid w-full grid-cols-5 gap-2">
                {factionRoles.map((role) => (
                  <div
                    key={role.id}
                    className={`group relative flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${isNight ? "border-slate-600 bg-slate-700/50 hover:bg-slate-700" : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100"}`}
                  >
                    <RoleIcon
                      id={role.id}
                      className={`mb-1 text-2xl ${getRoleColor(role.id)}`}
                    />
                    <span
                      className={`text-sm font-bold ${isNight ? "text-slate-200" : "text-zinc-800"}`}
                    >
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
            </div>
          );
        })}
      </div>

      {hostName === playerName &&
        !gameStarted &&
        totalRoles !== playersCount && (
          <p className="mt-3 w-full text-center text-xs text-red-500">
            * Tổng số vai trò chưa khớp với số người chơi
          </p>
        )}

      <Modal isOpen={isModalOpen} title="Chỉnh sửa Vai trò">
        <div className="flex w-full flex-col space-y-3">
          <p className="text-center text-sm font-medium text-zinc-500 mb-2">
            Số lượng đang chọn:{" "}
            <span className="font-bold text-zinc-800">{totalRoles}</span> /{" "}
            {playersCount} người
          </p>
          <div className="flex max-h-[60vh] w-full flex-col overflow-y-auto pr-1">
            {FACTIONS.map((faction) => {
              const factionRoles = roleConfig.filter(
                (r) => getFaction(r.id) === faction.id,
              );
              const factionTotal = factionRoles.reduce(
                (sum, r) => sum + r.count,
                0,
              );
              if (factionRoles.length === 0) return null;

              return (
                <div key={faction.id} className="mb-4 last:mb-0">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {faction.name} ({factionTotal})
                  </h4>
                  <div className="flex flex-col space-y-2">
                    {factionRoles.map((role) => (
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
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="mt-4 w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Hoàn tất
          </button>
        </div>
      </Modal>
    </div>
  );
}
