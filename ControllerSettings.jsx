import React, { useEffect, useState } from 'react';
import { useGamepad } from './useGamepad.js';
import { PROMPT_GLYPHS, DEFAULT_FAMILY, loadProfiles, saveProfiles, loadActiveProfile, DEFAULT_PROFILE, detectControllerModel, getSlotProfileName, setSlotProfileName, autoAssignJoyConProfiles, setRumbleEnabled } from './controllerProfiles.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const MODEL_LABELS = {
  joycon_left: 'Joy-Con L (Single)',
  joycon_right: 'Joy-Con R (Single)',
  joycon_pair: 'Joy-Con (Paired)',
  pro: 'Switch Pro',
  nintendo_generic: 'Nintendo',
};

// Controller Settings menu — remap every action, deadzones, stick/trigger
// sensitivity, invert, vibration, and multiple named profiles.
export default function ControllerSettings({ onBack, settings, onSaveSettings }) {
  const { pads, setProfile, vibrate } = useGamepad();
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [activeName, setActiveName] = useState(() => loadActiveProfile().name);
  const [capture, setCapture] = useState(null);
  const [rumbleOn, setRumbleOn] = useState(() => { try { return (localStorage.getItem('el6_rumble_enabled') ?? '1') === '1'; } catch { return true; } });
  const [slotProfiles, setSlotProfiles] = useState(() => { try { return JSON.parse(localStorage.getItem('el6_controller_slot_profiles') || '{}'); } catch { return {}; } });
  const active = profiles.find(p => p.name === activeName) || profiles[0];
  const controllerEnabled = settings?.controllerEnabled !== false;
  const menuNavEnabled = settings?.controllerMenuNav !== false;

  useEffect(() => { setProfile(active); }, [active, setProfile]);

  // Expose capture-mode to the global menu-nav hook so gamepad D-pad / confirm
  // presses don't fight with button-remap capture while a binding is in flight.
  useEffect(() => {
    window.__el6ControllerCapture = capture != null;
    return () => { window.__el6ControllerCapture = false; };
  }, [capture]);

  // Auto-assign Joy-Con profiles when controllers connect
  useEffect(() => {
    if (autoAssignJoyConProfiles()) {
      setSlotProfiles(() => { try { return JSON.parse(localStorage.getItem('el6_controller_slot_profiles') || '{}'); } catch { return {}; } });
    }
  }, [pads]);

  const updateSlotProfile = (slot, name) => {
    setSlotProfileName(slot, name || null);
    setSlotProfiles(prev => { const next = { ...prev }; if (name) next[slot] = name; else delete next[slot]; return next; });
    sfx.click();
  };

  const update = (patch) => {
    const next = profiles.map(p => p.name === active.name ? { ...p, ...patch } : p);
    setProfiles(next); saveProfiles(next);
  };
  const updateBtn = (key, idx) => update({ buttons: { ...active.buttons, [key]: idx } });
  const updateStick = (which, patch) => update({ [which]: { ...active[which], ...patch } });

  // Capture next pressed standard button index while remapping.
  // "Settle" phase: wait until ALL gamepad buttons are released before
  // accepting a new press. This prevents an instant/unintended bind when the
  // user trackpad-clicks a remap target while a button is still held (e.g.
  // the confirm button they just used to navigate to it).
  useEffect(() => {
    if (capture == null) return;
    let raf;
    let settled = false;
    const tick = () => {
      const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      let anyPressed = false;
      for (const gp of gps) {
        if (!gp) continue;
        if (gp.buttons.some(b => b?.pressed)) { anyPressed = true; break; }
      }
      if (!anyPressed) settled = true;
      if (settled) {
        for (const gp of gps) {
          if (!gp) continue;
          const i = gp.buttons.findIndex(b => b?.pressed);
          if (i >= 0) { updateBtn(capture, i); setCapture(null); sfx.click(); return; }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [capture]);

  // Escape cancels an in-flight binding so the user is never stuck in capture.
  useEffect(() => {
    if (capture == null) return;
    const onKey = (e) => { if (e.key === 'Escape') { setCapture(null); sfx.click(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capture]);

  // Always show Nintendo glyphs (B/A/Y/X) for the binding display — every
  // built-in profile uses Nintendo button indices, so Nintendo labels are the
  // correct reference regardless of which physical controller is connected.
  const family = DEFAULT_FAMILY;
  const glyph = (idx) => PROMPT_GLYPHS[family]?.[idx] ?? idx;

  // Nintendo-style action set — no Light Attack / Dodge / Grab (these don't exist
  // as bindable actions anymore). Sig is the signature attack.
  const ACTIONS = [
    ['jump', 'Jump'], ['heavy', 'Heavy Attack'], ['sig', 'Signature (Sig)'], ['power', 'Power'],
    ['super', 'Super'], ['start', 'Pause'],
    ['menu', 'Menu'], ['confirm', 'Confirm'], ['back', 'Back'],
    ['up', 'D-Up'], ['down', 'D-Down'], ['left', 'D-Left'], ['right', 'D-Right'],
  ];

  const newProfile = () => {
    const name = prompt('Profile name:', `Profile ${profiles.length + 1}`);
    if (!name) return;
    const next = [...profiles, { ...DEFAULT_PROFILE, name }];
    setProfiles(next); saveProfiles(next); setActiveName(name); sfx.purchaseSuccess();
  };
  const deleteProfile = () => {
    if (profiles.length <= 1) return;
    const next = profiles.filter(p => p.name !== active.name);
    setProfiles(next); saveProfiles(next); setActiveName(next[0].name); sfx.warning();
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl text-accent tracking-wider"><GameIcon emoji="🎮" size={14} /> CONTROLLER SETTINGS</h2>
        <button onClick={onBack} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs font-heading text-foreground">
          <input type="checkbox" checked={controllerEnabled} onChange={e => onSaveSettings?.({ ...settings, controllerEnabled: e.target.checked })} /> Controller Enabled (gameplay)
        </label>
        <label className="flex items-center gap-2 text-xs font-heading text-foreground">
          <input type="checkbox" checked={menuNavEnabled} onChange={e => onSaveSettings?.({ ...settings, controllerMenuNav: e.target.checked })} /> Menu Navigation
        </label>
        <label className="flex items-center gap-2 text-xs font-heading text-foreground">
          <input type="checkbox" checked={rumbleOn} onChange={e => {
            setRumbleOn(e.target.checked);
            setRumbleEnabled(e.target.checked);
            sfx.click();
            if (e.target.checked) vibrate(0, 1, 1, 200);
          }} /> Controller Rumble
        </label>
      </div>

      <div className="mb-4 bg-muted/30 rounded-lg p-3">
        <p className="text-[10px] font-heading text-muted-foreground mb-1">CONNECTED CONTROLLERS ({pads.length})</p>
        {pads.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No controllers detected. Connect a Bluetooth or USB controller — single Joy-Cons, paired Joy-Cons, Pro, Xbox, and PlayStation all supported. Hot-plugging works.</p>
        ) : (
          <ul className="space-y-2">
            {pads.map(p => {
              const model = detectControllerModel(p.gp || p);
              const modelLabel = model ? (MODEL_LABELS[model] || 'Nintendo') : p.family;
              const isJoyCon = model === 'joycon_left' || model === 'joycon_right' || model === 'joycon_pair';
              const slotProf = slotProfiles[p.index] || '';
              return (
                <li key={p.index} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-accent"><GameIcon emoji="●" size={14} /></span> Slot {p.index}: <span className="font-heading truncate flex-1">{p.id || 'Gamepad'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${isJoyCon ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>{modelLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 pl-5">
                    <span className="text-[9px] text-muted-foreground">Profile:</span>
                    <select value={slotProf} onChange={e => updateSlotProfile(p.index, e.target.value)} className="text-[9px] bg-secondary text-secondary-foreground rounded px-1 py-0.5 border border-border">
                      <option value="">Active ({activeName})</option>
                      {profiles.map(pr => <option key={pr.name} value={pr.name}>{pr.name}</option>)}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[9px] text-muted-foreground mt-2">Each slot can use its own profile — perfect for 2 single Joy-Cons as separate players. Joy-Cons auto-assign the correct profile when connected; rebind below if your platform uses different indices.</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-heading text-muted-foreground">PROFILE:</span>
        <select value={activeName} onChange={e => { setActiveName(e.target.value); sfx.click(); }} className="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-heading">
          {profiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <button onClick={newProfile} className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-xs">+ New</button>
        <button onClick={deleteProfile} className="px-3 py-1 bg-destructive text-destructive-foreground rounded font-heading text-xs">Delete</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {ACTIONS.map(([key, label]) => (
          <button key={key} onClick={() => { window.__el6ControllerCapture = true; setCapture(key); sfx.click(); }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-heading ${capture === key ? 'border-accent bg-accent/20 animate-pulse' : 'border-border bg-muted/30'}`}>
            <span className="text-foreground">{label}</span>
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary min-w-[2.5rem] text-center">
              {capture === key ? '…' : glyph(active.buttons[key])}
            </span>
          </button>
        ))}
      </div>
      {capture && <p className="text-[10px] text-accent mb-3">Press any button on your controller to bind “{capture}”…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-heading text-primary mb-2">LEFT STICK</p>
          <p className="text-xs text-foreground mb-1">Deadzone {active.leftStick.deadzone.toFixed(2)}</p>
          <input type="range" min={0} max={0.5} step={0.01} value={active.leftStick.deadzone} onChange={e => updateStick('leftStick', { deadzone: +e.target.value })} className="w-full" />
          <p className="text-xs text-foreground mb-1 mt-2">Sensitivity {active.leftStick.sensitivity.toFixed(2)}</p>
          <input type="range" min={0.2} max={3} step={0.05} value={active.leftStick.sensitivity} onChange={e => updateStick('leftStick', { sensitivity: +e.target.value })} className="w-full" />
          <div className="flex gap-3 mt-2 text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={active.leftStick.move} onChange={e => updateStick('leftStick', { move: e.target.checked })} /> Move</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={active.leftStick.invertX} onChange={e => updateStick('leftStick', { invertX: e.target.checked })} /> Inv X</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={active.leftStick.invertY} onChange={e => updateStick('leftStick', { invertY: e.target.checked })} /> Inv Y</label>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs font-heading text-primary mb-2">RIGHT STICK / TRIGGERS</p>
          <p className="text-xs text-foreground mb-1">R-Stick Deadzone {active.rightStick.deadzone.toFixed(2)}</p>
          <input type="range" min={0} max={0.5} step={0.01} value={active.rightStick.deadzone} onChange={e => update('rightStick', { deadzone: +e.target.value })} className="w-full" />
          <p className="text-xs text-foreground mb-1 mt-2">Trigger Sensitivity {active.triggers.sensitivity.toFixed(2)}</p>
          <input type="range" min={0.2} max={3} step={0.05} value={active.triggers.sensitivity} onChange={e => update({ triggers: { ...active.triggers, sensitivity: +e.target.value } })} className="w-full" />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <label className="flex items-center gap-2 text-xs font-heading text-foreground">
          <input type="checkbox" checked={active.vibration} onChange={e => update({ vibration: e.target.checked })} /> Vibration
        </label>
        <label className="flex items-center gap-2 text-xs font-heading text-foreground flex-1 max-w-xs">
          Strength {(active.vibrationStrength ?? 0.6).toFixed(2)}
          <input type="range" min={0} max={1} step={0.05} value={active.vibrationStrength ?? 0.6} onChange={e => update({ vibrationStrength: +e.target.value })} className="flex-1" />
        </label>
        <button onClick={() => vibrate(0, 1, 1, 300)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs">Test</button>
      </div>

      <p className="text-[9px] text-muted-foreground mt-4">Detected: {pads.length} controller(s). Single Joy-Cons register as independent slots for 2-player split. Hot-plug supported.</p>
    </div>
  );
}