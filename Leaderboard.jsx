import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { loadSharedLeaderboard } from './sharedLeaderboard.js';
import HonoredBotTracking from './HonoredBotTracking.jsx';
import GameIcon from './GameIcon.jsx';

const FILTERS = [
  ['overall','OVERALL'], ['soccer','SOCCER'], ['combat','COMBAT'], ['ranked','RANKED'],
  ['parkour','PARKOUR'], ['rockclimb','ROCK CLIMBING'], ['zipline','ZIPLINING'], ['honored','👑 HONORED BOT']
];

function rankName(elo) {
  if (elo >= 2400) return 'Legend';
  if (elo >= 2100) return 'Grandmaster';
  if (elo >= 1800) return 'Master';
  if (elo >= 1550) return 'Diamond';
  if (elo >= 1300) return 'Platinum';
  if (elo >= 1100) return 'Gold';
  if (elo >= 950) return 'Silver';
  if (elo >= 800) return 'Bronze';
  return 'Iron';
}

export default function Leaderboard({ onBack }) {
  const [filter, setFilter] = useState('overall');
  const [entries, setEntries] = useState([]);
  const [world, setWorld] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (alive) setMyId(data?.user?.id || null);
        const shared = await loadSharedLeaderboard().catch(() => []);
        const { data: worldRows } = await supabase.from('element6_world_scores')
          .select('user_id,username,mode,score,score_meta,updated_at')
          .in('mode', ['parkour','rockclimb','zipline'])
          .limit(600);
        if (alive) {
          setEntries(shared || []);
          setWorld(worldRows || []);
        }
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    if (filter === 'parkour' || filter === 'rockclimb' || filter === 'zipline') {
      return world.filter(r => r.mode === filter)
        .sort((a,b) => filter === 'rockclimb' ? Number(a.score)-Number(b.score) : Number(b.score)-Number(a.score))
        .map((r,i) => ({ ...r, rank: i+1, value: r.score }));
    }
    return [...entries].sort((a,b) => {
      if (filter === 'ranked') return Number(b.ranked_elo ?? b.ranked_rating ?? 1000) - Number(a.ranked_elo ?? a.ranked_rating ?? 1000);
      if (filter === 'soccer') return Number(b.soccer_xp || 0) - Number(a.soccer_xp || 0);
      if (filter === 'combat') return Number(b.combat_xp || 0) - Number(a.combat_xp || 0);
      return Number(b.total_xp || 0) - Number(a.total_xp || 0);
    }).map((r,i) => ({ ...r, rank: i+1, value:
      filter === 'ranked' ? Number(r.ranked_elo ?? r.ranked_rating ?? 1000) :
      filter === 'soccer' ? Number(r.soccer_xp || 0) :
      filter === 'combat' ? Number(r.combat_xp || 0) : Number(r.total_xp || 0)
    }));
  }, [filter, entries, world]);

  if (filter === 'honored') return <HonoredBotTracking onBack={onBack} />;

  const mine = rows.findIndex(r => r.user_id === myId);
  const label = filter === 'rockclimb' ? 'TIME (LOWER IS BETTER)' :
    filter === 'ranked' ? 'ELO' : filter === 'parkour' || filter === 'zipline' ? 'DISTANCE' : 'XP';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">LEADERBOARD</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {FILTERS.map(([key,labelText]) => <button key={key} onClick={()=>setFilter(key)}
          className={`px-3 py-2 rounded-lg font-heading text-[10px] ${filter===key?'bg-accent text-accent-foreground':'bg-secondary text-secondary-foreground'}`}>{labelText}</button>)}
      </div>
      {loading ? <div className="py-12 text-muted-foreground">Loading rankings…</div> :
        <div className="w-full space-y-1 max-h-[65vh] overflow-y-auto">
          {rows.length === 0 && <div className="py-12 text-center text-muted-foreground">No scores recorded yet.</div>}
          {rows.map((r,i) => {
            const name = r.username || r.user_name || 'Player';
            const elo = Number(r.ranked_elo ?? r.ranked_rating ?? 1000);
            return <div key={`${r.user_id}-${r.mode || filter}`} className={`flex items-center gap-3 rounded-lg border p-3 ${r.user_id===myId?'border-primary bg-primary/10':'border-border bg-card/60'}`}>
              <span className="font-heading w-10 text-center text-accent">#{i+1}</span>
              <span className="font-heading text-sm flex-1 truncate">{name}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="font-heading text-sm text-primary">{filter==='rockclimb' ? `${(Number(r.value)/1000).toFixed(2)}s` : filter==='parkour'||filter==='zipline' ? `${Math.round(Number(r.value))}m` : Math.round(Number(r.value))}</span>
              {filter==='ranked' && <span className="text-[10px] text-accent">{rankName(elo)}</span>}
            </div>;
          })}
        </div>}
      {mine >= 0 && <div className="w-full rounded-xl border-2 border-primary bg-primary/10 p-3 text-xs">YOUR RANK: <b>#{mine+1}</b> · {label}: <b>{rows[mine].value}</b></div>}
    </div>
  );
}
