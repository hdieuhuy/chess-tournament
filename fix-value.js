const fs = require('fs');
let content = fs.readFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', 'utf8');

const missingFields = [
  'setAlterCards',
  'setIsAlteringFuture',
  'setDrawPile',
  'channel',
  'setActionLog',
  'isAlteringFuture',
  'alterCards',
  'drawPile'
];

let valueAdd = '';
for (const field of missingFields) {
  if (!content.includes(`    ${field},`)) {
    valueAdd += `    ${field},\n`;
  }
}

content = content.replace('  const value: ExplodingKittensContextType = {', '  const value: ExplodingKittensContextType = {\n' + valueAdd);

fs.writeFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', content);
