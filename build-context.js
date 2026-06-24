const fs = require('fs');
const logic = fs.readFileSync('features/exploding-kittens/contexts/logic.txt', 'utf8');

// Find all useState
const useStateRegex = /const \[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]\s*=\s*useState(?:<([^>]+)>)?\(([\s\S]*?)\);/g;
let match;
const states = [];
while ((match = useStateRegex.exec(logic)) !== null) {
  states.push({
    name: match[1],
    setter: match[2],
    type: match[3] || 'any',
  });
}

// Build Context Type
let contextTypeStr = 'export interface ExplodingKittensContextType {\n';
contextTypeStr += '  roomId: string | null;\n';
contextTypeStr += '  playerName: string;\n';
contextTypeStr += '  requestedRole: "player" | "spectator";\n';
contextTypeStr += '  hasInitialized: boolean;\n';
contextTypeStr += '  isCreator: boolean;\n';

for (const s of states) {
    if (s.name === 'roomId' || s.name === 'playerName' || s.name === 'requestedRole' || s.name === 'hasInitialized' || s.name === 'inputName' || s.name === 'showNameModal' || s.name === 'showRulesModal' || s.name === 'isCheckingStorage' || s.name === 'linkCopied') continue;
  contextTypeStr += `  ${s.name}: ${s.type};\n`;
  contextTypeStr += `  ${s.setter}: React.Dispatch<React.SetStateAction<${s.type}>>;\n`;
}

// Find all functions (like handleDefuse, playCard, etc.)
// A simple way is to just export everything that looks like a function assigned to a const, but it's hard to parse.
// Instead, let's just manually export the known ones or export the whole state, and let components use the setters.
// But some functions like `drawCard`, `playCard`, `handleDefuse`, `handlePlaySelected`, `handleResolveAction`, `handleNope`, `passTurn` are very important.
const funcs = ['drawCard', 'playCard', 'handleDefuse', 'handlePlaySelected', 'handleResolveAction', 'handleNope', 'passTurn', 'startGame', 'readyUp', 'resetGame', 'leaveRoom', 'kickPlayer', 'handleAlterFuture'];

for (const f of funcs) {
  contextTypeStr += `  ${f}: (...args: any[]) => void;\n`;
}

contextTypeStr += '}\n\n';

let output = `import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { CardInstance, CardType } from "../types";
import { dealCards, shuffle } from "../utils/game-logic";
import confetti from "canvas-confetti";

${contextTypeStr}

const ExplodingKittensContext = createContext<ExplodingKittensContextType | undefined>(undefined);

export const useExplodingKittens = () => {
  const context = useContext(ExplodingKittensContext);
  if (!context) throw new Error("useExplodingKittens must be used within ExplodingKittensProvider");
  return context;
};

export const ExplodingKittensProvider: React.FC<{
  children: React.ReactNode;
  roomId: string | null;
  playerName: string;
  requestedRole: "player" | "spectator";
  hasInitialized: boolean;
  isCreator: boolean;
}> = ({ children, roomId, playerName, requestedRole, hasInitialized, isCreator }) => {
`;

// Now we need to append the logic, BUT we must strip out the useStates for roomId, playerName, etc. since they are props.
let logicClean = logic;
// Strip lines 1 to 49 (imports and router stuff)
// Also strip useLobbyInit overlapping states.
logicClean = logicClean.replace(/const searchParams[\s\S]*?const \[isCheckingStorage.*?;\n/g, '');
logicClean = logicClean.replace(/import .*?;\n/g, '');
logicClean = logicClean.replace(/const generateId[\s\S]*?ExplodingKittensGame\(\) \{/g, '');
logicClean = logicClean.replace(/const myHand = playerHands\[playerName\] \|\| \[\];/g, 'const myHand = playerHands[playerName] || [];');

output += logicClean;

output += `
  const value: ExplodingKittensContextType = {
    roomId,
    playerName,
    requestedRole,
    hasInitialized,
    isCreator,
`;

for (const s of states) {
    if (s.name === 'roomId' || s.name === 'playerName' || s.name === 'requestedRole' || s.name === 'hasInitialized' || s.name === 'inputName' || s.name === 'showNameModal' || s.name === 'showRulesModal' || s.name === 'isCheckingStorage' || s.name === 'linkCopied') continue;
  output += `    ${s.name},\n    ${s.setter},\n`;
}

for (const f of funcs) {
  output += `    ${f},\n`;
}

output += `  };

  return (
    <ExplodingKittensContext.Provider value={value}>
      {children}
    </ExplodingKittensContext.Provider>
  );
};
`;

fs.writeFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', output);
