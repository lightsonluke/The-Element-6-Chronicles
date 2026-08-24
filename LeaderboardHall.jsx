import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { getCharLevelData } from './elements.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Leaderboard Hall — aggregates the LeaderboardEntry entity into a browsable,
// searchable ranking hall with sport-specific tabs and per-player profiles.
export default function LeaderboardHall({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overall');
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    db.entities.LeaderboardEntry.list('-total_xp', 200).then(list => {
      setEntries(list || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const metric = (e, t) => {
    switch (t) {
      case 'overall': return e.total_xp || 0;
      case 'ranked': return 0; // ranked rating stored on user; show wins proxy
      case 'wins': return e.wins || 0;
      case 'kos': return e.combat_kills || 0;
      case 'soccer': return e.soccer_xp || 0;
      case 'basketball': return e.basketball_xp || 0;
      case 'baseball': return e.baseball_xp || 0;
      case 'volleyball': return e.volleyball_xp || 0;
      case 'tennis': return e.tennis_xp || 0;
      case 'track': return e.track_xp || 0;
      default: return 0;
    }
  };
  const sorted = (entries || [])
    .filter(e => !query || (e.user_name || '').toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => metric(b, tab) - metric(a, tab));

  const TABS = ['overall', 'wins', 'kos', 'soccer', 'basketball', 'baseball', 'volleyball', 'tennis', 'track'];

  return (
    <div className="w-full max-w-5xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-heading text-xl text-accent tracking-wider"><GameIcon emoji="🏛" size={14} /> LEADERBOARD HALL</h2>
        <button onClick={onBack} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search username…"
        className="w-full bg-secondary text-secondary-foreground rounded px-3 py-2 text-xs font-heading mb-3" />
      <div className="flex gap-1.5 flex-wrap mb-3">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); sfx.click(); }}
            className={`px-3 py-1 rounded font-heading text-[10px] uppercase ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{t}</button>
        ))}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading rankings…</p> : (
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {sorted.length === 0 && <p className="text-xs text-muted-foreground italic">No players found.</p>}
          {sorted.map((e, i) => (
            <button key={e.id} onClick={() => { setProfile(e); sfx.click(); }}
              className="w-full flex items-center gap-3 bg-muted/30 hover:bg-muted/60 rounded-lg px-3 py-2 text-left">
              <span className="font-heading text-sm text-accent w-8">{i + 1}</span>
              <span className="font-heading text-xs text-foreground flex-1">{e.user_name || 'Player'}</span>
              <span className="text-[10px] text-muted-foreground">{tab === 'overall' ? 'XP' : tab.toUpperCase()}</span>
              <span className="font-heading text-xs text-primary">{metric(e, tab)}</span>
            </button>
          ))}
        </div>
      )}
      {profile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setProfile(null)}>
          <div className="bg-card border-2 border-accent rounded-xl p-5 w-96 max-w-[94%]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-heading text-base text-accent">{profile.user_name || 'Player'}</h3>
              <button onClick={() => setProfile(null)} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-body">
              <Stat label="Total XP" v={profile.total_xp} />
              <Stat label="Wins" v={profile.wins} />
              <Stat label="Losses" v={profile.losses} />
              <Stat label="KOs" v={profile.combat_kills} />
              <Stat label="Fights" v={profile.fight_count} />
              <Stat label="Soccer XP" v={profile.soccer_xp} />
              <Stat label="Basketball XP" v={profile.basketball_xp} />
              <Stat label="Baseball XP" v={profile.baseball_xp} />
              <Stat label="Volleyball XP" v={profile.volleyball_xp} />
              <Stat label="Tennis XP" v={profile.tennis_xp} />
              <Stat label="Track XP" v={profile.track_xp} />
              <Stat label="Track Best (s)" v={profile.track_best_time || '—'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, v }) { return <div className="flex justify-between bg-muted/30 rounded px-2 py-1"><span className="text-muted-foreground">{label}</span><span className="font-heading text-foreground">{v || 0}</span></div>; }