import React, { useCallback } from 'react';
import GameIcon from "./GameIcon.jsx";

/**
 * On-screen touch controls for mobile mode.
 * Renders a D-pad (left side) and action buttons (right side) as a fixed overlay.
 * Dispatches synthetic KeyboardEvents so all existing game components work unchanged.
 */
export default function TouchControls({ keybinds }) {
  const kb = keybinds || {};

  const makeHandlers = useCallback((key) => {
    if (!key) return {};
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (_) { /* ignore */ }
        window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      },
      onPointerUp: (e) => {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      },
      onPointerCancel: () => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      },
      onPointerLeave: () => {
        window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      },
    };
  }, []);

  const dpadBtn = "w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xl active:bg-white/40 select-none touch-none";
  const actionBtn = (color) => `w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full ${color} border-2 border-white/30 text-white font-heading text-[9px] sm:text-[10px] active:scale-90 active:brightness-125 select-none touch-none`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex justify-between items-end pb-3 sm:pb-4 px-2 sm:px-4">
        {/* D-pad — cross layout */}
        <div className="pointer-events-auto">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <div />
            <button className={dpadBtn} {...makeHandlers(kb.jump)}><GameIcon emoji="↑" size={14} /></button>
            <div />
            <button className={dpadBtn} {...makeHandlers(kb.left)}><GameIcon emoji="←" size={14} /></button>
            <div />
            <button className={dpadBtn} {...makeHandlers(kb.right)}><GameIcon emoji="→" size={14} /></button>
            <div />
            <button className={dpadBtn} {...makeHandlers(kb.down)}><GameIcon emoji="↓" size={14} /></button>
            <div />
          </div>
        </div>

        {/* Action buttons — diamond layout */}
        <div className="pointer-events-auto">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <div />
            <button className={actionBtn('bg-green-600/75')} {...makeHandlers(kb.power)}>PWR</button>
            <div />
            <button className={actionBtn('bg-blue-600/75')} {...makeHandlers(kb.sig)}>SIG</button>
            <div />
            <button className={actionBtn('bg-red-600/75')} {...makeHandlers(kb.heavy)}>HVY</button>
            <div />
            <button className={actionBtn('bg-purple-600/85')} {...makeHandlers(kb.superMove)}>SUP</button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
}