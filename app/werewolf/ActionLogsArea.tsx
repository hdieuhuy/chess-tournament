import { FaMoon, FaSun } from "react-icons/fa";
import { ActionLog, RoleConfig } from "./types";
import { defaultRoles } from "./utils";

type ActionLogsAreaProps = {
  actionLogs: ActionLog[];
  activeLogTab: "night" | "day";
  setActiveLogTab: (tab: "night" | "day") => void;
  playerName: string;
  playerRoles: Record<string, RoleConfig>;
  isNight?: boolean;
};

export default function ActionLogsArea({
  actionLogs,
  activeLogTab,
  setActiveLogTab,
  playerName,
  playerRoles,
  isNight,
}: ActionLogsAreaProps) {
  const visibleLogs = actionLogs.filter((log) => {
    if (log.roleId === "system") return true;
    if (log.playerName === playerName) return true;
    if (
      log.roleId === "werewolf" &&
      (playerRoles[playerName]?.id === "werewolf" ||
        playerRoles[playerName]?.id === "cursed_wolf" ||
        playerRoles[playerName]?.id === "fog_wolf" ||
        playerRoles[playerName]?.id === "wolf_cub")
    )
      return true;
    return false;
  });

  const logsByNight: { [key: number]: ActionLog[] } = {};
  visibleLogs.forEach((log) => {
    if (!logsByNight[log.dayCount]) logsByNight[log.dayCount] = [];
    logsByNight[log.dayCount].push(log);
  });

  // Hàm tự động in đậm tên người chơi trong nội dung log
  const formatLogContent = (content: string) => {
    const playerNames = Object.keys(playerRoles);
    if (!playerNames.length) return content;

    // Sắp xếp tên theo độ dài giảm dần để tránh lỗi bắt chuỗi con (VD: "Nam" và "Nam Phong")
    const sortedNames = [...playerNames].sort((a, b) => b.length - a.length);
    const escapeRegExp = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(${sortedNames.map(escapeRegExp).join("|")})`,
      "g",
    );

    const isDeathLog =
      content.toLowerCase().includes("chết") ||
      content.toLowerCase().includes("treo cổ");

    return content.split(regex).map((part, i) => {
      if (playerNames.includes(part)) {
        return (
          <span
            key={i}
            className={`font-bold ${isDeathLog ? (isNight ? "text-red-400" : "text-red-600") : isNight ? "text-slate-200" : "text-zinc-900"}`}
          >
            {part}
            {part === playerName && (
              <span className="ml-1 text-[11px] font-normal italic opacity-80">
                (Bạn)
              </span>
            )}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`flex h-[300px] flex-col rounded-xl border shadow-sm ${isNight ? "border-slate-700 bg-slate-800" : "border-zinc-200 bg-white"}`}
    >
      <div
        className={`flex flex-col rounded-t-xl border-b ${isNight ? "border-slate-700 bg-slate-800/80" : "border-zinc-100 bg-zinc-50"}`}
      >
        <div className="p-3">
          <h3
            className={`flex items-center text-sm font-bold ${isNight ? "text-slate-200" : "text-zinc-800"}`}
          >
            📜 Nhật ký hành động
          </h3>
        </div>
        <div className="flex">
          <button
            onClick={() => setActiveLogTab("night")}
            className={`flex-1 border-b-2 py-2 text-sm font-bold text-center transition-colors ${activeLogTab === "night" ? (isNight ? "border-indigo-500 bg-indigo-900/30 text-indigo-400" : "border-indigo-600 bg-indigo-50/50 text-indigo-700") : isNight ? "border-transparent text-slate-400 hover:bg-slate-700" : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}
          >
            <FaMoon className="mb-1 mr-2 inline" /> Ban Đêm
          </button>
          <button
            onClick={() => setActiveLogTab("day")}
            className={`flex-1 border-b-2 py-2 text-sm font-bold text-center transition-colors ${activeLogTab === "day" ? (isNight ? "border-amber-500 bg-amber-900/30 text-amber-500" : "border-amber-500 bg-amber-50/50 text-amber-600") : isNight ? "border-transparent text-slate-400 hover:bg-slate-700" : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}
          >
            <FaSun className="mb-1 mr-2 inline" /> Ban Ngày
          </button>
        </div>
      </div>

      <div
        className={`flex-1 space-y-2 overflow-y-auto rounded-b-xl p-4 ${isNight ? "bg-slate-800" : "bg-white"}`}
      >
        {actionLogs.length === 0 && activeLogTab === "day" && (
          <div
            className={`ml-2 text-sm ${isNight ? "text-slate-400" : "text-zinc-600"}`}
          >
            <span className="block text-xs font-semibold text-amber-600">
              (Hệ thống -{" "}
              <span className="font-bold text-amber-700 text-[13px]">
                Quản trò
              </span>
              )
            </span>
            <p className="ml-2 text-xs font-medium">
              - Trò chơi bắt đầu! Hãy kiểm tra thẻ bài của bạn.
            </p>
          </div>
        )}

        {Object.entries(logsByNight).map(
          ([dayStr, logs]: [string, ActionLog[]]) => {
            const nightLogs = logs.filter((l) => l.roleId !== "system");
            const dayLogs = logs.filter((l) => l.roleId === "system");

            if (activeLogTab === "night" && nightLogs.length === 0) return null;
            if (activeLogTab === "day" && dayLogs.length === 0) return null;

            return (
              <div key={dayStr} className="mb-6 space-y-4">
                {activeLogTab === "night" && nightLogs.length > 0 && (
                  <div className="space-y-2">
                    <h4
                      className={`flex items-center border-b pb-1 text-sm font-bold ${isNight ? "border-slate-700 text-indigo-400" : "border-zinc-100 text-indigo-900"}`}
                    >
                      <FaMoon className="mr-2 text-indigo-600" />
                      Đêm {dayStr}
                    </h4>
                    {nightLogs.map((log: ActionLog) => (
                      <div
                        key={log.id}
                        className={`ml-2 text-sm ${isNight ? "text-slate-400" : "text-zinc-600"}`}
                      >
                        {log.roleId === "werewolf" &&
                        log.playerName !== playerName ? (
                          <span className="block text-xs font-semibold text-red-500">
                            ({playerRoles[log.playerName]?.name} -{" "}
                            <span className="font-bold text-red-700 text-[13px]">
                              {log.playerName}
                            </span>
                            {log.playerName === playerName && (
                              <span className="ml-1 text-[11px] font-normal italic opacity-80">
                                (Bạn)
                              </span>
                            )}
                            )
                          </span>
                        ) : (
                          <span className="block text-xs font-semibold text-indigo-500">
                            (
                            {
                              defaultRoles.find((r) => r.id === log.roleId)
                                ?.name
                            }{" "}
                            -{" "}
                            <span className="font-bold text-indigo-700 text-[13px]">
                              {log.playerName}
                            </span>
                            {log.playerName === playerName && (
                              <span className="ml-1 text-[11px] font-normal italic opacity-80">
                                (Bạn)
                              </span>
                            )}
                            )
                          </span>
                        )}
                        <p className="ml-2 text-xs font-medium">
                          - {formatLogContent(log.content)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeLogTab === "day" && dayLogs.length > 0 && (
                  <div className="space-y-2">
                    <h4
                      className={`flex items-center border-b pb-1 text-sm font-bold ${isNight ? "border-slate-700 text-amber-500" : "border-zinc-100 text-amber-600"}`}
                    >
                      <FaSun className="mr-2 text-amber-500" /> Ngày {dayStr}
                    </h4>
                    {dayLogs.map((log: ActionLog) => (
                      <div
                        key={log.id}
                        className={`ml-2 text-sm ${isNight ? "text-slate-400" : "text-zinc-600"}`}
                      >
                        <span className="block text-xs font-semibold text-amber-600">
                          (Hệ thống -{" "}
                          <span className="font-bold text-amber-700 text-[13px]">
                            Quản trò
                          </span>
                          )
                        </span>
                        <p className="ml-2 text-xs font-medium">
                          - {formatLogContent(log.content)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
