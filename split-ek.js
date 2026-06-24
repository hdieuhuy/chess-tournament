const fs = require('fs');
const pagePath = 'app/exploding-kittens/page.tsx';
const content = fs.readFileSync(pagePath, 'utf8');

const lines = content.split('\n');

const logicStart = 0;
const logicEnd = 1608;

const uiStart = 1608;
const uiEnd = 2788;

const logicLines = lines.slice(logicStart, logicEnd);
const uiLines = lines.slice(uiStart, uiEnd);

fs.writeFileSync('features/exploding-kittens/contexts/logic.txt', logicLines.join('\n'));
fs.writeFileSync('features/exploding-kittens/components/ui.txt', uiLines.join('\n'));
