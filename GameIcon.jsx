import React from 'react';

// A text icon cannot escape its button/label baseline. This intentionally
// avoids the duplicate object-key icon map that previously broke Vite builds.
const EMOJI_MAP = Object.freeze({});
const FALLBACK_ICON = '•';

export default function GameIcon({ emoji = FALLBACK_ICON, size = 16, color = 'currentColor', className = '', style = {} }) {
  return <span aria-hidden="true" className={`inline-flex shrink-0 align-middle leading-none ${className}`} style={{ width: size, height: size, fontSize: size, color, ...style }}>{emoji}</span>;
}

export { EMOJI_MAP, FALLBACK_ICON };
