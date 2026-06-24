import { GameState, GameAction } from "../types";
import { defaultRoles } from "../utils";

export const initialGameState: GameState = {
  hostName: null,
  players: [],
  spectators: [],
  gameStarted: false,
  roleConfig: defaultRoles,
  playerRoles: {},
  originalRoles: {},
  phase: "lobby",
  dayPhase: null,
  dayTimeLeft: 0,
  dayVotes: {},
  accusedPlayer: null,
  executionVotes: {},
  dayCount: 0,
  alivePlayers: [],
  lastProtected: null,
  witchPotions: { heal: 1, poison: 1 },
  wolfVotes: {},
  wolfVictim: [],
  hunterTarget: null,
  currentMayor: null,
  pendingMayorTransfer: null,
  nextPhaseAfterMayorTransfer: null,
  witchAction: { heal: [], poison: null },
  deadThisNight: [],
  nightSelection: null,
  actionConfirmed: false,
  seerResult: null,
  actionLogs: [],
  nightPhase: null,
  nightTimeLeft: 0,
  confirmedPlayers: [],
  wolfChat: [],
  loversChat: [],
  generalChat: [],
  winner: null,
  extraLives: {},
  cursedWolfUsed: false,
  infectedPlayer: null,
  fogWolfUsed: false,
  whiteWolfVictim: null,
  headhunterTarget: null,
  assassinTarget: null,
  cupidTargets: null,
  mediumUsed: false,
  mediumResurrect: null,
  hypnotizedPlayers: [],
  extraWolfKill: false,
  activeExtraWolfKill: false,
  elderDied: false,
  judgeAbilityUsed: false,
  activeJudgeExtraVote: false,
  timeSettings: {
    discussion: 480,
    voting: 45,
    defense: 90,
    night: 60,
  },
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "UPDATE_FUNCTION":
      return { ...state, ...action.payload(state) };
    default:
      return state;
  }
}
