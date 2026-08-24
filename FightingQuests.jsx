import React, { useState, useMemo, useEffect } from 'react';
import { generateFightQuests } from './fightingQuests.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
const nameOf = id => ALL.find(c => c.id === id)?.name || id;

export default function FightingQuests({ progress, onClaim, onNextTier, onBack }) {
  const [claimed, setClaimed] = useState(progress?.claimedFightQuests || []);
  const stats = progress?.stats || {};
  const tier = progress?.fightQuestTier || 0;

  const quests = useMemo(() => generateFightQuests(tier), [tier]);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const val = (q) => (stats[q.stat]?.[q.charId] || 0);
  const isDone = (q) => val(q) >= q.target;

  const allClaimed = quests.every(q => claimed.includes(q.id) || (progress?.claimedFightQuests || []).includes(q.id));

  const claim = (q) => {
    if (!isDone(q) || claimed.includes(q.id)) return;
    onClaim(q.id, q.reward);
    setClaimed([...claimed, q.id]);
  };

  const advance = () => {
    onNextTier?.();
    setClaimed([]);
  };

  const claimedSet = new Set([...claimed, ...(progress?.claimedFightQuests || [])]);

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">FIGHTING QUESTS</h2>
          <p className="text-xs text-muted-foreground font-body">Tier {tier + 1} • Complete all 8 to unlock a new set. Targets scale each tier.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      {allClaimed && (
        <div className="bg-accent/10 border border-accent rounded-xl p-4 text-center">
          <p className="font-heading text-sm text-accent mb-2"><GameIcon emoji="🎉" size={14} /> All Tier {tier + 1} quests complete!</p>
          <button onClick={advance} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-80">GENERATE TIER {tier + 2}</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {quests.map(q => {
          const v = val(q); const done = isDone(q); const cl = claimedSet.has(q.id);
          const pct = Math.min(100, (v / q.target) * 100);
          return (
            <div key={q.id} className={`bg-card border rounded-xl p-3 ${done ? 'border-accent' : 'border-border'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-heading text-sm text-foreground">{q.title}</p>
                <span className="text-[10px] text-accent font-heading">{q.reward} <GameIcon emoji="◆" size={14} /></span>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-2">{q.desc}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: done ? '#FFD700' : '#7744FF' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-body">{Math.floor(v)} / {q.target}</span>
                {done && !cl && <button onClick={() => claim(q)} className="px-3 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px] hover:opacity-80">CLAIM</button>}
                {cl && <span className="text-[10px] text-green-400 font-heading"><GameIcon emoji="✓" size={14} /> CLAIMED</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}