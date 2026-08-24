import React, { useState, useEffect } from 'react';
import { STAGE_LIST } from './stages.js';
import { music } from './music.js';
import PlatformFighter from './PlatformFighter.jsx';
import UniversalCharacterSelect from './UniversalCharacterSelect.jsx';

export default function TrainingMode({ unlockedIds, favoriteId, onBack, equippedAccessories = {}, equippedSkins = {}, customCharsData = {} }) {
  const [p1, setP1] = useState(favoriteId || unlockedIds?.[0] || 'yellow');
  const [p2, setP2] = useState('red');
  const [fighting, setFighting] = useState(false);
  const [map, setMap] = useState('traininggrounds');
  const [autoRecover, setAutoRecover] = useState(true);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  if (fighting) {
    return (
      <PlatformFighter
        p1Char={p1} p2Char={p2} p2IsCPU
        gameMode="regular" selectedMap={map} cpuDifficulty="beginner"
        dummy
        dummyAutoRecover={autoRecover}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        onEnd={() => setFighting(false)}
      />
    );
  }

  return (
    <UniversalCharacterSelect
      title="TRAINING MODE"
      startLabel="START TRAINING"
      unlockedIds={unlockedIds}
      favoriteId={favoriteId}
      customCharsData={customCharsData}
      equippedSkins={equippedSkins}
      equippedAccessories={equippedAccessories}
      playerCount={2}
      allowLocked
      defaultCPUDifficulty="beginner"
      onStart={(c1, c2) => { setP1(c1); setP2(c2); setFighting(true); }}
      onBack={onBack}
      extraControls={
        <div className="flex gap-4 flex-wrap items-center justify-center bg-card/60 border border-border rounded-lg p-2">
          <label className="text-[10px] font-heading text-foreground">STAGE:
            <select value={map} onChange={e => setMap(e.target.value)} className="ml-1.5 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px]">
              {STAGE_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-heading text-foreground cursor-pointer">
            <input type="checkbox" checked={autoRecover} onChange={e => setAutoRecover(e.target.checked)} className="w-3.5 h-3.5 accent-accent" />
            <span>Auto-Recover Dummy</span>
          </label>
        </div>
      }
    />
  );
}