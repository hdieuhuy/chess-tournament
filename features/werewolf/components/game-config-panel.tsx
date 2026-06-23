import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { RoleConfig } from "../types";
import { RoleIcon, getRoleColor, getRoleDescription } from "../utils";
import { FaClock, FaUsers, FaCog } from "react-icons/fa";

type TimeSettings = {
  discussion: number;
  voting: number;
  defense: number;
  night: number;
};

type GameConfigPanelProps = {
  roleConfig: RoleConfig[];
  playersCount: number;
  hostName: string | null;
  playerName: string;
  gameStarted: boolean;
  updateRoleCount: (id: string, delta: number) => void;
  applyRolePreset?: (presetCounts: Record<string, number>) => void;
  timeSettings: TimeSettings;
  updateTimeSettings: (newSettings: TimeSettings) => void;
  isNight?: boolean;
};

const getFaction = (roleId: string) => {
  const wolves = ["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub"];
  const thirdParties = ["fool", "headhunter", "assassin", "thief", "tanner", "pied_piper", "white_wolf"];
  if (wolves.includes(roleId)) return "wolf";
  if (thirdParties.includes(roleId)) return "third_party";
  return "villager";
};

const FACTIONS = [
  { id: "villager", name: "Phe Dân Làng" },
  { id: "wolf", name: "Phe Sói" },
  { id: "third_party", name: "Phe Thứ Ba" },
];

