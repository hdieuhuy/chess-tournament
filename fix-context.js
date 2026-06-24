const fs = require('fs');
let content = fs.readFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', 'utf8');

// Remove handleJoinRoom and its useEffect
content = content.replace(/  useEffect\(\(\) => \{\n    const savedName = localStorage\.getItem\("playerName"\);[\s\S]*?  \}, \[pathname, roomParam, router\]\);\n\n/g, '');
content = content.replace(/  const handleJoinRoom = \(e: React\.FormEvent\) => \{[\s\S]*?  \};\n\n/g, '');

fs.writeFileSync('features/exploding-kittens/contexts/exploding-kittens-context.tsx', content);
