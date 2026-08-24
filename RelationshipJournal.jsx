import React from 'react';
import { PC_TRAITS, PC_PROFILES, PC_LIKES, PC_DISLIKES, PC_HOME_STYLES,
  PC_REPUTATIONS, PC_ACHIEVEMENTS, formatBirthday } from './personalCommunity.js';
import GameIcon from "./GameIcon.jsx";

const resolveChar = (id, custom) => (custom && custom[id]) || { id, name: id, color: '#888' };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// friendship label (one-directional: a's feeling toward b)
function friendLabel(rel) {
  if (!rel || !rel.met) return 'Stranger';
  const s = rel.friend;
  if (s >= 80) return 'Best Friends';
  if (s >= 60) return 'Good Friends';
  if (s >= 40) return 'Friends';
  if (s >= 20) return 'Talks';
  return 'Knows';
}
function romanceLabel(rel) {
  if (!rel) return 'None';
  return rel.romance === 'dating' ? 'Dating' : rel.romance === 'crushing' ? 'Crushing'
    : rel.romance === 'interested' ? 'Interested' : 'None';
}
function negLabel(rel) {
  if (!rel) return '';
  const n = rel.neg;
  if (n >= 60) return 'Enemy';
  if (n >= 40) return 'Avoiding';
  if (n >= 25) return 'Angry';
  if (n >= 12) return 'Rival';
  return n > 0 ? 'Annoyed' : '';
}

export default function RelationshipJournal({
  st, id, customCharsData, onClose, onBringOut, onInteract, onReconcile, getReputation, getLevel,
}) {
  const t = PC_TRAITS[id]; if (!t) return null;
  const ch = resolveChar(id, customCharsData);
  const r = st.residents[id]; if (!r) return null;
  const rels = st.rel?.[id] || {};
  // Reputation: only show people this character actually knows — met them,
  // or guardians/villains (known by everyone via lore).
  const others = Object.keys(st.residents).filter(o => {
    if (o === id) return false;
    const ot = PC_TRAITS[o];
    if (ot && (ot.category === 'Guardian' || ot.category === 'Villain')) return true;
    return rels[o] && rels[o].met;
  });
  const mems = (st.recent?.[id] || []).slice(0, 8);
  const ach = st.charAch?.[id] || {};
  const favLoc = r._favLoc || 'Around town';
  const favAct = r._favAct || 'Hanging out';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-4 max-w-lg w-full my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full border-2 border-border" style={{ background: ch.color }} />
            <div>
              <p className="font-heading text-xl text-accent">{ch.name}</p>
              <p className="text-[9px] font-heading text-muted-foreground">{t.category.toUpperCase()} · {t.gender.toUpperCase()} · LV {getLevel(id)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg"><GameIcon emoji="✕" size={14} /></button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-body mb-2">
          <p><span className="text-muted-foreground">Personality:</span> <span className="text-accent capitalize">{t.personality}</span></p>
          <p><span className="text-muted-foreground">Mood:</span> <span className="text-foreground">{r.mood}</span></p>
          <p><span className="text-muted-foreground">Birthday:</span> <span className="text-foreground">{r.birthday ? formatBirthday(r.birthday) : '—'}</span></p>
          <p><span className="text-muted-foreground">Reputation:</span> <span className="text-foreground">{getReputation(id)}</span></p>
          <p><span className="text-muted-foreground">Activity:</span> <span className="text-foreground">{r.activity}</span></p>
          <p><span className="text-muted-foreground">Job:</span> <span className="text-foreground">{r.job}</span></p>
          <p><span className="text-muted-foreground">Fav Place:</span> <span className="text-foreground">{favLoc}</span></p>
          <p><span className="text-muted-foreground">Fav Activity:</span> <span className="text-foreground">{favAct}</span></p>
          <p className="col-span-2"><span className="text-muted-foreground">Home:</span> <span className="text-foreground">{PC_HOME_STYLES[t.personality]}</span></p>
          <p><span className="text-muted-foreground">Likes:</span> <span className="text-foreground">{PC_LIKES[t.personality]}</span></p>
          <p><span className="text-muted-foreground">Dislikes:</span> <span className="text-foreground">{PC_DISLIKES[t.personality]}</span></p>
        </div>

        <Needs r={r} />

        {/* Achievements */}
        <div className="mt-2">
          <p className="text-[9px] font-heading text-muted-foreground mb-1">ACHIEVEMENTS</p>
          <div className="flex flex-wrap gap-1">
            {PC_ACHIEVEMENTS.filter(a => ach[a.id]).map(a => (
              <span key={a.id} title={a.desc} className="px-1.5 py-0.5 bg-accent/20 border border-accent rounded text-[8px] font-heading text-accent">{a.emoji} {a.name}</span>
            ))}
            {Object.keys(ach).length === 0 && <span className="text-[10px] text-muted-foreground">No achievements yet.</span>}
          </div>
        </div>

        {/* Recent activities */}
        <div className="mt-2">
          <p className="text-[9px] font-heading text-muted-foreground mb-1">RECENT ACTIVITIES</p>
          {mems.length === 0 && <p className="text-[10px] text-muted-foreground">Nothing yet today.</p>}
          <div className="flex flex-col gap-0.5 max-h-16 overflow-y-auto">
            {mems.map((m, i) => <p key={i} className="text-[10px] font-body text-foreground">{m}</p>)}
          </div>
        </div>

        {/* One-directional relationships: this character's opinion of EVERY other */}
        <div className="mt-2">
          <p className="text-[9px] font-heading text-muted-foreground mb-1">{ch.name.toUpperCase()}'S OPINIONS (one-directional)</p>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {others.map(oid => {
              const rel = rels[oid];
              const oc = resolveChar(oid, customCharsData);
              const fl = friendLabel(rel);
              const rl = romanceLabel(rel);
              const nl = negLabel(rel);
              const couple = st.couples?.some(c => c.a === id && c.b === oid) || (rel && rel.romance === 'dating' && (st.rel?.[oid]?.[id]?.romance === 'dating'));
              return (
                <div key={oid} className="px-2 py-1 rounded bg-muted/40 border border-border text-[10px] font-body flex items-center gap-1">
                  <span className="text-accent">{oc.name}</span>
                  <span className="text-muted-foreground"><GameIcon emoji="→" size={14} /></span>
                  <span className="text-foreground">{fl}</span>
                  {rl !== 'None' && <span className="text-pink-400"> <GameIcon emoji="❤" size={14} />{rl}</span>}
                  {couple && <span className="text-pink-400"> <GameIcon emoji="💍" size={14} /></span>}
                  {nl && <span className="text-red-400"> <GameIcon emoji="⚔" size={14} />{nl}</span>}
                  <button onClick={() => onInteract(oid)} className="ml-1 px-1.5 py-0.5 bg-primary/30 border border-primary text-primary rounded text-[8px] font-heading hover:bg-primary hover:text-primary-foreground">TALK</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Memories */}
        <Memories st={st} id={id} />

        {r.insideBid && (
          <button onClick={() => { onBringOut(id); onClose(); }} className="w-full mt-3 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="🚪" size={14} /> BRING OUTSIDE</button>
        )}
      </div>
    </div>
  );
}

