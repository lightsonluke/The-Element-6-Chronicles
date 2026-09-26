import { useEffect, useRef } from 'react';
import { readGamepadInput } from './controllerProfiles.js';

const FOCUSABLE = 'button:not([disabled]):not([hidden]), a[href]:not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])';

function getVisibleFocusable() {
  return Array.from(document.querySelectorAll(FOCUSABLE)).filter(el => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const st = window.getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
  });
}

function markControllerFocus(el) {
  document.querySelectorAll('.el6-controller-focus,[data-el6-controller-focus="true"]').forEach(node => {
    node.classList.remove('el6-controller-focus');
    node.removeAttribute('data-el6-controller-focus');
  });
  if (el) {
    el.classList.add('el6-controller-focus');
    el.setAttribute('data-el6-controller-focus', 'true');
  }
}

function focusElement(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  markControllerFocus(el);
  el.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
}

function spatialMove(direction) {
  const els = getVisibleFocusable();
  if (!els.length) return;
  const current = document.activeElement;
  if (!current || !els.includes(current)) {
    focusElement(els[0]);
    return;
  }
  const a = current.getBoundingClientRect();
  const acx = a.left + a.width / 2, acy = a.top + a.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of els) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = cx - acx, dy = cy - acy;
    let valid = false, primary = 0, cross = 0;
    if (direction === 'up') { valid = dy < -3; primary = -dy; cross = Math.abs(dx); }
    if (direction === 'down') { valid = dy > 3; primary = dy; cross = Math.abs(dx); }
    if (direction === 'left') { valid = dx < -3; primary = -dx; cross = Math.abs(dy); }
    if (direction === 'right') { valid = dx > 3; primary = dx; cross = Math.abs(dy); }
    if (!valid) continue;
    const score = primary + cross * 1.35 + Math.hypot(dx, dy) * 0.08;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) focusElement(best);
}

function activate() {
  const el = document.activeElement;
  if (!el) return;
  if (el.matches('button,a[href],[role="button"]')) el.click();
  else if (el.matches('input,select,textarea')) el.focus();
}

export function useGamepadMenuNav(enabled = true) {
  const previous = useRef({ up:false, down:false, left:false, right:false, confirm:false, back:false, start:false });
  const repeat = useRef({ up:0, down:0, left:0, right:0 });

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const menuOpen = !!window.__el6PauseMenuOpen || !!document.querySelector('.el6-pause-overlay-layer');
      const gameplay = !!window.__el6GameplayActive;
      if (!window.__el6ControllerCapture && (!gameplay || menuOpen)) {
        const gp = readGamepadInput(0);
        if (gp) {
          const dirs = { up:!!gp.up, down:!!gp.down, left:!!gp.left, right:!!gp.right };
          for (const d of Object.keys(dirs)) {
            if (dirs[d] && !previous.current[d]) { spatialMove(d); repeat.current[d] = 0; }
            else if (dirs[d]) { repeat.current[d]++; if (repeat.current[d] >= 24) { spatialMove(d); repeat.current[d] = 18; } }
            else repeat.current[d] = 0;
            previous.current[d] = dirs[d];
          }
          const confirm = !!(gp.confirm ?? gp.jump);
          const back = !!(gp.back ?? gp.power);
          const start = !!gp.start;
          if ((confirm || start) && !previous.current.confirm && !previous.current.start) activate();
          if (back && !previous.current.back) window.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true, cancelable:true }));
          previous.current.confirm = confirm; previous.current.back = back; previous.current.start = start;

          // If the controller is on a menu and nothing is focused, immediately
          // expose a visible target instead of waiting for the first direction.
          const visible = getVisibleFocusable();
          if (visible.length && !visible.includes(document.activeElement)) focusElement(visible[0]);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
}
