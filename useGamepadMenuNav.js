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

const FOCUSABLE = 'button:not([disabled]):not([hidden]), a[href]:not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [role="combobox"]:not([aria-disabled="true"]):not([hidden]), [role="option"]:not([aria-disabled="true"]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])';

function getVisibleFocusable() {
  // A portaled dropdown may live outside its owning dialog. Give its open
  // listbox priority so controller focus stays inside the option list.
  const visible = el => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden'
      && !el.closest('[aria-hidden="true"], [inert]');
  };
  const openListbox = document.querySelector('[role="listbox"][data-state="open"], [data-radix-select-content][data-state="open"]');
  const candidates = Array.from(document.querySelectorAll('.e6-controller-keyboard[role="dialog"], [role="dialog"], [aria-modal="true"], .el6-pause-overlay-layer, .el6-global-pause-layer'));
  // Dialogs can be stacked (for example, a trade confirmation opened from the
  // Community Hub). DOM order alone is not enough when an older dialog remains
  // mounted underneath a portal, so select the visible candidate with the
  // highest effective z-index and use later DOM order as the tie-breaker.
  const effectiveZIndex = element => {
    let current = element;
    let highest = 0;
    while (current && current !== document.documentElement) {
      const value = Number.parseInt(window.getComputedStyle(current).zIndex, 10);
      if (Number.isFinite(value)) highest = Math.max(highest, value);
      current = current.parentElement;
    }
    return highest;
  };
  const visibleDialogs = candidates
    .map((element, order) => ({ element, order, zIndex: effectiveZIndex(element) }))
    .filter(candidate => visible(candidate.element))
    .sort((a, b) => a.zIndex - b.zIndex || a.order - b.order);
  const scope = visible(openListbox)
    ? openListbox
    : (visibleDialogs[visibleDialogs.length - 1]?.element || null);
  const root = scope || document;
  const els = Array.from(root.querySelectorAll(FOCUSABLE));
  return els.filter((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (el.closest('[aria-hidden="true"], [inert]')) return false;
    return true;
  });
}

function focusedScrollContainer() {
  let node = document.activeElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

function scrollFocusedContainer({ top = null, delta = 0 } = {}) {
  const container = focusedScrollContainer();
  if (container) {
    if (top !== null) container.scrollTo({ top: top === 'end' ? container.scrollHeight : 0, behavior: 'smooth' });
    else container.scrollBy({ top: delta, behavior: 'smooth' });
    return;
  }
  if (top !== null) window.scrollTo({ top: top === 'end' ? document.documentElement.scrollHeight : 0, behavior: 'smooth' });
  else window.scrollBy({ top: delta, behavior: 'smooth' });
}

function emitControlChange(control) {
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

function adjustFocusedControl(direction) {
  const control = document.activeElement;
  if (!control || control.disabled) return false;
  if (control.tagName === 'SELECT' && (direction === 'up' || direction === 'down')) {
    const options = Array.from(control.options).map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
    if (!options.length) return true;
    const current = options.findIndex(({ index }) => index === control.selectedIndex);
    const next = Math.max(0, Math.min(options.length - 1, (current < 0 ? 0 : current) + (direction === 'down' ? 1 : -1)));
    if (next !== current) {
      control.selectedIndex = options[next].index;
      emitControlChange(control);
    }
    return true;
  }
  if (control instanceof HTMLInputElement && control.type === 'range') {
    const towardHigh = direction === 'right' || direction === 'down';
    if (!towardHigh && direction !== 'left' && direction !== 'up') return false;
    const min = Number.isFinite(Number(control.min)) ? Number(control.min) : 0;
    const max = Number.isFinite(Number(control.max)) ? Number(control.max) : 100;
    const step = control.step && control.step !== 'any' ? Number(control.step) : 1;
    const next = Math.max(min, Math.min(max, Number(control.value) + (towardHigh ? step : -step)));
    if (next !== Number(control.value)) {
      control.value = String(next);
      emitControlChange(control);
    }
    return true;
  }
  return false;
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

function getOpenSelectContent() {
  return document.querySelector('[role="listbox"][data-state="open"], [data-radix-select-content][data-state="open"]');
}

function focusOpenedSelectItem() {
  const content = getOpenSelectContent();
  if (!content) return;
  const options = Array.from(content.querySelectorAll('[role="option"]')).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.hasAttribute('data-disabled');
  });
  if (!options.length) return;
  const selected = options.find((el) => el.getAttribute('aria-selected') === 'true' || el.getAttribute('data-state') === 'checked');
  (selected || options[0]).focus();
}

function activateFocused() {
  const el = document.activeElement;
  if (!el) return;

  if (el.tagName === 'SELECT') {
    // Native dropdown: open the real picker. Keep focus on the select so the
    // controller's B/back action can return cleanly to this same control.
    el.focus();
    try { if (typeof el.showPicker === 'function') { el.showPicker(); return; } } catch (_) {}
    el.click();
    return;
  }

  // Radix/custom dropdown trigger. After opening, move controller focus into
  // the actual listbox option so D-pad navigation works inside the menu.
  if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-haspopup') === 'listbox') {
    el.focus();
    el.click();
    requestAnimationFrame(() => requestAnimationFrame(focusOpenedSelectItem));
    return;
  }

  if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
    el.click();
  } else if (el.getAttribute('role') === 'option') {
    el.click();
  } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.focus();
    if (!el.readOnly && !el.disabled && !['checkbox', 'radio', 'range', 'file', 'submit', 'button', 'reset', 'color', 'date'].includes((el.type || '').toLowerCase())) {
      el.dispatchEvent(new CustomEvent('el6-controller-text-activate', { bubbles: true }));
    }
  } else {
    const f = getVisibleFocusable();
    if (f[0]) { f[0].focus(); f[0].click(); }
  }
}