export default function GameConfigPanel({
  roleConfig,
  playersCount,
  hostName,
  playerName,
  gameStarted,
  updateRoleCount,
  applyRolePreset,
  timeSettings,
  updateTimeSettings,
  isNight,
}: GameConfigPanelProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localTimeSettings, setLocalTimeSettings] = useState<TimeSettings>(timeSettings);
  const [activeTab, setActiveTab] = useState<"roles" | "time">("roles");

  const totalRoles = roleConfig.reduce((acc, r) => acc + r.count, 0);

  const handleOpenSheet = () => {
    setLocalTimeSettings(timeSettings);
    setIsSheetOpen(true);
  };

  const handleSaveTimeSettings = () => {
    updateTimeSettings(localTimeSettings);
  };

  const updateSetting = (key: keyof TimeSettings, value: number) => {
    setLocalTimeSettings((prev) => ({
      ...prev,
      [key]: Math.max(5, value),
    }));
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0 && seconds === 0) return `${minutes}p`;
    if (minutes === 0 && seconds > 0) return `${seconds}s`;
    if (minutes === 0 && seconds === 0) return `0s`;
    return `${minutes}p ${seconds}s`;
  };

  const renderTimeInput = (label: string, key: keyof TimeSettings) => {
    const totalSeconds = localTimeSettings[key];
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const PRESETS = [
      { label: "15s", value: 15 },
      { label: "30s", value: 30 },
      { label: "1p", value: 60 },
      { label: "2p", value: 120 },
      { label: "5p", value: 300 },
    ];

    return (
      <div className="flex flex-col space-y-3 mb-4 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
        <label className="text-sm font-bold text-zinc-800">{label}</label>
        
        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => updateSetting(key, preset.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                totalSeconds === preset.value
                  ? "bg-indigo-600 text-white shadow-md scale-105"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Steppers */}
        <div className="flex items-center space-x-4 pt-2">
          {/* Minutes */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Phút</span>
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => updateSetting(key, Math.max(0, minutes - 1) * 60 + seconds)}
                className="px-4 py-2.5 bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border-r border-zinc-200 font-black transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-black text-sm text-zinc-800">{minutes}</span>
              <button 
                onClick={() => updateSetting(key, (minutes + 1) * 60 + seconds)}
                className="px-4 py-2.5 bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border-l border-zinc-200 font-black transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Seconds */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Giây</span>
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => {
                  let newSecs = seconds - 5;
                  let newMins = minutes;
                  if (newSecs < 0) {
                    if (newMins > 0) {
                      newMins -= 1;
                      newSecs = 55;
                    } else {
                      newSecs = 0;
                    }
                  }
                  updateSetting(key, newMins * 60 + newSecs);
                }}
                className="px-4 py-2.5 bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border-r border-zinc-200 font-black transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-black text-sm text-zinc-800">{seconds.toString().padStart(2, "0")}</span>
              <button 
                onClick={() => {
                  let newSecs = seconds + 5;
                  let newMins = minutes;
                  if (newSecs >= 60) {
                    newMins += 1;
                    newSecs -= 60;
                  }
                  updateSetting(key, newMins * 60 + newSecs);
                }}
                className="px-4 py-2.5 bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border-l border-zinc-200 font-black transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center p-2 w-full ${isNight ? "bg-transparent" : "bg-transparent"}`}>
      <div className="mb-4 flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaCog className={isNight ? "text-slate-400" : "text-zinc-500"} />
          <h3 className={`text-sm font-semibold ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
            Cấu hình Trận đấu
          </h3>
        </div>
        {hostName === playerName && !gameStarted && (
          <button
            onClick={handleOpenSheet}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${isNight ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="flex w-full flex-col space-y-4">
        {/* Vai trò Summary */}
        <div className={`flex flex-col space-y-3 rounded-xl border p-4 ${isNight ? "border-slate-600 bg-slate-800/50" : "border-zinc-100 bg-zinc-50/50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaUsers className={isNight ? "text-slate-400" : "text-indigo-500"} />
              <span className={`text-sm font-semibold ${isNight ? "text-slate-300" : "text-zinc-700"}`}>
                Vai trò
              </span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isNight ? "bg-slate-700 text-slate-300" : "bg-indigo-100 text-indigo-700"}`}>
              {totalRoles} / {playersCount}
            </span>
          </div>
          
          {roleConfig.filter(r => r.count > 0).length > 0 ? (
            <div className="flex flex-col space-y-3 mt-2">
              {FACTIONS.map((faction) => {
                const factionRoles = roleConfig.filter((r) => r.count > 0 && getFaction(r.id) === faction.id);
                if (factionRoles.length === 0) return null;
                
                const factionTotal = factionRoles.reduce((sum, r) => sum + r.count, 0);

                return (
                  <div key={faction.id} className="flex flex-col">
                    <div className={`text-[10px] uppercase font-bold mb-1 ${isNight ? "text-slate-400" : faction.id === "villager" ? "text-emerald-600" : faction.id === "wolf" ? "text-red-600" : "text-purple-600"}`}>
                      {faction.name} ({factionTotal})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {factionRoles.map((role) => (
                        <div
                          key={role.id}
                          className={`group relative flex items-center space-x-1.5 rounded-full border px-2 py-1 transition-colors hover:z-[100] ${isNight ? "border-slate-600 bg-slate-700 hover:bg-slate-600" : "border-zinc-200 bg-white hover:bg-zinc-100"}`}
                        >
                          <RoleIcon id={role.id} className={`text-sm ${getRoleColor(role.id)}`} />
                          <span className={`text-xs font-bold ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
                            {role.count}
                          </span>

                          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-40 -translate-x-1/2 rounded bg-zinc-800 px-2 py-1.5 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xl">
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
          ) : (
            <div className="flex-1 flex items-center justify-center py-4">
              <span className={`text-xs italic ${isNight ? "text-slate-500" : "text-zinc-400"}`}>Chưa chọn vai trò</span>
            </div>
          )}

          {hostName === playerName && !gameStarted && totalRoles !== playersCount && (
            <p className="text-xs text-red-500 mt-2 font-medium">* Chưa khớp số lượng người chơi</p>
          )}
        </div>

        {/* Thời gian Summary */}
        <div className={`flex flex-col space-y-3 rounded-xl border p-4 ${isNight ? "border-slate-600 bg-slate-800/50" : "border-zinc-100 bg-zinc-50/50"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <FaClock className={isNight ? "text-slate-400" : "text-indigo-500"} />
            <span className={`text-sm font-semibold ${isNight ? "text-slate-300" : "text-zinc-700"}`}>
              Thời gian
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex flex-col p-2 rounded-lg ${isNight ? "bg-slate-700/50" : "bg-white border border-zinc-100 shadow-sm"}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isNight ? "text-slate-400" : "text-zinc-400"}`}>Thảo luận</span>
              <span className={`text-sm font-black ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
                {formatDisplayTime(timeSettings.discussion)}
              </span>
            </div>
            <div className={`flex flex-col p-2 rounded-lg ${isNight ? "bg-slate-700/50" : "bg-white border border-zinc-100 shadow-sm"}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isNight ? "text-slate-400" : "text-zinc-400"}`}>Biểu quyết</span>
              <span className={`text-sm font-black ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
                {formatDisplayTime(timeSettings.voting)}
              </span>
            </div>
            <div className={`flex flex-col p-2 rounded-lg ${isNight ? "bg-slate-700/50" : "bg-white border border-zinc-100 shadow-sm"}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isNight ? "text-slate-400" : "text-zinc-400"}`}>Biện hộ</span>
              <span className={`text-sm font-black ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
                {formatDisplayTime(timeSettings.defense)}
              </span>
            </div>
            <div className={`flex flex-col p-2 rounded-lg ${isNight ? "bg-slate-700/50" : "bg-white border border-zinc-100 shadow-sm"}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isNight ? "text-slate-400" : "text-zinc-400"}`}>Ban đêm</span>
              <span className={`text-sm font-black ${isNight ? "text-slate-200" : "text-zinc-800"}`}>
                {formatDisplayTime(timeSettings.night)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Cấu hình Trận đấu">
        {/* Tabs */}
        <div className="mb-4 flex space-x-2 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("roles")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "roles" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Vai trò
          </button>
          <button
            onClick={() => setActiveTab("time")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === "time" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Thời gian
          </button>
        </div>

        {activeTab === "roles" && (
          <div className="flex flex-col space-y-3 pb-8">
            {/* Presets */}
            {applyRolePreset && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Gợi ý nhanh:</span>
                <button
                  onClick={() => applyRolePreset({ werewolf: 2, seer: 1, bodyguard: 1, villager: 2 })}
                  className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors border border-indigo-200"
                >
                  6 Người
                </button>
                <button
                  onClick={() => applyRolePreset({ werewolf: 2, seer: 1, bodyguard: 1, hunter: 1, villager: 3 })}
                  className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors border border-indigo-200"
                >
                  8 Người
                </button>
                <button
                  onClick={() => applyRolePreset({ werewolf: 3, seer: 1, bodyguard: 1, hunter: 1, witch: 1, villager: 3 })}
                  className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors border border-indigo-200"
                >
                  10 Người
                </button>
                <button
                  onClick={() => applyRolePreset({ werewolf: 3, seer: 1, bodyguard: 1, hunter: 1, witch: 1, cupid: 1, fool: 1, villager: 3 })}
                  className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors border border-indigo-200"
                >
                  12 Người
                </button>
              </div>
            )}
            
            <p className="text-center text-sm font-medium text-zinc-500 mb-2 border-b border-zinc-100 pb-2">
              Số lượng đang chọn: <span className="font-bold text-zinc-800">{totalRoles}</span> / {playersCount} người
            </p>
            <div className="flex w-full flex-col">
              {FACTIONS.map((faction) => {
                const factionRoles = roleConfig.filter((r) => getFaction(r.id) === faction.id);
                const factionTotal = factionRoles.reduce((sum, r) => sum + r.count, 0);
                if (factionRoles.length === 0) return null;

                return (
                  <div key={faction.id} className="mb-4 last:mb-0">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {faction.name} ({factionTotal})
                    </h4>
                    <div className="flex flex-col space-y-2">
                      {factionRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                          <div className="flex items-center space-x-2">
                            <RoleIcon id={role.id} className={`text-xl ${getRoleColor(role.id)}`} />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-700">{role.name}</span>
                              <span className="text-[10px] text-zinc-500 max-w-[150px] leading-tight">
                                {getRoleDescription(role.id)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateRoleCount(role.id, -1)}
                              disabled={role.count === 0}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-bold text-zinc-800">{role.count}</span>
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
          </div>
        )}

        {activeTab === "time" && (
          <div className="flex flex-col space-y-2 pb-8">
            {renderTimeInput("Thời gian thảo luận Ban ngày", "discussion")}
            {renderTimeInput("Thời gian biểu quyết", "voting")}
            {renderTimeInput("Thời gian biện hộ", "defense")}
            {renderTimeInput("Thời gian hành động Ban đêm (mỗi vai trò)", "night")}
            <button
              onClick={() => {
                handleSaveTimeSettings();
                setActiveTab("roles"); // Switch back or just stay, up to preference
              }}
              className="mt-6 w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Lưu cài đặt thời gian
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
