"use client";

import React, { createContext, useContext, useReducer, useState, useRef, useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { GameState, GameAction } from "../types";
import { initialGameState, gameReducer } from "../store/werewolf-store";
import { generateId } from "../utils/helpers";

export type WerewolfContextType = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  channel: RealtimeChannel | null;
  setChannel: React.Dispatch<React.SetStateAction<RealtimeChannel | null>>;
  playerName: string;
  setPlayerName: React.Dispatch<React.SetStateAction<string>>;
  roomId: string | null;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  requestedRole: "player" | "spectator";
  setRequestedRole: React.Dispatch<React.SetStateAction<"player" | "spectator">>;
  hasInitialized: boolean;
  setHasInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  executeAction: (
    logContent: string | null,
    stateUpdates: Partial<GameState>,
    broadcastEvent?: { name: string; payload: any }
  ) => void;
  // refs for hooks
  stateRef: React.MutableRefObject<GameState>;
  playerNameRef: React.MutableRefObject<string>;
};

const WerewolfContext = createContext<WerewolfContextType | undefined>(undefined);

export const WerewolfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [requestedRole, setRequestedRole] = useState<"player" | "spectator">("player");
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const playerNameRef = useRef(playerName);
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const executeAction = (
    logContent: string | null,
    stateUpdates: Partial<GameState>,
    broadcastEvent?: { name: string; payload: any }
  ) => {
    const updates = { ...stateUpdates, actionConfirmed: true };
    dispatch({ type: "UPDATE", payload: updates });

    if (logContent) {
      const log = {
        id: generateId(),
        dayCount: stateRef.current.dayCount,
        roleId: stateRef.current.playerRoles[playerName]?.id || "unknown",
        playerName,
        content: logContent,
      };
      dispatch({
        type: "UPDATE_FUNCTION",
        payload: (prev) => ({ actionLogs: [...prev.actionLogs, log] }),
      });
      if (channel) {
        channel.send({
          type: "broadcast",
          event: "add-log",
          payload: { log },
        });
      }
    }

    if (channel && broadcastEvent) {
      channel.send({
        type: "broadcast",
        event: broadcastEvent.name,
        payload: broadcastEvent.payload,
      });
    }

    dispatch({
      type: "UPDATE_FUNCTION",
      payload: (prev) => ({
        confirmedPlayers: [...new Set([...prev.confirmedPlayers, playerName])],
      }),
    });
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "player-confirm",
        payload: { playerName },
      });
    }
  };

  return (
    <WerewolfContext.Provider
      value={{
        gameState,
        dispatch,
        channel,
        setChannel,
        playerName,
        setPlayerName,
        roomId,
        setRoomId,
        requestedRole,
        setRequestedRole,
        hasInitialized,
        setHasInitialized,
        executeAction,
        stateRef,
        playerNameRef,
      }}
    >
      {children}
    </WerewolfContext.Provider>
  );
};

export const useWerewolf = () => {
  const context = useContext(WerewolfContext);
  if (!context) {
    throw new Error("useWerewolf must be used within a WerewolfProvider");
  }
  return context;
};
