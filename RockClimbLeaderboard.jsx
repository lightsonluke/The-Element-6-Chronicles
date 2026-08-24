import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { ALL_CHARS } from './sports.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

function charName(id, customCharsData) {
  if (customCharsData && customCharsData[id]) return customCharsData[id].name;
  const c = ALL_CHARS.find(c => c.id === id);
  return c?.name || id;
}

function fmtTime(ms) {
  if (!ms && ms !== 0) return '—';
  const total = Math.floor(ms / 10);
  const m = Math.floor(total / 6000);
  const s = Math.floor((total % 6000) / 100);
  const cs = total % 100;
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export default function RockClimbLeaderboard({ onBack, customCharsData = {} }) {
  const [tab, setTab] = useState('global');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const me = await db.auth.me().catch(() => null);
        const all = await db.entities.RockClimbScore.list('-created_date', 200);
        if (cancelled) return;
        const sorted = [...(all || [])].sort((a, b) => (a.time_ms || 0) - (b.time_ms || 0));
        const mapped = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
        setEntries(mapped);
        if (me) {
          const fr = await db.entities.Friendship.filter({ owner_user_id: me.id });
          if (cancelled) return;
          setFriends((fr || []).map(f => f.friend_user_id));
        }
      } catch { setEntries([]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = entries.filter(e => {
    if (tab === 'search') {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (e.user_name || '').toLowerCase().includes(q);
    }
    if (tab === 'friends') return friends.includes(e.user_id);
    return true;
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="⛰️" size={14} /> ROCK CLIMBING LEADERBOARD</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <div className="flex gap-2">
        {['global', 'friends', 'search'].map(t => (
          <button key={t} onClick={() => { setTab(t); sfx.click(); }}
            className={`px-4 py-1.5 rounded-lg font-heading text-xs uppercase tracking-wider transition ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'search' && (
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search username..."
          className="w-full max-w-sm px-3 py-2 rounded-lg bg-input text-foreground text-sm font-body border border-border" />
      )}
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_110px_100px_70px_90px] gap-2 px-4 py-2 bg-secondary/60 text-[10px] font-heading uppercase tracking-wider text-muted-foreground">
          <span>Rank</span><span>Player</span><span>Character</span><span className="text-right">Time</span><span className="text-right">CP</span><span className="text-right">Date</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground font-body">Loading rankings...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground font-body">No times yet — be the first to summit!</div>
          ) : filtered.map((e, i) => (
            <div key={e.id || i} className="grid grid-cols-[60px_1fr_110px_100px_70px_90px] gap-2 px-4 py-2 text-xs font-body border-t border-border/40 items-center hover:bg-accent/5">
              <span className="font-heading text-accent">#{e.rank || (i + 1)}</span>
              <span className="truncate text-foreground">{e.user_name || 'Unknown'}{e.no_checkpoint_run ? ' ⭐' : ''}</span>
              <span className="truncate text-muted-foreground">{e.char_name || charName(e.char_id, customCharsData)}</span>
              <span className="text-right font-heading text-primary">{fmtTime(e.time_ms)}</span>
              <span className="text-right text-muted-foreground">{e.checkpoints_used ?? '—'}</span>
              <span className="text-right text-muted-foreground text-[10px]">{e.created_date ? new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-body text-center">Times update automatically after every completed climb. <GameIcon emoji="⭐" size={14} /> = no-checkpoint run. Rock Climbing is single-player and offline.</p>
    </div>
  );
}

export { fmtTime };