import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGamepad } from './useGamepad.js';
import { PROMPT_GLYPHS, loadActiveProfile } from './controllerProfiles.js';

// Global prompt provider: components read the active controller family to
// swap keyboard prompts for controller glyphs automatically.
const Ctx = createContext({ family: null, pads: [], using: false });
export const useController = () => useContext(Ctx);

export function ControllerProvider({ children }) {
  const { pads } = useGamepad();
  const family = pads[0]?.family || null;
  const using = pads.length > 0;
  return <Ctx.Provider value={{ family, using, pads }}>{children}</Ctx.Provider>;
}

// <Pad icon={0} fallback="SPACE" /> renders the controller glyph for button index
// `icon` when a controller is connected, otherwise the keyboard `fallback`.
export function Pad({ icon, fallback }) {
  const { family } = useController();
  if (family == null) return <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-heading">{fallback}</kbd>;
  const g = PROMPT_GLYPHS[family]?.[icon] ?? icon;
  return <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-heading min-w-[1.5rem] text-center">{g}</span>;
}