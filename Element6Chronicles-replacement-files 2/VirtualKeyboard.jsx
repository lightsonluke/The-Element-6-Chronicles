import React, { useState, useEffect, useRef } from 'react';
import { readGamepadInput } from './controllerProfiles.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// On-screen virtual keyboard for controller users. Automatically appears when
// a text input/textarea is focused AND a gamepad is connected. Navigate the
// letter grid with the D-pad/stick, type the highlighted key with the confirm
// button (A), and close the keyboard with back (B). While open, menu-nav is
// suppressed so the gamepad drives only the keyboard.
const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['SPACE', 'BACK', 'DONE'],
];

const NON_TEXT_TYPES = new Set([
  'range', 'checkbox', 'radio', 'file', 'submit', 'button', 'image', 'reset',
  'color', 'date', 'datetime-local', 'month', 'time', 'week', 'number',
]);

function clampCursor(r, c) {
  if (r < 0) r = ROWS.length - 1;
  if (r >= ROWS.length) r = 0;
  const len = ROWS[r].length;
  if (c < 0) c = len - 1;
  if (c >= len) c = 0;
  return { r, c };
}

export default function VirtualKeyboard() {
  const [active, setActive] = useState(false);
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [preview, setPreview] = useState('');
  const targetRef = useRef(null);
  const cursorRef = useRef({ r: 0, c: 0 });

  const close = () => {
    sfx.click();
    setActive(false);
    if (targetRef.current) { try { targetRef.current.blur(); } catch {} }
    targetRef.current = null;
  };

  const typeKey = (key) => {
    const el = targetRef.current;
    if (!el) { close(); return; }
    if (key === 'DONE') { close(); return; }
    sfx.click();
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    let val = el.value;
    let pos = start;
    if (key === 'BACK') {
      if (start !== end) { val = val.slice(0, start) + val.slice(end); pos = start; }
      else if (start > 0) { val = val.slice(0, start - 1) + val.slice(start); pos = start - 1; }
    } else if (key === 'SPACE') {
      val = val.slice(0, start) + ' ' + val.slice(end); pos = start + 1;
    } else {
      val = val.slice(0, start) + key + val.slice(end); pos = start + key.length;
    }
    // Use the native value setter so React-controlled inputs update their state.
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    try { el.setSelectionRange(pos, pos); } catch {}
    setPreview(val);
  };

  const move = (d) => {
    setCursor(prev => {
      let { r, c } = prev;
      if (d === 'up') r--; else if (d === 'down') r++;
      else if (d === 'left') c--; else if (d === 'right') c++;
      const next = clampCursor(r, c);
      cursorRef.current = next;
      sfx.click();
      return next;
    });
  };

  // Detect focus on a text input/textarea — show keyboard only if a gamepad is
  // connected.
  useEffect(() => {
    const onFocusIn = (e) => {
      const el = e.target;
      if (!el) return;
      if (el.tagName === 'INPUT' && NON_TEXT_TYPES.has(el.type)) return;
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
      if (el.readOnly || el.disabled) return;
      const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (gps.length === 0) return;
      targetRef.current = el;
      cursorRef.current = { r: 0, c: 0 };
      setCursor({ r: 0, c: 0 });
      setPreview(el.value || '');
      setActive(true);
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  // Close the keyboard if the target input loses focus (e.g. user clicks away
  // or tabs out).
  useEffect(() => {
    if (!active) return;
    const onFocusOut = (e) => {
      if (e.target === targetRef.current) {
        setActive(false);
        targetRef.current = null;
      }
    };
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
  }, [active]);

  // Suppress menu-nav while the keyboard is open so the gamepad drives only it.
  useEffect(() => {
    if (active) window.__el6ControllerCapture = true;
    return () => { if (active) window.__el6ControllerCapture = false; };
  }, [active]);

  // Poll the gamepad for keyboard navigation.
  useEffect(() => {
    if (!active) return;
    let raf;
    const last = { up: false, down: false, left: false, right: false, confirm: false, back: false };
    let repeat = 0;
    const tick = () => {
      const gp = readGamepadInput(0);
      if (gp) {
        const dir = { up: gp.up, down: gp.down, left: gp.left, right: gp.right };
        repeat++;
        for (const d of ['up', 'down', 'left', 'right']) {
          if (dir[d] && !last[d]) { move(d); repeat = 0; }
          else if (dir[d] && last[d] && repeat > 28) { move(d); repeat = 24; }
          last[d] = dir[d];
        }
        const confirm = !!(gp.confirm ?? gp.jump);
        const back = !!(gp.back ?? gp.power);
        if (confirm && !last.confirm) {
          typeKey(ROWS[cursorRef.current.r]?.[cursorRef.current.c]);
        }
        if (back && !last.back) close();
        last.confirm = confirm;
        last.back = back;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 p-3 bg-background/95 backdrop-blur border-t-2 border-accent shadow-2xl">
      <div className="flex items-center gap-3 w-full max-w-2xl justify-center">
        <p className="text-[10px] font-heading text-muted-foreground whitespace-nowrap"><GameIcon emoji="🎮" size={14} /> D-Pad: move · A: type · B: close</p>
        <div className="flex-1 min-w-0 px-3 py-1 bg-muted/50 rounded font-body text-sm text-foreground truncate text-center">
          {preview || <span className="text-muted-foreground italic">(empty)</span>}
          <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 w-full max-w-2xl">
        {ROWS.map((row, r) => (
          <div key={r} className="flex gap-1.5 justify-center flex-wrap">
            {row.map((key, c) => {
              const sel = cursor.r === r && cursor.c === c;
              const wide = key === 'SPACE' || key === 'BACK' || key === 'DONE';
              return (
                <div
                  key={c}
                  className={`font-heading rounded-lg transition-all select-none ${wide ? 'px-5' : 'px-3'} py-2.5 text-sm
                    ${sel ? 'bg-accent text-accent-foreground scale-110 shadow-lg ring-2 ring-accent' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {key === 'BACK' ? '⌫' : key === 'SPACE' ? '␣ SPACE' : key === 'DONE' ? '✓ DONE' : key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}