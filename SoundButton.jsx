// Reusable sound-enabled button + hook. Plays hover/click sfx automatically.
// Drop <SoundButton> anywhere instead of <button> for instant UI audio polish.
import React from 'react';
import { sfx } from './sfx.js';

export function useUISound() {
  return {
    hover: () => sfx.hover(),
    click: () => sfx.click(),
    success: () => sfx.purchaseSuccess(),
    fail: () => sfx.purchaseFailed(),
    locked: () => sfx.locked(),
    select: () => sfx.characterSelect(),
    open: () => sfx.menuOpen(),
    close: () => sfx.menuClose(),
    notify: () => sfx.notification(),
    warn: () => sfx.warning(),
    xp: () => sfx.xpGain(),
    reward: () => sfx.battlePassReward(),
    matchFound: () => sfx.matchFound(),
    victory: () => sfx.matchVictory(),
    defeat: () => sfx.matchDefeat(),
    countdown: () => sfx.countdown(),
  };
}

export default function SoundButton({ children, onClick, onMouseEnter, sound = 'click', className = '', disabled = false, ...props }) {
  const ui = useUISound();
  const handleEnter = (e) => { if (!disabled) sfx.hover(); onMouseEnter?.(e); };
  const handleClick = (e) => {
    if (disabled) { sfx.locked(); return; }
    if (sound && ui[sound]) ui[sound]();
    else sfx.click();
    onClick?.(e);
  };
  return (
    <button {...props} disabled={disabled} onMouseEnter={handleEnter} onClick={handleClick} className={className}>
      {children}
    </button>
  );
}