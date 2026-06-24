import { RoleConfig, GameState } from "../types";

export const getNextNightPhase = (
  currentPhase: string | null,
  roles: Record<string, RoleConfig>,
  dayCount: number,
): string | null => {
  const nightPhaseOrder = [
    "cupid",
    "bodyguard",
    "werewolf",
    "cursed_wolf",
    "white_wolf",
    "assassin",
    "seer",
    "medium",
    "pied_piper",
    "witch",
    "hunter",
  ];
  const startIndex = currentPhase
    ? nightPhaseOrder.indexOf(currentPhase) + 1
    : 0;
  for (let i = startIndex; i < nightPhaseOrder.length; i++) {
    const role = nightPhaseOrder[i];
    if (role === "cupid" && dayCount > 1) {
      continue;
    }
    if (role === "white_wolf" && (dayCount < 2 || dayCount % 2 !== 0)) {
      continue;
    }
    const hasRoleInGame = Object.values(roles).some(
      (r) =>
        r?.id === role ||
        (role === "werewolf" &&
          (r?.id === "cursed_wolf" ||
            r?.id === "fog_wolf" ||
            r?.id === "wolf_cub")),
    );
    if (hasRoleInGame) return role;
  }
  return null;
};

export const checkWinCondition = (
  alivePlayers: string[],
  playerRoles: Record<string, RoleConfig>,
  cupidTargets: [string, string] | null,
  hypnotizedPlayers: string[],
): GameState["winner"] => {
  const getFaction = (p: string) => {
    const rId = playerRoles[p]?.id || "";
    if (["werewolf", "cursed_wolf", "fog_wolf", "wolf_cub", "lycan"].includes(rId))
      return "wolf";
    if (
      ["assassin", "fool", "headhunter", "pied_piper", "white_wolf"].includes(
        rId,
      )
    )
      return "third_party";
    return "villager";
  };

  if (
    alivePlayers.length === 1 &&
    playerRoles[alivePlayers[0]]?.id === "white_wolf"
  ) {
    return "white_wolf";
  }

  const piedPipers = alivePlayers.filter(
    (p) => playerRoles[p]?.id === "pied_piper",
  );
  if (piedPipers.length > 0) {
    const unhypnotizedAlive = alivePlayers.filter(
      (p) =>
        playerRoles[p]?.id !== "pied_piper" && !hypnotizedPlayers.includes(p),
    );
    if (unhypnotizedAlive.length === 0) {
      return "pied_piper";
    }
  }

  if (cupidTargets) {
    const [l1, l2] = cupidTargets;
    const loversAlive = alivePlayers.includes(l1) && alivePlayers.includes(l2);
    if (loversAlive && getFaction(l1) !== getFaction(l2)) {
      if (alivePlayers.length === 2) return "lovers";
      return null;
    }
  }

  const assassinAlive = alivePlayers.some(
    (p) => playerRoles[p]?.id === "assassin",
  );
  if (assassinAlive && alivePlayers.length <= 2) return "assassin";

  const wolfCount = alivePlayers.filter((p) => getFaction(p) === "wolf").length;
  const villagerCount = alivePlayers.filter(
    (p) => getFaction(p) === "villager",
  ).length;
  const whiteWolfAlive = alivePlayers.some(
    (p) => playerRoles[p]?.id === "white_wolf",
  );

  if (whiteWolfAlive) return null;
  if (wolfCount === 0 && !assassinAlive) return "villagers";
  if (wolfCount >= villagerCount && !assassinAlive) return "wolves";
  return null;
};
