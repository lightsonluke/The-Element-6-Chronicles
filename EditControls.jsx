import React, { useState, useEffect } from 'react';
import { DEFAULT_KEYBINDS, WASD_KEYBINDS, KEYBIND_ACTIONS, formatKey, getControlOptions } from './keybinds.js';
import { sfx } from './sfx.js';

// EditControls now manages:
//  - Up to 3 named custom control sets (settings.customControls)
//  - Main control selector (settings.mainControl)
//  - Solo control selector (settings.soloControl)
export default function EditControls({ settings, onSave, onReset }) {
  const customControls = settings?.customControls || [];
  const mainControl = settings?.mainControl ?? 'arrows';
  const soloControl = settings?.soloControl ?? null;

  // Which set are we currently editing? 'arrows' | 'wasd' | 0 | 1 | 2
  const [editing, setEditing] = useState(typeof mainControl === 'number' ? mainControl : (mainControl === 'wasd' ? 'wasd' : 'arrows'));
  const [listening, setListening] = useState(null);

  // Ensure 3 custom slots exist (filled with nulls if not created yet)
  const slots = [0, 1, 2].map(i => customControls[i] || null);

  const getEditSet = () => {
    if (editing === 'arrows') return { name: 'Arrows', p1: DEFAULT_KEYBINDS.p1, p2: DEFAULT_KEYBINDS.p2, readOnly: true };
    if (editing === 'wasd') return { name: 'WASD', p1: WASD_KEYBINDS.p1, p2: WASD_KEYBINDS.p2, readOnly: true };
    if (typeof editing === 'number') {
      const cc = slots[editing];
      if (cc) return { name: cc.name || `Custom ${editing + 1}`, p1: { ...DEFAULT_KEYBINDS.p1, ...cc.p1 }, p2: { ...DEFAULT_KEYBINDS.p2, ...cc.p2 }, readOnly: false, isCustom: true };
      return { name: `Custom ${editing + 1}`, p1: { ...DEFAULT_KEYBINDS.p1 }, p2: { ...DEFAULT_KEYBINDS.p2 }, readOnly: false, isCustom: true, isNew: true };
    }
    return { name: 'Arrows', p1: DEFAULT_KEYBINDS.p1, p2: DEFAULT_KEYBINDS.p2, readOnly: true };
  };

  const editSet = getEditSet();

  useEffect(() => {
    if (!listening) return;
    const handler = (e) => {
      e.preventDefault();
      if (e.key === 'Escape') { setListening(null); return; }
      let key = e.key;
      if (key.length === 1) key = key.toLowerCase();
      // Save to the custom control slot
      if (typeof editing === 'number' && editSet.isCustom) {
        const next = [...customControls];
        const slot = next[editing] || { name: `Custom ${editing + 1}`, p1: { ...DEFAULT_KEYBINDS.p1 }, p2: { ...DEFAULT_KEYBINDS.p2 } };
        slot[listening.player] = { ...slot[listening.player], [listening.action]: key };
        next[editing] = slot;
        onSave?.({ customControls: next });
      }
      setListening(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [listening, editing, customControls, onSave]);

  const renderKeyButton = (player, action) => {
    if (editSet.readOnly) {
      return (
        <span className="px-3 py-1.5 rounded text-xs font-heading border-2 border-border bg-secondary text-secondary-foreground min-w-[56px] text-center opacity-60">
          {formatKey(editSet[player]?.[action])}
        </span>
      );
    }
    const isListening = listening?.player === player && listening?.action === action;
    const key = editSet[player]?.[action];
    return (
      <button
        onClick={() => setListening(isListening ? null : { player, action })}
        className={`px-3 py-1.5 rounded text-xs font-heading border-2 transition min-w-[56px] text-center ${
          isListening ? 'border-accent bg-accent/20 text-accent animate-pulse' : 'border-border bg-secondary text-secondary-foreground hover:border-accent'
        }`}
      >
        {isListening ? 'Press…' : formatKey(key)}
      </button>
    );
  };

  const setMainControl = (val) => { sfx.click(); onSave?.({ mainControl: val }); };
  const setSoloControl = (val) => { sfx.click(); onSave?.({ soloControl: val }); };

  const renameCustom = (idx, name) => {
    const next = [...customControls];
    const slot = next[idx] || { name: '', p1: { ...DEFAULT_KEYBINDS.p1 }, p2: { ...DEFAULT_KEYBINDS.p2 } };
    next[idx] = { ...slot, name };
    onSave?.({ customControls: next });
  };

  const createCustom = (idx) => {
    sfx.click();
    const next = [...customControls];
    next[idx] = { name: `Custom ${idx + 1}`, p1: { ...DEFAULT_KEYBINDS.p1 }, p2: { ...DEFAULT_KEYBINDS.p2 } };
    onSave?.({ customControls: next });
    setEditing(idx);
  };

  const deleteCustom = (idx) => {
    sfx.click();
    const next = [...customControls];
    next[idx] = null;
    // If main/solo was pointing to this, reset
    const patch = { customControls: next };
    if (mainControl === idx) patch.mainControl = 'arrows';
    if (soloControl === idx) patch.soloControl = null;
    onSave?.(patch);
    if (editing === idx) setEditing('arrows');
  };

  const controlOptions = getControlOptions(settings);
  const soloOptions = [{ id: null, label: 'Default (both)' }, ...controlOptions];

  const mainValue = typeof mainControl === 'number' ? `custom_${mainControl}` : mainControl;
  const soloValue = typeof soloControl === 'number' ? `custom_${soloControl}` : (soloControl ?? null);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-heading text-sm text-primary">EDIT CONTROLS</h3>
        <button
          onClick={() => { sfx.click(); onReset?.(); }}
          className="px-3 py-1.5 bg-destructive/20 text-destructive rounded text-xs font-heading hover:opacity-80 border border-destructive/30"
        >
          RESET ALL
        </button>
      </div>

      {/* Main Control selector */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-body text-muted-foreground w-24">Main control:</span>
        <select
          value={mainValue}
          onChange={e => {
            const v = e.target.value;
            if (v.startsWith('custom_')) setMainControl(parseInt(v.split('_')[1], 10));
            else setMainControl(v);
          }}
          className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body border border-border"
        >
          <option value="arrows">Arrows</option>
          <option value="wasd">WASD</option>
          {slots.map((s, i) => (
            <option key={i} value={`custom_${i}`}>{s?.name || `Custom ${i + 1}`}{s ? '' : ' (empty)'}</option>
          ))}
        </select>
      </div>

      {/* Solo Control selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-body text-muted-foreground w-24">Solo auto-use:</span>
        <select
          value={soloValue ?? ''}
          onChange={e => {
            const v = e.target.value;
            if (v === '') setSoloControl(null);
            else if (v.startsWith('custom_')) setSoloControl(parseInt(v.split('_')[1], 10));
            else setSoloControl(v);
          }}
          className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body border border-border"
        >
          {soloOptions.map(o => (
            <option key={String(o.id)} value={typeof o.id === 'number' ? `custom_${o.id}` : (o.id ?? '')}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Editing selector tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <button onClick={() => setEditing('arrows')} className={`px-3 py-1 rounded text-[10px] font-heading ${editing === 'arrows' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>Arrows</button>
        <button onClick={() => setEditing('wasd')} className={`px-3 py-1 rounded text-[10px] font-heading ${editing === 'wasd' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>WASD</button>
        {slots.map((s, i) => (
          <button key={i} onClick={() => setEditing(i)} className={`px-3 py-1 rounded text-[10px] font-heading ${editing === i ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {s?.name || `Custom ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Name input for custom sets */}
      {editSet.isCustom && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-body text-muted-foreground w-24">Name:</span>
          <input
            value={slots[editing]?.name || ''}
            onChange={e => renameCustom(editing, e.target.value)}
            placeholder={`Custom ${editing + 1}`}
            maxLength={20}
            className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body border border-border"
          />
          {!editSet.isNew && (
            <button onClick={() => deleteCustom(editing)} className="px-2 py-1.5 bg-destructive/20 text-destructive rounded text-[10px] font-heading hover:opacity-80 border border-destructive/30">DELETE</button>
          )}
        </div>
      )}

      {/* Empty custom slot — create button */}
      {editSet.isCustom && editSet.isNew && (
        <div className="text-center py-4 mb-3 border-2 border-dashed border-border rounded-lg">
          <p className="text-xs text-muted-foreground font-body mb-2">This custom slot is empty</p>
          <button onClick={() => createCustom(editing)} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-xs hover:opacity-80">CREATE CUSTOM {editing + 1}</button>
        </div>
      )}

      {/* Keybind grid — hidden for empty custom slots */}
      {!(editSet.isCustom && editSet.isNew) && (
        <>
          {editSet.readOnly && (
            <p className="text-[10px] text-muted-foreground mb-2">Preset scheme — read-only. Create a custom set to rebind keys.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {['p1', 'p2'].map(player => (
              <div key={player}>
                <p className="text-xs font-heading text-foreground mb-2">{player === 'p1' ? 'PLAYER 1' : 'PLAYER 2'}</p>
                <div className="space-y-1.5">
                  {KEYBIND_ACTIONS.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-body text-muted-foreground">{a.label}</span>
                      {renderKeyButton(player, a.id)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">Custom controls appear in "choose your controls" screens (LAN, Custom Rooms). Solo auto-use applies when playing alone in any mode.</p>
    </div>
  );
}