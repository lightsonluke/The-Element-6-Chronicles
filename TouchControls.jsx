import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameIcon from './GameIcon.jsx';
import { normalizeMobileControls } from './mobileControls.js';

function keyName(key) {
  if (key === ' ') return 'Space';
  return key;
}

function dispatchKey(key, down) {
  if (!key) return;
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
    key: keyName(key), code: key === ' ' ? 'Space' : undefined, bubbles: true,
  }));
}

export default function TouchControls({ keybinds, settings = {} }) {
  const kb = keybinds || {};
  const controls = normalizeMobileControls(settings.mobileControls);
  const activeKeys = useRef(new Set());
  const joystickRef = useRef(null);
  const dynamicOriginRef = useRef(null);
  const [dynamicOrigin, setDynamicOrigin] = useState(null);

  const press = useCallback((key) => {
    if (!key || activeKeys.current.has(key)) return;
    activeKeys.current.add(key);
    dispatchKey(key, true);
  }, []);
  const release = useCallback((key) => {
    if (!key || !activeKeys.current.has(key)) return;
    activeKeys.current.delete(key);
    dispatchKey(key, false);
  }, []);
  const releaseAll = useCallback(() => {
    [...activeKeys.current].forEach(release);
  }, [release]);

  useEffect(() => () => releaseAll(), [releaseAll]);

  const buttonHandlers = useCallback((key) => ({
    onPointerDown: e => {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
      press(key);
    },
    onPointerUp: e => { e.preventDefault(); release(key); },
    onPointerCancel: () => release(key),
    onPointerLeave: () => release(key),
  }), [press, release]);

  const updateJoystick = useCallback((clientX, clientY) => {
    const el = joystickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const origin = dynamicOriginRef.current || dynamicOrigin || { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    const dead = Math.max(10, rect.width * 0.14);
    const horizontal = Math.abs(dx) > dead ? (dx > 0 ? kb.right : kb.left) : null;
    const vertical = Math.abs(dy) > dead ? (dy > 0 ? kb.down : kb.jump) : null;
    [kb.left, kb.right, kb.down, kb.jump].forEach(k => {
      if (!k) return;
      if (k === horizontal || k === vertical) press(k); else release(k);
    });
  }, [dynamicOrigin, kb, press, release]);

  const joystickHandlers = {
    onPointerDown: e => {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
      if (controls.joystickDynamic) { const origin = { x: e.clientX, y: e.clientY }; dynamicOriginRef.current = origin; setDynamicOrigin(origin); }
      updateJoystick(e.clientX, e.clientY);
    },
    onPointerMove: e => { if (e.currentTarget.hasPointerCapture?.(e.pointerId)) { e.preventDefault(); updateJoystick(e.clientX, e.clientY); } },
    onPointerUp: e => { e.preventDefault(); release(kb.left); release(kb.right); release(kb.jump); release(kb.down); dynamicOriginRef.current = null; setDynamicOrigin(null); },
    onPointerCancel: () => { release(kb.left); release(kb.right); release(kb.jump); release(kb.down); dynamicOriginRef.current = null; setDynamicOrigin(null); },
  };

  const buttonStyle = item => ({
    position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size,
    transform: 'translate(-50%, -50%)', opacity: item.opacity, zIndex: 2,
  });
  const actionStyle = (item, color) => ({ ...buttonStyle(item), backgroundColor: color });
  const dpadBtn = 'flex items-center justify-center rounded-xl backdrop-blur-sm border border-white/25 text-white text-xl active:bg-white/40 select-none touch-none';
  const actionBtn = 'flex items-center justify-center rounded-full border-2 border-white/30 text-white font-heading text-[9px] active:scale-90 select-none touch-none';

  const b = controls.buttons;
  return (
    <div className="fixed inset-0 z-[80] pointer-events-none select-none" style={{ touchAction: 'none' }}>
      {controls.mode === 'joystick' ? (
        <div ref={joystickRef} {...joystickHandlers} className="pointer-events-auto rounded-full border-2 border-white/25 bg-white/10 backdrop-blur-sm" style={dynamicOrigin ? { ...buttonStyle(controls.joystick), left: dynamicOrigin.x, top: dynamicOrigin.y } : buttonStyle(controls.joystick)}>
          <div className="absolute left-1/2 top-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 border border-white/30" />
        </div>
      ) : (
        <>
          <button className={`${dpadBtn} bg-white/15 pointer-events-auto`} style={buttonStyle(b.left)} {...buttonHandlers(kb.left)}><GameIcon emoji="←" size={22} /></button>
          <button className={`${dpadBtn} bg-white/15 pointer-events-auto`} style={buttonStyle(b.right)} {...buttonHandlers(kb.right)}><GameIcon emoji="→" size={22} /></button>
          <button className={`${dpadBtn} bg-white/15 pointer-events-auto`} style={buttonStyle(b.jump)} {...buttonHandlers(kb.jump)}><GameIcon emoji="↑" size={22} /></button>
          <button className={`${dpadBtn} bg-white/15 pointer-events-auto`} style={buttonStyle(b.down)} {...buttonHandlers(kb.down)}><GameIcon emoji="↓" size={22} /></button>
        </>
      )}

      <button className={`${actionBtn} pointer-events-auto`} style={actionStyle(b.power, 'rgba(22,163,74,.78)')} {...buttonHandlers(kb.power)}>PWR</button>
      <button className={`${actionBtn} pointer-events-auto`} style={actionStyle(b.sig, 'rgba(37,99,235,.78)')} {...buttonHandlers(kb.sig)}>SIG</button>
      <button className={`${actionBtn} pointer-events-auto`} style={actionStyle(b.heavy, 'rgba(220,38,38,.78)')} {...buttonHandlers(kb.heavy)}>HVY</button>
      <button className={`${actionBtn} pointer-events-auto`} style={actionStyle(b.superMove, 'rgba(126,34,206,.82)')} {...buttonHandlers(kb.superMove)}>SUP</button>
    </div>
  );
}
