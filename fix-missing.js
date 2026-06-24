const fs = require('fs');
let content = fs.readFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', 'utf8');

const missingFields = [
  'playerHands', 'setPlayerHands',
  'targetSelectMode', 'setTargetSelectMode',
  'pendingAction', 'setPendingAction',
  'bombAlert', 'setBombAlert',
  'linkCopied', 'setLinkCopied',
  'getNextAlivePlayerIndexState',
  'handleAlterFuture',
  'executeComboAction'
];

let interfaceAdd = '';
let valueAdd = '';

for (const field of missingFields) {
  if (!content.includes(`  ${field}: `)) {
    if (field === 'playerHands') interfaceAdd += '  playerHands: Record<string, CardInstance[]>;\n';
    else if (field === 'setPlayerHands') interfaceAdd += '  setPlayerHands: React.Dispatch<React.SetStateAction<Record<string, CardInstance[]>>>;\n';
    else if (field === 'targetSelectMode') interfaceAdd += '  targetSelectMode: "favor" | "combo2" | "combo3" | "combo5" | "targeted-attack" | null;\n';
    else if (field === 'setTargetSelectMode') interfaceAdd += '  setTargetSelectMode: React.Dispatch<React.SetStateAction<"favor" | "combo2" | "combo3" | "combo5" | "targeted-attack" | null>>;\n';
    else if (field === 'pendingAction') interfaceAdd += '  pendingAction: any;\n';
    else if (field === 'setPendingAction') interfaceAdd += '  setPendingAction: any;\n';
    else if (field === 'bombAlert') interfaceAdd += '  bombAlert: any;\n';
    else if (field === 'setBombAlert') interfaceAdd += '  setBombAlert: any;\n';
    else if (field === 'linkCopied') interfaceAdd += '  linkCopied: boolean;\n';
    else if (field === 'setLinkCopied') interfaceAdd += '  setLinkCopied: any;\n';
    else if (field === 'getNextAlivePlayerIndexState') interfaceAdd += '  getNextAlivePlayerIndexState: any;\n';
    else if (field === 'handleAlterFuture') interfaceAdd += '  handleAlterFuture: any;\n';
    else if (field === 'executeComboAction') interfaceAdd += '  executeComboAction: any;\n';
  }
  
  if (!content.includes(`    ${field},`)) {
    valueAdd += `    ${field},\n`;
  }
}

content = content.replace('export interface ExplodingKittensContextType {', 'export interface ExplodingKittensContextType {\n' + interfaceAdd);
content = content.replace('  const value: ExplodingKittensContextType = {', '  const value: ExplodingKittensContextType = {\n' + valueAdd);

fs.writeFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', content);
