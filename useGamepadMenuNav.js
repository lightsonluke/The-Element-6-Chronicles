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
  if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
    el.click();
  } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
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

  useEffect(() => {
    if (!enabled) return;
    let raf;
    let repeatTimer = 0;

    const tick = () => {
      if (window.__el6ControllerCapture || window.__el6GameplayActive) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const gp = readGamepadInput(0);
      if (gp) {
        const dir = { up: gp.up, down: gp.down, left: gp.left, right: gp.right };
        const confirm = !!(gp.confirm ?? gp.jump);
        const back = !!(gp.back ?? gp.power);
        const start = !!gp.start;

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
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
}