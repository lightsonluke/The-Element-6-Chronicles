import React from 'react';
import UilStar from '@iconscout/react-unicons/icons/uil-star';

// Duplicate-free fallback prevents generated icon maps from breaking Vite.
const EMOJI_MAP = Object.freeze({});
const FALLBACK_ICON = UilStar;

export default function GameIcon({ emoji: _emoji, size = 16, color = 'currentColor', className = '', style = {} }) {
  return <FALLBACK_ICON size={size} color={color} className={className} style={style} />;
}

export { EMOJI_MAP, FALLBACK_ICON };