function readMenuGamepadInput(preferredPadIndex) {
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads
    ? Array.from(navigator.getGamepads()).filter(Boolean)
    : [];
  const inputs = pads.map((pad, listIndex) => ({
    pad,
    input: readGamepadInput(listIndex),
  })).filter(entry => entry.pad.connected && entry.input);
  if (!inputs.length) return { input: null, padIndex: null };

  // Let whichever controller is currently being used drive the menu. This also
  // works when a controller is connected in slot 2 or after another slot has
  // been disconnected, rather than silently binding every menu to pad 0.
  const hasMenuInput = input => input.up || input.down || input.left || input.right
    || input.confirm || input.back || input.start || Math.abs(input.rightY || 0) > 0.18;
  const active = inputs.find(entry => hasMenuInput(entry.input))
    || inputs.find(entry => entry.pad.index === preferredPadIndex)
    || inputs[0];
  return { input: active.input, padIndex: active.pad.index };
}

export function useGamepadMenuNav(enabled = true) {
  const lastDir = useRef({ up: false, down: false, left: false, right: false });
  const lastConfirm = useRef(false);
  const lastBack = useRef(false);
  const lastStart = useRef(false);
  const lastRightY = useRef(0);
  const menuPadIndex = useRef(null);

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
        scrollFocusedContainer({ delta: amount });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollFocusedContainer({ delta: -amount });
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        scrollFocusedContainer({ delta: Math.round(window.innerHeight * 0.82) });
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        scrollFocusedContainer({ delta: -Math.round(window.innerHeight * 0.82) });
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollFocusedContainer({ top: 0 });
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollFocusedContainer({ top: 'end' });
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });

    const tick = () => {
      // Controller-driven subinterfaces (the virtual keyboard and button
      // remapping capture) own all gamepad input until they release it.
      if (window.__el6ControllerCapture) {
        lastDir.current = { up: false, down: false, left: false, right: false };
        lastStart.current = false; lastBack.current = false; lastConfirm.current = false;
        raf = requestAnimationFrame(tick);
        return;
      }
      // Community Hub owns its controller while the world canvas is focused.
      // Do not also interpret movement buttons as menu confirm/back/pause.
      const focusedTextEntry = document.activeElement?.matches?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea');
      const controllerDialogOpen = !!document.querySelector('.e6-controller-keyboard[role="dialog"]');
      if (window.__el6CommunityHubMovement && !window.__el6ControllerCapture && !focusedTextEntry && !controllerDialogOpen) {
        lastDir.current = { up: false, down: false, left: false, right: false };
        lastStart.current = false; lastBack.current = false; lastConfirm.current = false;
        raf = requestAnimationFrame(tick);
        return;
      }
      const { input: gp, padIndex } = readMenuGamepadInput(menuPadIndex.current);
      if (padIndex != null) menuPadIndex.current = padIndex;
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
          scrollFocusedContainer({ delta });
        }
        lastRightY.current = ry;

        repeatTimer++;
        for (const d of ['up', 'down', 'left', 'right']) {
          if (dir[d] && !lastDir.current[d]) {
            if (!adjustFocusedControl(d)) navigateFocusSpatial(d);
            repeatTimer = 0;
          }
          if (dir[d] && lastDir.current[d] && repeatTimer > 30) {
            if (!adjustFocusedControl(d)) navigateFocusSpatial(d);
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
          const openSelect = getOpenSelectContent();
          if (openSelect) {
            // Radix Select listens for Escape and restores focus to its trigger.
            // Capture the trigger before closing so B reliably returns the
            // controller focus indicator to the dropdown box itself.
            const trigger = document.querySelector('[role="combobox"][aria-expanded="true"]')
              || document.querySelector('[role="combobox"]:focus');
            const focused = document.activeElement;
            focused?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
            requestAnimationFrame(() => {
              if (getOpenSelectContent()) {
                // Some browsers do not deliver synthetic Escape to the native
                // Radix handler; toggling the trigger closes the still-open menu.
                trigger?.click();
              }
              requestAnimationFrame(() => {
                if (trigger && document.contains(trigger)) trigger.focus();
                else {
                  const fallback = document.querySelector('[role="combobox"]');
                  fallback?.focus();
                }
              });
            });
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          }
        }
        lastBack.current = back;
        lastStart.current = start;
      } else {
        lastDir.current = { up: false, down: false, left: false, right: false };
        lastStart.current = false;
        lastBack.current = false;
        lastConfirm.current = false;
        lastRightY.current = 0;
        repeatTimer = 0;
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
