export type RoleConfig = {
  id: string;
  name: string;
  count: number;
};

export type ActionLog = {
  id: string;
  dayCount: number;
  roleId: string;
  playerName: string;
  content: string;
};

export type ChatMessage = {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
};

export type GameState = {
  hostName: string | null;
  players: string[];
  spectators: string[];
  gameStarted: boolean;
  roleConfig: RoleConfig[];
  playerRoles: Record<string, RoleConfig>;
  originalRoles: Record<string, RoleConfig>;
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
  wolfVotes: Record<string, string[]>;
  wolfVictim: string[];
  hunterTarget: string | null;
  witchAction: { heal: string[]; poison: string | null };
  deadThisNight: string[];
  nightSelection: string | null;
  actionConfirmed: boolean;
  seerResult: { name: string; isWolf: boolean } | null;
  actionLogs: ActionLog[];
  nightPhase: string | null;
  nightTimeLeft: number;
  confirmedPlayers: string[];
  wolfChat: ChatMessage[];
  loversChat: ChatMessage[];
  generalChat: ChatMessage[];
  winner:
    | "wolves"
    | "villagers"
    | "white_wolf"
    | "fool"
    | "headhunter"
    | "assassin"
    | "lovers"
    | "pied_piper"
    | null;
  extraLives: Record<string, number>;
  cursedWolfUsed: boolean;
  infectedPlayer: string | null;
  fogWolfUsed: boolean;
  whiteWolfVictim: string | null;
  headhunterTarget: string | null;
  assassinTarget: string | null;
  cupidTargets: [string, string] | null;
  mediumUsed: boolean;
  mediumResurrect: string | null;
  hypnotizedPlayers: string[];
  extraWolfKill: boolean;
  activeExtraWolfKill: boolean;
  elderDied: boolean;
  timeSettings: {
    discussion: number;
    voting: number;
    defense: number;
    night: number;
  };
};

export type GameAction =
  | { type: "UPDATE"; payload: Partial<GameState> }
  | {
      type: "UPDATE_FUNCTION";
      payload: (state: GameState) => Partial<GameState>;
    };
