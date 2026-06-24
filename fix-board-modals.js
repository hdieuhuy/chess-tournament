const fs = require('fs');
let content = fs.readFileSync('features/exploding-kittens/components/exploding-kittens-board.tsx', 'utf8');

// Remove handleJoinRoom Modal
content = content.replace(/<Modal isOpen=\{!hasInitialized(?:[\s\S]*?)<\/Modal>/, '');

// Remove showRulesModal Modal
content = content.replace(/<Modal isOpen=\{showRulesModal\}(?:[\s\S]*?)<\/Modal>/, '');

// Remove Game Setup UI (Link share, etc.) which is already handled by Lobby
content = content.replace(/\{!gameStarted && \((?:[\s\S]*?)Mời người chơi(?:[\s\S]*?)<\/div>\n          \)\}/, '');

// The Modal component definition has `title` error:
content = content.replace(/function Modal\(\{ isOpen, children, onClose \}: \{ isOpen: boolean; children: React.ReactNode; onClose\?: \(\) => void \}\) \{/, 'function Modal({ isOpen, children, onClose, title }: { isOpen: boolean; children: React.ReactNode; onClose?: () => void; title?: string }) {');

// Fix toast
content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport toast from 'react-hot-toast';\nimport { CardType } from '../types';");

// Export setActionLog and executeComboAction
content = content.replace(/  const toggleCardSelection/g, '  const { setActionLog, setAlterCards, setIsAlteringFuture, setDrawPile, channel, executeComboAction } = useExplodingKittens();\n  const toggleCardSelection');

fs.writeFileSync('features/exploding-kittens/components/exploding-kittens-board.tsx', content);
