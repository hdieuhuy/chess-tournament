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
