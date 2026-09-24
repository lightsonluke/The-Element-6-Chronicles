import React, { useEffect, useRef, useState } from 'react';
import { STAGE_LIST } from './stages.js';
import { ALL_CHARS } from './allCharacters.js';
import { music } from './music.js';
import PlatformFighter from './PlatformFighter.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';

const TRAINING_DEFAULTS = { botMode:'dummy', repeatJump:false, damageResetEnabled:false, damageResetValue:0, damageResetTimer:0, resetWhenGrounded:false, positionResetEnabled:false, positionResetTimer:0, positionResetWhenGrounded:false, paused:false, stepDelta:0, jumpInterval:45 };

export function TrainingOverlay({ ctl, p1, p2, onCharacters, open = false, onClose }) {
  const [, force] = useState(0);
  useEffect(() => { const id=setInterval(()=>force(v=>v+1),120); return()=>clearInterval(id); }, []);
  const update = patch => Object.assign(ctl.current, patch);
  if (!open) return null;
  const timerOptions=[0,60,120,180,300,600];
  return <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
    <div className="pointer-events-auto bg-black/90 border border-accent/70 rounded-xl p-2 text-[10px] text-white shadow-xl">
      <div className="flex flex-wrap gap-2 items-center">
        <b className="text-accent font-heading">TRAINING</b>
        <label>BOT <select value={ctl.current.botMode} onChange={e=>update({botMode:e.target.value})} className="bg-secondary text-white rounded px-1 py-0.5"><option value="dummy">DUMMY</option><option value="mimic">MIMIC</option><option value="mirror">MIRROR</option></select></label>
        <button onClick={()=>update({repeatJump:!ctl.current.repeatJump})} className={`px-2 py-1 rounded ${ctl.current.repeatJump?'bg-accent text-black':'bg-secondary'}`}>REPEAT JUMP</button>
        <button onClick={()=>onClose?.()} className="px-2 py-1 rounded bg-secondary">CLOSE</button>
        <button onClick={()=>ctl.current.stepBack?.()} className="px-2 py-1 rounded bg-secondary">◀ FRAME</button>
        <button onClick={()=>ctl.current.stepForward?.()} className="px-2 py-1 rounded bg-secondary">FRAME ▶</button>
        <button onClick={()=>ctl.current.resetDamage?.()} className="px-2 py-1 rounded bg-secondary">RESET DAMAGE</button>
        <button onClick={()=>ctl.current.capturePosition?.()} className="px-2 py-1 rounded bg-secondary">SET POSITION</button>
        <button onClick={()=>ctl.current.resetPosition?.()} className="px-2 py-1 rounded bg-secondary">RESET POSITION</button>
      </div>
      <div className="flex flex-wrap gap-2 items-center mt-2 border-t border-white/10 pt-2">
        <label>DAMAGE <input type="number" min="0" max="1500" value={ctl.current.damageResetValue} onChange={e=>update({damageResetValue:Number(e.target.value)||0})} className="w-14 bg-secondary rounded px-1 py-0.5"/></label>
        <label><input type="checkbox" checked={!!ctl.current.damageResetEnabled} onChange={e=>update({damageResetEnabled:e.target.checked})}/> RESET</label>
        <label>GROUND 3s <input type="checkbox" checked={!!ctl.current.resetWhenGrounded} onChange={e=>update({resetWhenGrounded:e.target.checked})}/></label>
        <label>TIMER <select value={ctl.current.damageResetTimer} onChange={e=>update({damageResetTimer:Number(e.target.value)})} className="bg-secondary rounded px-1"><option value="0">OFF</option>{timerOptions.slice(1).map(v=><option key={v} value={v}>{(v/60).toFixed(0)}s</option>)}</select></label>
        <label>POS <input type="checkbox" checked={!!ctl.current.positionResetEnabled} onChange={e=>update({positionResetEnabled:e.target.checked})}/></label>
        <label>GROUND 3s <input type="checkbox" checked={!!ctl.current.positionResetWhenGrounded} onChange={e=>update({positionResetWhenGrounded:e.target.checked})}/></label>
        <label>TIMER <select value={ctl.current.positionResetTimer} onChange={e=>update({positionResetTimer:Number(e.target.value)})} className="bg-secondary rounded px-1"><option value="0">OFF</option>{timerOptions.slice(1).map(v=><option key={v} value={v}>{(v/60).toFixed(0)}s</option>)}</select></label>
        <label>P1 <select value={p1} onChange={e=>onCharacters(e.target.value,p2)} className="bg-secondary rounded px-1 max-w-32">{ALL_CHARS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>P2 <select value={p2} onChange={e=>onCharacters(p1,e.target.value)} className="bg-secondary rounded px-1 max-w-32">{ALL_CHARS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
    </div>
  </div>;
}

export default function TrainingMode({ unlockedIds, favoriteId, onBack, equippedAccessories = {}, equippedSkins = {}, customCharsData = {}, settings = {} }) {
  const [p1, setP1] = useState(favoriteId || unlockedIds?.[0] || 'yellow');
  const [p2, setP2] = useState('red');
  const [fighting, setFighting] = useState(false);
  const [map, setMap] = useState('traininggrounds');
  const [autoRecover, setAutoRecover] = useState(true);
  const [trainingSettingsOpen, setTrainingSettingsOpen] = useState(false);
  const ctl = useRef({ ...TRAINING_DEFAULTS });
  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);
  if (fighting) return <div className="relative w-full flex justify-center">
    <TrainingOverlay open={trainingSettingsOpen} onClose={() => setTrainingSettingsOpen(false)} ctl={ctl} p1={p1} p2={p2} onCharacters={(a,b)=>{setP1(a);setP2(b);ctl.current={...TRAINING_DEFAULTS};setTrainingSettingsOpen(false);setFighting(false);setTimeout(()=>setFighting(true),0);}} />
    <PlatformFighter p1Char={p1} p2Char={p2} p2IsCPU gameMode="regular" selectedMap={map} cpuDifficulty="beginner" dummy dummyAutoRecover={autoRecover} trainingMode trainingController={ctl.current} equippedAccessories={equippedAccessories} equippedSkins={equippedSkins} customCharsData={customCharsData} settings={settings || {}} onEnd={()=>setFighting(false)} />
  </div>;
  return <UniversalCharacterSelect title="TRAINING MODE" startLabel="START TRAINING" unlockedIds={unlockedIds} favoriteId={favoriteId} customCharsData={customCharsData} equippedSkins={equippedSkins} equippedAccessories={equippedAccessories} playerCount={2} allowLocked defaultCPUDifficulty="beginner" onStart={(c1,c2)=>{setP1(c1);setP2(c2);ctl.current={...TRAINING_DEFAULTS};setFighting(true);}} onBack={onBack} extraControls={<div className="flex gap-4 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2"><label className="text-[10px] font-heading text-foreground">STAGE:<select value={map} onChange={e=>setMap(e.target.value)} className="ml-1.5 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px]">{STAGE_LIST.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="flex items-center gap-1.5 text-[10px] font-heading text-foreground cursor-pointer"><input type="checkbox" checked={autoRecover} onChange={e=>setAutoRecover(e.target.checked)} className="w-3.5 h-3.5 accent-accent"/><span>Auto-Recover Dummy</span></label></div>} />;
}
