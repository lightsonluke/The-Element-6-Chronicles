import React, { useMemo, useRef, useState } from 'react';
import GameIcon from './GameIcon.jsx';
import { MOBILE_CONTROL_DEFAULTS, normalizeMobileControls } from './mobileControls.js';

const LABELS = { left: '←', right: '→', jump: '↑', down: '↓', power: 'PWR', sig: 'SIG', heavy: 'HVY', superMove: 'SUP' };

export default function MobileControlsTest({ settings = {}, onSave, onBack }) {
  const [controls, setControls] = useState(() => normalizeMobileControls(settings.mobileControls));
  const [selected, setSelected] = useState('jump');
  const dragRef = useRef(null);
  const stageRef = useRef(null);

  const updateItem = (group, id, patch) => {
    setControls(prev => normalizeMobileControls({ ...prev, [group]: { ...prev[group], [id]: { ...prev[group][id], ...patch } } }));
  };
  const save = next => onSave?.({ mobileControls: normalizeMobileControls(next) });

  const beginDrag = (group, id, e) => {
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { group, id, rect };
    setSelected(id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = e => {
    const d = dragRef.current;
    if (!d) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - d.rect.left) / d.rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - d.rect.top) / d.rect.height) * 100));
    setControls(prev => normalizeMobileControls({ ...prev, [d.group]: { ...prev[d.group], [d.id]: { ...prev[d.group][d.id], x, y } } }));
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    save(controls);
  };

  const current = controls.mode === 'joystick'
    ? controls.joystick
    : controls.buttons[selected] || controls.buttons.jump;

  const setMode = mode => {
    const next = normalizeMobileControls({ ...controls, mode });
    setControls(next); save(next);
  };
  const reset = () => { const next = normalizeMobileControls(MOBILE_CONTROL_DEFAULTS); setControls(next); save(next); };

  const buttonEntries = useMemo(() => Object.entries(controls.buttons), [controls.buttons]);

  return (
    <div className="w-full max-w-6xl flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">MOBILE CONTROL LAYOUT TEST</h2>
          <p className="text-xs text-muted-foreground font-body">Drag the controls around the game screen to preview exactly where they will appear during Mobile Mode.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        <div ref={stageRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
          className="relative w-full aspect-video min-h-[420px] rounded-2xl overflow-hidden border-2 border-accent/40 bg-slate-950 shadow-2xl select-none touch-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(80,120,255,.22),transparent_45%),linear-gradient(180deg,#10182d,#070b17)]" />
          <div className="absolute inset-x-0 bottom-0 h-[18%] bg-slate-800/70 border-t border-white/10" />
          <div className="absolute top-3 left-3 text-[10px] font-heading text-white/60">MOBILE GAMEPLAY PREVIEW</div>
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 text-5xl">🟡</div>

          {controls.mode === 'joystick' ? (
            <div onPointerDown={e => beginDrag('joystick', 'joystick', e)}
              className="absolute rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ left: `${controls.joystick.x}%`, top: `${controls.joystick.y}%`, width: controls.joystick.size, height: controls.joystick.size, transform: 'translate(-50%,-50%)', opacity: controls.joystick.opacity }}>
              <div className="w-1/2 h-1/2 rounded-full bg-white/20 border border-white/30" />
            </div>
          ) : buttonEntries.map(([id, item]) => (
            <button key={id} onPointerDown={e => beginDrag('buttons', id, e)}
              className={`absolute flex items-center justify-center rounded-full border-2 border-white/30 text-white font-heading select-none touch-none cursor-grab active:cursor-grabbing ${['left','right','jump','down'].includes(id) ? 'bg-white/15 text-2xl' : 'bg-accent/55 text-[10px]'}`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size, transform: 'translate(-50%,-50%)', opacity: item.opacity }}>
              {LABELS[id]}
            </button>
          ))}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-body text-white/45">This preview is visual only — use it to arrange your controls before entering a match.</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div>
            <p className="font-heading text-xs text-primary mb-2">CONTROL TYPE</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode('arrows')} className={`px-3 py-2 rounded border text-xs font-heading ${controls.mode === 'arrows' ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>ARROWS</button>
              <button onClick={() => setMode('joystick')} className={`px-3 py-2 rounded border text-xs font-heading ${controls.mode === 'joystick' ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground border-border'}`}>JOYSTICK</button>
            </div>
          </div>

          {controls.mode === 'joystick' ? (
            <>
              <label className="flex items-center justify-between text-xs font-body">Dynamic joystick <input type="checkbox" checked={controls.joystickDynamic} onChange={e => { const n = normalizeMobileControls({ ...controls, joystickDynamic: e.target.checked }); setControls(n); save(n); }} /></label>
              <ControlSlider label="Joystick size" value={controls.joystick.size} min={60} max={160} step={1} onChange={v => updateItem('joystick', 'joystick', { size: v })} />
              <ControlSlider label="Joystick opacity" value={controls.joystick.opacity} min={0.15} max={1} step={0.05} onChange={v => updateItem('joystick', 'joystick', { opacity: v })} />
            </>
          ) : (
            <>
              <p className="font-heading text-xs text-primary">SELECT BUTTON</p>
              <div className="grid grid-cols-4 gap-1">{buttonEntries.map(([id]) => <button key={id} onClick={() => setSelected(id)} className={`px-1.5 py-1.5 rounded text-[9px] font-heading ${selected === id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{LABELS[id]}</button>)}</div>
              <ControlSlider label="Size" value={current.size} min={36} max={120} step={1} onChange={v => updateItem('buttons', selected, { size: v })} />
              <ControlSlider label="Opacity" value={current.opacity} min={0.15} max={1} step={0.05} onChange={v => updateItem('buttons', selected, { opacity: v })} />
            </>
          )}
          <button onClick={reset} className="w-full px-3 py-2 rounded bg-secondary text-secondary-foreground border border-border text-xs font-heading">RESET MOBILE LAYOUT</button>
        </div>
      </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step, onChange }) {
  return <label className="block"><div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1"><span>{label}</span><span>{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span></div><input className="w-full" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
