import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GameIcon from "./GameIcon.jsx";
import HonoredBotTracking from './HonoredBotTracking.jsx';

const FILTERS = [
  { key: 'overall', label: 'OVERALL' },
  { key: 'soccer', label: 'SOCCER' },
  { key: 'combat', label: 'COMBAT' },
  { key: 'ranked', label: 'RANKED' },
  { key: 'honored', label: '👑 HONORED' },
];

function getRank(elo) {
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
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('overall');
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await db.auth.me().catch(() => null);
        if (user) setMyId(user.id);
        const data = await db.entities.LeaderboardEntry.list('-total_xp', 200);
        setEntries(data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const getXp = (e) => {
    if (filter === 'soccer') return e.soccer_xp || 0;
    if (filter === 'combat') return e.combat_xp || 0;
    if (filter === 'ranked') return e.wins || 0; // sort ranked by wins
    return e.total_xp || 0;
  };

  const getRankedElo = (e) => e.ranked_elo || 1000;

  const sorted = [...entries].sort((a, b) => {
    if (filter === 'ranked') return getRankedElo(b) - getRankedElo(a);
    return getXp(b) - getXp(a);
  });
  const top10 = sorted.slice(0, 10);

  const chartData = top10.map(e => ({
    name: (e.user_name || 'Player').slice(0, 10),
    Value: filter === 'ranked' ? getRankedElo(e) : getXp(e),
  }));

  const myRank = myId ? sorted.findIndex(e => e.user_id === myId) : -1;

  if (filter === 'honored') {
    return <HonoredBotTracking onBack={onBack} />;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">LEADERBOARD</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-5 py-2 rounded-lg font-heading text-sm ${filter === f.key ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body py-8">No entries yet. Play some matches!</p>
      ) : (
        <>
          <div className="w-full bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-heading text-muted-foreground mb-2">
              TOP 10 — {filter === 'ranked' ? 'RANKED ELO' : `${filter.toUpperCase()} XP`}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {myRank >= 0 && (
            <div className="w-full bg-primary/15 border-2 border-primary rounded-xl p-3 flex items-center gap-3">
              <span className="font-heading text-2xl text-primary">#{myRank + 1}</span>
              <div className="flex-1">
                <span className="font-heading text-sm">YOUR RANK</span>
                <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                  {filter === 'ranked' ? (
                    <>
                      <span>ELO: {getRankedElo(sorted[myRank])}</span>
                      <span>Rank: {getRank(getRankedElo(sorted[myRank]))}</span>
                    </>
                  ) : (
                    <span>XP: {getXp(sorted[myRank])}</span>
                  )}
                  <span>W: {sorted[myRank].wins || 0}</span>
                  <span>L: {sorted[myRank].losses || 0}</span>
                </div>
              </div>
            </div>
          )}

          <div className="w-full space-y-1 max-h-[400px] overflow-y-auto">
            {sorted.map((e, i) => (
              <div key={e.id || i} className={`flex items-center gap-3 p-2 rounded-lg border ${e.user_id === myId ? 'border-primary bg-primary/10' : 'border-border bg-card/50'}`}>
                <span className="font-heading text-lg w-8 text-center" style={{ color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'hsl(var(--muted-foreground))' }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-heading text-sm truncate block">{e.user_name || 'Player'}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    {filter === 'ranked' ? (
                      <>
                        <span>ELO: {getRankedElo(e)}</span>
                        <span className="text-accent">{getRank(getRankedElo(e))}</span>
                        <span>W: {e.wins || 0}</span>
                        <span>L: {e.losses || 0}</span>
                      </>
                    ) : (
                      <>
                        <span>XP: {getXp(e)}</span>
                        <span>W: {e.wins || 0}</span>
                        <span>L: {e.losses || 0}</span>
                        {filter === 'soccer' && <span><GameIcon emoji="⚽" size={14} /> {e.soccer_goals || 0}</span>}
                        {filter === 'soccer' && <span><GameIcon emoji="🧤" size={14} /> {e.soccer_saves || 0}</span>}
                        {filter === 'combat' && <span><GameIcon emoji="⚔" size={14} /> {e.combat_kills || 0}</span>}
                        {filter === 'combat' && <span><GameIcon emoji="💀" size={14} /> {e.combat_deaths || 0}</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}