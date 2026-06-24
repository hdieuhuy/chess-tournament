const fs = require('fs');
let board = fs.readFileSync('features/exploding-kittens/components/exploding-kittens-board.tsx', 'utf8');

// Add missing imports
board = board.replace(/import \{ IoWarningOutline \} from 'react-icons\/io5';/,
\`import { IoWarningOutline } from 'react-icons/io5';
import { FaGhost, FaCrown, FaCheckCircle, FaTimesCircle, FaPlay, FaArrowLeft, FaScroll, FaEye } from "react-icons/fa";
import { GiSwordClash } from "react-icons/gi";
import Link from 'next/link';
import { CARD_DEFINITIONS } from '../constants';
import { CardInstance } from '../types';

function Modal({ isOpen, children, onClose }: { isOpen: boolean; children: React.ReactNode; onClose?: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}\`);

// Add myHand, toggleCardSelection
board = board.replace('  const {',
\`  const { actionLog, spectators, hostName, handleResetGame, handleStartGame, linkCopied, direction, getNextAlivePlayerIndexState, setLinkCopied,\`);

board = board.replace('} = useExplodingKittens();',
`} = useExplodingKittens();
  const myHand = playerHands[playerName] || [];

  const toggleCardSelection = (cardId: string) => {
    const isSelected = selectedHandCards.some((c) => c.id === cardId);
    if (isSelected) {
      setSelectedHandCards(selectedHandCards.filter((c) => c.id !== cardId));
    } else {
      const card = myHand.find((c) => c.id === cardId);
      if (card) setSelectedHandCards([...selectedHandCards, card]);
    }
  };
`);

// Types for callbacks
board = board.replace(/\(\(c\)/g, '((c: CardInstance)');
board = board.replace(/\(\(s, i\)/g, '((s: string, i: number)');
board = board.replace(/\(\(log, idx\)/g, '((log: string, idx: number)');
board = board.replace(/\(cardInstance, localIdx\)/g, '(cardInstance: CardInstance, localIdx: number)');

fs.writeFileSync('features/exploding-kittens/components/exploding-kittens-board.tsx', board);