function Needs({ r }) {
  const bars = [['Energy', r.energy, '#ffcc44'], ['Hunger', r.hunger, '#ff8844'], ['Social', r.social, '#66ccff'], ['Fun', r.fun, '#aa66ff']];
  return (
    <div className="grid grid-cols-4 gap-2">
      {bars.map(([n, v, c]) => (
        <div key={n}>
          <p className="text-[8px] font-heading text-muted-foreground">{n.toUpperCase()}</p>
          <div className="h-1.5 bg-muted rounded"><div className="h-full rounded" style={{ width: `${v}%`, background: c }} /></div>
        </div>
      ))}
    </div>
  );
}

function Memories({ st, id }) {
  const mems = [];
  const rels = st.rel?.[id] || {};
  for (const oid of Object.keys(rels)) {
    (rels[oid].memories || []).forEach(m => mems.push({ ...m, with: oid }));
  }
  mems.sort((a, b) => (b.day || 0) - (a.day || 0));
  return (
    <div className="mt-2">
      <p className="text-[9px] font-heading text-muted-foreground mb-1">MEMORIES</p>
      {mems.length === 0 && <p className="text-[10px] text-muted-foreground">No memories yet.</p>}
      <div className="flex flex-col gap-0.5 max-h-20 overflow-y-auto">
        {mems.slice(0, 8).map((m, i) => <p key={i} className="text-[10px] font-body text-foreground"><span className="text-muted-foreground">Day {m.day}:</span> {m.text}</p>)}
      </div>
    </div>
  );
}