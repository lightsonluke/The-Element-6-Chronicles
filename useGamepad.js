import { useEffect, useRef, useState, useCallback } from 'react';
import { guessFamily, loadActiveProfile, triggerRumble } from './controllerProfiles.js';

// Global gamepad input hook. Polls the Gamepad API every frame and exposes
// a normalized snapshot: connected controllers, their family, button states,
// stick values (deadzone + sensitivity + inversion applied), and helpers for
// vibration and "just pressed" edge detection.
//
// Single Joy-Cons: a horizontally-held single Joy-Con reports as its own
// gamepad index; the left Joy-Con uses its face buttons as a dpad. We surface
// all connected gamepads so the game can assign each to a player slot.
//
// IMPORTANT: Browsers (especially Chrome) only populate navigator.getGamepads()
// AFTER the user presses a button on the controller. The gamepadconnected event
// also only fires after a button press. So we poll every frame and update the
// pads list when the connected set changes — this is the only reliable way to
// detect a controller that was connected before the page loaded.
export function useGamepad() {
  const [pads, setPads] = useState([]);
  const pressRef = useRef({}); // index -> {btn: prevBool}
  const profileRef = useRef(loadActiveProfile());
  const [justPressed, setJustPressed] = useState({});
  const rafRef = useRef(0);
  const lastPadKeyRef = useRef('');

  const refresh = useCallback(() => {
    const list = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    setPads(list.map(gp => ({ index: gp.index, id: gp.id, family: guessFamily(gp), gp })));
    lastPadKeyRef.current = list.map(gp => `${gp.index}:${gp.id}`).join(',');
  }, []);

  useEffect(() => {
    const onConnect = () => refresh();
    const onDisconnect = () => refresh();
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    // Bluetooth controllers in some browsers only appear in getGamepads() after
    // a user gesture lands on the iframe/window. Re-poll right after any
    // pointer/key interaction so newly-connected pads register instantly.
    const onInteract = () => refresh();
    window.addEventListener('pointerdown', onInteract);
    window.addEventListener('keydown', onInteract);
    window.addEventListener('click', onInteract);
    refresh();
    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('click', onInteract);
    };
  }, [refresh]);

  // Poll loop: detects gamepad connection changes AND button edges (justPressed).
  // Checking connection every frame is essential because Chrome doesn't report
  // gamepads until a button is pressed — the gamepadconnected event alone is
  // unreliable for controllers connected before page load.
  useEffect(() => {
    const tick = () => {
      // ── Detect connection changes ──
      const rawGps = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const connected = rawGps.filter(Boolean);
      const connectedKey = connected.map(gp => `${gp.index}:${gp.id}`).join(',');
      if (connectedKey !== lastPadKeyRef.current) {
        lastPadKeyRef.current = connectedKey;
        setPads(connected.map(gp => ({ index: gp.index, id: gp.id, family: guessFamily(gp), gp })));
      }

      // ── Edge detection (justPressed) ──
      const fresh = {};
      rawGps.forEach((gp) => {
        if (!gp) return;
        const prev = pressRef.current[gp.index] || {};
        const cur = {};
        gp.buttons.forEach((b, i) => { cur[i] = b.pressed; });
        pressRef.current[gp.index] = cur;
        const edges = [];
        for (const k in cur) {
          if (cur[k] && !prev[k]) edges.push(parseInt(k, 10));
        }
        if (edges.length) fresh[gp.index] = edges;
      });
      if (Object.keys(fresh).length) setJustPressed(fresh);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setProfile = useCallback((p) => { profileRef.current = p; }, []);

  // rumble() — honors both the per-profile vibration flag and the user-facing
  // global "Controller Rumble" toggle (setRumbleEnabled) so controllers respect
  // the on/off switch in Controller Settings.
  const vibrate = useCallback((index, strong = 0.6, weak = 0.4, duration = 200) => {
    triggerRumble(index, strong, weak, duration);
  }, []);

  // Read a controller's normalized state for a given player slot.
  const read = useCallback((slot = 0) => {
    const gp = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean)[slot] : null;
    if (!gp) return null;
    const prof = profileRef.current;
    const dz = (v, dzv) => (Math.abs(v) < dzv ? 0 : v);
    const apply = (axis, cfg) => {
      let v = dz(gp.axes[axis] || 0, cfg.deadzone ?? 0.18);
      v *= cfg.sensitivity ?? 1;
      if (cfg.invertX && axis % 2 === 0) v = -v;
      if (cfg.invertY && axis % 2 === 1) v = -v;
      return v;
    };
    const btn = (k) => { const idx = prof.buttons[k]; return idx != null && !!gp.buttons[idx]?.pressed; };
    const moveX = prof.leftStick.move ? apply(0, prof.leftStick) : 0;
    const moveY = prof.leftStick.move ? apply(1, prof.leftStick) : 0;
    const axes = {
      moveX,
      moveY,
      camX: apply(2, prof.rightStick),
      camY: apply(3, prof.rightStick),
    };
    // Stick and D-pad both feed into axes movement + navigation.
    let mx = axes.moveX;
    let my = axes.moveY;
    if (Math.abs(mx) < 0.1) { if (btn('left')) mx = -1; else if (btn('right')) mx = 1; }
    if (Math.abs(my) < 0.1) { if (btn('up')) my = -1; else if (btn('down')) my = 1; }
    axes.moveX = mx;
    axes.moveY = my;
    return { buttons: { jump: btn('jump'), sig: btn('sig'), heavy: btn('heavy'), power: btn('power'), super: btn('super'), start: btn('start'), confirm: btn('confirm'), back: btn('back') }, axes, raw: gp, family: guessFamily(gp) };
  }, []);

  return { pads, justPressed, setProfile, vibrate, read, refresh };
}