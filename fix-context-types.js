const fs = require('fs');
let content = fs.readFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', 'utf8');

// The incorrect functions
const incorrect = ['drawCard', 'playCard', 'handleDefuse', 'handleResolveAction', 'handleNope', 'passTurn', 'startGame', 'readyUp', 'resetGame', 'leaveRoom', 'kickPlayer', 'handleAlterFuture'];

// Remove incorrect from Interface
for (const f of incorrect) {
    content = content.replace(new RegExp(`  ${f}: \\(\\.\\.\\.args: any\\[\\]\\) => void;\\n`, 'g'), '');
}

// Remove incorrect from value object
for (const f of incorrect) {
    content = content.replace(new RegExp(`    ${f},\\n`, 'g'), '');
}

// The correct functions
const correct = ['handleDrawCard', 'handlePlaceBomb', 'handlePlaceImplodingKitten', 'handlePlaySelected', 'handlePlayNope', 'handlePlayCard', 'handleSelectTarget', 'handleGiveFavorCard', 'handleStartGame', 'handleResetGame'];

let interfaceToAdd = '';
let valueToAdd = '';
for (const f of correct) {
    if (!content.includes(`  ${f}: (...args: any[]) => void;`)) {
        interfaceToAdd += `  ${f}: (...args: any[]) => void;\n`;
    }
    if (!content.includes(`    ${f},`)) {
        valueToAdd += `    ${f},\n`;
    }
}

// Inject
content = content.replace('export interface ExplodingKittensContextType {', 'export interface ExplodingKittensContextType {\n' + interfaceToAdd);
content = content.replace('  const value: ExplodingKittensContextType = {', '  const value: ExplodingKittensContextType = {\n' + valueToAdd);

fs.writeFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', content);
