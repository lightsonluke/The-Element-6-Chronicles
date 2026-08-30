import React from 'react';
import {
  UilAngleDown, UilAngleLeft, UilAngleRight, UilAngleUp,
  UilArrowDown, UilArrowLeft, UilArrowRight, UilArrowUp,
  UilCheck, UilGlobe, UilPause, UilPlay, UilSearch, UilTimes,
  UilTrophy, UilUser, UilCoins,
} from '@iconscout/react-unicons';

// IconScout's React Unicons stay inside the same fixed inline box that the
// legacy emoji used. Replacing an icon therefore never changes a button's
// width, text baseline, or surrounding layout.
const EMOJI_MAP = Object.freeze({
  '←': UilArrowLeft, '→': UilArrowRight, '↑': UilArrowUp, '↓': UilArrowDown,
  '‹': UilAngleLeft, '›': UilAngleRight, '⌄': UilAngleDown, '⌃': UilAngleUp,
  '✕': UilTimes, '×': UilTimes, '✓': UilCheck, '✔': UilCheck,
  '▶': UilPlay, '⏸': UilPause, '⏯': UilPause, '🔍': UilSearch,
  '🏆': UilTrophy, '👑': UilTrophy, '🌍': UilGlobe, '👤': UilUser,
  '◆': UilCoins, '◇': UilCoins,
});

export default function GameIcon({ emoji = '', size = 16, color = 'currentColor', className = '', style = {} }) {
  const Icon = EMOJI_MAP[emoji];
  if (!Icon) return <span aria-hidden="true" className={`el6-game-icon inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`} style={{ width: size, height: size, ...style }} />;
  return <span aria-hidden="true" className={`el6-game-icon inline-flex shrink-0 items-center justify-center align-middle leading-none ${className}`} style={{ width: size, height: size, ...style }}><Icon size={size} color={color} /></span>;
}

export { EMOJI_MAP };
