import { useEffect, useRef } from 'react';
import { readGamepadInput } from './controllerProfiles.js';

// Controller menu navigation — lets a gamepad D-pad/stick move focus between
// on-screen buttons and activate them with the confirm button (A/Cross).
// Works on every menu screen (disabled during active gameplay).
//
// Uses 2D SPATIAL NAVIGATION: finds the nearest focusable element in the
// requested direction based on screen position, enabling true grid/column
// navigation across menus, character selects, and on-screen keyboards.
//
// Mapping (same as the active controller profile):
//   D-pad / Left stick → move focus up/down/left/right (spatial)
//   A / Cross (jump)   → confirm (click focused button)
//   B / Circle (power) → back (dispatch Escape)
//   Start (start)      → also confirms (handy on some controllers)

const FOCUSABLE = 'button:not([disabled]):not([hidden]), a[href]:not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])';

function getVisibleFocusable() {
  const els = Array.from(document.querySelectorAll(FOCUSABLE));
  return els.filter((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  });
}

// 2D spatial navigation — finds nearest element in the given direction.
// Uses center-point distance with cross-axis penalty so navigation feels
// natural in grids (character selects), columns (menus), and on-screen keyboards.
function navigateFocusSpatial(direction) {
  const focusable = getVisibleFocusable();
  if (focusable.length === 0) return;
  const current = document.activeElement;
  const currentIdx = focusable.indexOf(current);

  if (currentIdx === -1 || !current || !focusable.includes(current)) {
    focusable[0].focus();
    focusable[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  const currentRect = current.getBoundingClientRect();
  const currentCx = currentRect.left + currentRect.width / 2;
  const currentCy = currentRect.top + currentRect.height / 2;

  let best = null;
  let bestScore = Infinity;

  for (let i = 0; i < focusable.length; i++) {
    if (i === currentIdx) continue;
    const el = focusable[i];
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - currentCx;
    const dy = cy - currentCy;

    let valid = false;
    let primaryDist = 0;
    let crossDist = 0;

    if (direction === 'up') {
      valid = dy < -2;
      primaryDist = -dy;
      crossDist = Math.abs(dx);
    } else if (direction === 'down') {
      valid = dy > 2;
      primaryDist = dy;
      crossDist = Math.abs(dx);
    } else if (direction === 'left') {
      valid = dx < -2;
      primaryDist = -dx;
      crossDist = Math.abs(dy);
    } else if (direction === 'right') {
      valid = dx > 2;
      primaryDist = dx;
      crossDist = Math.abs(dy);
    }

    if (!valid) continue;

    // Score: prioritize primary axis distance, penalize cross-axis offset.
    // Weighting of 1.5 on cross-axis makes grid navigation snap to columns
    // while still allowing diagonal movement when no direct neighbor exists.
    const score = primaryDist + crossDist * 1.5;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (best) {
    best.focus();
    best.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function activateFocused() {
  const el = document.activeElement;
  if (!el) return;
  if (el.tagName === 'SELECT') {
    // A controller confirm on a focused dropdown should open the actual picker,
    // not merely focus the select. showPicker() is the native, keyboard/gamepad-
    // friendly path in Chromium-based browsers; click() remains the fallback.
    el.focus();
    try { if (typeof el.showPicker === 'function') { el.showPicker(); return; } } catch (_) {}
    el.click();
    return;
  }
  if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
    el.click();
  } else if (el.tagName === 'INPUT') {
    el.focus();
  } else {
    const f = getVisibleFocusable();
    if (f[0]) { f[0].focus(); f[0].click(); }
  }
}

export function useGamepadMenuNav(enabled = true) {
  const lastDir = useRef({ up: false, down: false, left: false, right: false });
  const lastConfirm = useRef(false);
  const lastBack = useRef(false);
  const lastStart = useRef(false);
  const lastRightY = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let raf;
    let repeatTimer = 0;

    // Keep ordinary keyboard scrolling available on every menu/screen.
    // Do not intercept gameplay controls or form fields.
    const onKeyDown = (e) => {
      if (window.__el6GameplayActive || window.__el6ControllerCapture) return;
      const target = e.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

      const amount = Math.max(60, Math.round(window.innerHeight * 0.12));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.scrollBy({ top: amount, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollBy({ top: -amount, behavior: 'smooth' });
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        window.scrollBy({ top: Math.round(window.innerHeight * 0.82), behavior: 'smooth' });
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        window.scrollBy({ top: -Math.round(window.innerHeight * 0.82), behavior: 'smooth' });
      } else if (e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });

    const tick = () => {
      const gp = readGamepadInput(0);
      if (gp) {
        const gameplay = !!window.__el6GameplayActive || !!document.querySelector('.el6-controller-pause-trigger');
        const overlayOpen = !!document.querySelector('.el6-pause-overlay-layer, .el6-global-pause-layer');

        // During active gameplay, Start/Plus opens the existing pause overlay
        // and Back/Minus is reserved for a secondary overlay. Once an overlay
        // is open, normal controller menu navigation becomes active again.
        if (gameplay && !overlayOpen) {
          const start = !!gp.start;
          const back = !!gp.back;
          if (start && !lastStart.current) {
            const pauseButton = document.querySelector('.el6-controller-pause-trigger');
            if (pauseButton) pauseButton.click();
            else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          }
          if (back && !lastBack.current) {
            window.dispatchEvent(new CustomEvent('el6-controller-secondary-menu', { bubbles: true }));
          }
          lastStart.current = start;
          lastBack.current = back;
          lastConfirm.current = !!(gp.confirm ?? gp.jump);
          lastDir.current = { up: gp.up, down: gp.down, left: gp.left, right: gp.right };
          lastRightY.current = gp.rightY || 0;
          raf = requestAnimationFrame(tick);
          return;
        }

        const dir = { up: gp.up, down: gp.down, left: gp.left, right: gp.right };
        const confirm = !!(gp.confirm ?? gp.jump);
        const back = !!(gp.back ?? gp.power);
        const start = !!gp.start;

        // Right stick scrolls the document naturally instead of moving focus.
        const ry = Number(gp.rightY || 0);
        if (Math.abs(ry) > 0.18) {
          const delta = ry * Math.max(8, window.innerHeight * 0.055);
          window.scrollBy(0, delta);
        }
        lastRightY.current = ry;

        repeatTimer++;
        for (const d of ['up', 'down', 'left', 'right']) {
          if (dir[d] && !lastDir.current[d]) {
            navigateFocusSpatial(d);
            repeatTimer = 0;
          }
          if (dir[d] && lastDir.current[d] && repeatTimer > 30) {
            navigateFocusSpatial(d);
            repeatTimer = 25;
          }
          if (!dir[d]) lastDir.current[d] = false;
          else lastDir.current[d] = true;
        }

        if ((confirm || start) && !lastConfirm.current) {
          activateFocused();
        }
        lastConfirm.current = confirm || start;

        if (back && !lastBack.current) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        }
        lastBack.current = back;
        lastStart.current = start;
      } else {
        lastStart.current = false;
        lastBack.current = false;
        lastConfirm.current = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
}
